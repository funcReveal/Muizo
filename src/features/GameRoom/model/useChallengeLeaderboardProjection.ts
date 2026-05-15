/**
 * useChallengeLeaderboardProjection
 *
 * In-game projected challenge leaderboard data.
 *
 * Security: never sends score/rank to backend. The backend derives all
 * ranking data from server-authoritative room state.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@shared/auth/AuthContext";
import { ensureFreshAuthToken } from "@shared/auth/token";
import { API_URL } from "@domain/room/constants";
import { fetchProjectedWindow } from "./challengeLeaderboardProjectionApi";
import type {
  ChallengeProjectedLeaderboardResponse,
  ChallengeProjectionState,
} from "./projectionTypes";

export const CLIENT_COOLDOWN_MS = 4_000;
export const PROJECTION_CACHE_FRESH_MS = 15_000;
const DEFAULT_429_RETRY_AFTER_MS = CLIENT_COOLDOWN_MS;
/** Random jitter applied to the initial fetch to spread the game-start storm. */
const INITIAL_JITTER_MAX_MS = 1_500;

export type ProjectionFetchReason =
  | "initial"
  | "manual"
  | "page_visible"
  | "auth_ready"
  | "nearby_boundary_crossed";

export type ProjectionCacheEntry = {
  data: ChallengeProjectedLeaderboardResponse | null;
  loadedAt: number;
  inFlight: Promise<ChallengeProjectedLeaderboardResponse | null> | null;
  nextAllowedAt: number;
  lastFetchAt: number;
  lastErrorAt: number;
  lastErrorStatus: number | null;
  initialScheduled: boolean;
};

type InternalProjectionState = ChallengeProjectionState & {
  cacheKey: string;
  sessionKey: string;
};

type FetchDecision =
  | { shouldFetch: true }
  | {
      shouldFetch: false;
      cause: "fresh_cache" | "in_flight" | "server_cooldown" | "client_cooldown";
    };

export const projectionCacheByKey = new Map<string, ProjectionCacheEntry>();
const devLogLastAtByKey = new Map<string, number>();

export function getProjectionCacheKey(
  roomId: string,
  projectionSessionKey: string,
  meClientId: string,
): string {
  return `${roomId}:${projectionSessionKey}:${meClientId}`;
}

export function getProjectionSessionKey({
  roomId,
  gameSessionId,
}: {
  roomId: string;
  gameSessionId?: string | number | null;
}): string {
  return gameSessionId !== null && gameSessionId !== undefined
    ? `session:${gameSessionId}`
    : `room:${roomId}`;
}

export function getProjectionCacheEntry(key: string): ProjectionCacheEntry {
  const existing = projectionCacheByKey.get(key);
  if (existing) return existing;

  const entry: ProjectionCacheEntry = {
    data: null,
    loadedAt: 0,
    inFlight: null,
    nextAllowedAt: 0,
    lastFetchAt: 0,
    lastErrorAt: 0,
    lastErrorStatus: null,
    initialScheduled: false,
  };
  projectionCacheByKey.set(key, entry);
  return entry;
}

function patchProjectionCacheEntry(
  key: string,
  patch: Partial<ProjectionCacheEntry>,
): ProjectionCacheEntry {
  const entry = getProjectionCacheEntry(key);
  Object.assign(entry, patch);
  return entry;
}

export function cancelScheduledInitialProjectionFetch(key: string): void {
  const entry = getProjectionCacheEntry(key);
  if (entry.initialScheduled && !entry.inFlight && !entry.data) {
    patchProjectionCacheEntry(key, { initialScheduled: false });
  }
}

export function shouldUseFreshProjectionCache(
  entry: ProjectionCacheEntry,
  now: number,
): boolean {
  return entry.data !== null && now - entry.loadedAt < PROJECTION_CACHE_FRESH_MS;
}

export function shouldStartProjectionFetch({
  entry,
  now,
  force,
  clientCooldownMs,
}: {
  entry: ProjectionCacheEntry;
  now: number;
  force: boolean;
  clientCooldownMs: number;
}): FetchDecision {
  if (now < entry.nextAllowedAt) {
    return { shouldFetch: false, cause: "server_cooldown" };
  }

  if (!force && shouldUseFreshProjectionCache(entry, now)) {
    return { shouldFetch: false, cause: "fresh_cache" };
  }

  if (entry.inFlight) {
    return { shouldFetch: false, cause: "in_flight" };
  }

  if (
    clientCooldownMs > 0 &&
    entry.lastFetchAt > 0 &&
    now - entry.lastFetchAt < clientCooldownMs
  ) {
    return { shouldFetch: false, cause: "client_cooldown" };
  }

  return { shouldFetch: true };
}

function getClientCooldownMs(reason: ProjectionFetchReason): number {
  switch (reason) {
    case "manual":
      return CLIENT_COOLDOWN_MS;
    case "nearby_boundary_crossed":
      return 0;
    case "auth_ready":
    case "initial":
    case "page_visible":
      return 0;
  }
}

export function shouldRefetchNearbyWindow(
  previousScore: number,
  newScore: number,
  data: ChallengeProjectedLeaderboardResponse | null,
): boolean {
  if (newScore <= previousScore) return false;
  if (!data) return true;
  if (data.nearbyOpponents.length === 0) return false;

  const hadAheadBefore = data.nearbyOpponents.some(
    (opponent) => opponent.bestScore >= previousScore,
  );
  if (!hadAheadBefore) return false;

  return data.nearbyOpponents.some(
    (opponent) =>
      opponent.bestScore >= previousScore && opponent.bestScore <= newScore,
  );
}

function devLog(
  event:
    | "boundary crossed"
    | "fetch started"
    | "fetch skipped"
    | "fetch 429"
    | "fetch success",
  details: Record<string, unknown>,
): void {
  if (import.meta.env.DEV) {
    const reason = typeof details.reason === "string" ? details.reason : "";
    const cause = typeof details.cause === "string" ? details.cause : "";
    const cacheKey = typeof details.cacheKey === "string" ? details.cacheKey : "";
    if (event === "fetch skipped" && cause === "fresh_cache") {
      const logKey = `${event}:${reason}:${cause}:${cacheKey}`;
      const now = Date.now();
      const lastAt = devLogLastAtByKey.get(logKey) ?? 0;
      if (now - lastAt < 5_000) return;
      devLogLastAtByKey.set(logKey, now);
    }
    console.info(`[challengeLeaderboardProjection] ${event}`, details);
  }
}

export type UseChallengeLeaderboardProjectionInput = {
  enabled: boolean;
  roomId: string;
  meClientId: string;
  myLiveScore: number;
  canLoadInitialProjection: boolean;
  projectionSessionKey: string;
  initialFetchJitterMs?: number;
};

export type UseChallengeLeaderboardProjectionResult = {
  state: ChallengeProjectionState;
  refresh: () => void;
  gainAnimKey: number;
  gainAmount: number;
};

export function useChallengeLeaderboardProjection(
  input: UseChallengeLeaderboardProjectionInput,
): UseChallengeLeaderboardProjectionResult {
  const {
    enabled,
    roomId,
    meClientId,
    myLiveScore,
    canLoadInitialProjection,
    projectionSessionKey,
    initialFetchJitterMs = INITIAL_JITTER_MAX_MS,
  } = input;

  const { authToken, refreshAuthToken, authLoading } = useAuth();
  const cacheKey = useMemo(
    () => getProjectionCacheKey(roomId, projectionSessionKey, meClientId),
    [roomId, projectionSessionKey, meClientId],
  );
  const [state, setState] = useState<InternalProjectionState>(() => {
    const entry = getProjectionCacheEntry(cacheKey);
    return entry.data
      ? {
          status: "loaded",
          data: entry.data,
          loadedAt: entry.loadedAt,
          cacheKey,
          sessionKey: projectionSessionKey,
        }
      : {
          status: "idle",
          cacheKey,
          sessionKey: projectionSessionKey,
        };
  });

  const loadedDataRef = useRef<ChallengeProjectedLeaderboardResponse | null>(
    state.status === "loaded" ? state.data : null,
  );
  const mountedRef = useRef(true);
  const jitterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boundaryRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const gainAnimKeyRef = useRef(0);
  const pendingBoundaryRefreshRef = useRef(false);
  const [gainState, setGainState] = useState<{ key: number; amount: number }>(
    {
      key: 0,
      amount: 0,
    },
  );
  const [boundaryRetryToken, setBoundaryRetryToken] = useState(0);
  const latestLiveScoreRef = useRef(myLiveScore);
  const prevLiveScoreRef = useRef(myLiveScore);
  const prevAuthLoadingRef = useRef(authLoading);

  const hydrateFromEntry = useCallback(
    (entry: ProjectionCacheEntry): boolean => {
      if (!entry.data) return false;
      loadedDataRef.current = entry.data;
      if (mountedRef.current) {
        setState({
          status: "loaded",
          data: entry.data,
          loadedAt: entry.loadedAt,
          cacheKey,
          sessionKey: projectionSessionKey,
        });
      }
      return true;
    },
    [cacheKey, projectionSessionKey],
  );

  const clearJitterTimer = useCallback(() => {
    if (jitterTimerRef.current !== null) {
      clearTimeout(jitterTimerRef.current);
      jitterTimerRef.current = null;
    }
  }, []);

  const clearBoundaryRetryTimer = useCallback(() => {
    if (boundaryRetryTimerRef.current !== null) {
      clearTimeout(boundaryRetryTimerRef.current);
      boundaryRetryTimerRef.current = null;
    }
  }, []);

  const cancelInitialFetchSchedule = useCallback(() => {
    clearJitterTimer();
    cancelScheduledInitialProjectionFetch(cacheKey);
  }, [cacheKey, clearJitterTimer]);

  const doFetch = useCallback(
    async (reason: ProjectionFetchReason) => {
      if (!enabled || !roomId || authLoading) return;

      const entry = getProjectionCacheEntry(cacheKey);
      const now = Date.now();
      const force = reason === "manual" || reason === "nearby_boundary_crossed";
      const clientCooldownMs = getClientCooldownMs(reason);
      const decision = shouldStartProjectionFetch({
        entry,
        now,
        force,
        clientCooldownMs,
      });

      if (!decision.shouldFetch) {
        devLog("fetch skipped", {
          reason,
          cacheKey,
          cause: decision.cause,
          ageMs: entry.loadedAt > 0 ? now - entry.loadedAt : null,
          nextAllowedInMs: Math.max(0, entry.nextAllowedAt - now),
          lastFetchAgoMs: entry.lastFetchAt > 0 ? now - entry.lastFetchAt : null,
          hasData: entry.data !== null,
        });
        if (decision.cause === "fresh_cache" || entry.data) {
          hydrateFromEntry(entry);
        }
        if (decision.cause === "in_flight" && entry.inFlight) {
          if (reason === "nearby_boundary_crossed") {
            pendingBoundaryRefreshRef.current = true;
          }
          const data = await entry.inFlight;
          if (data) hydrateFromEntry(entry);
          if (
            reason === "nearby_boundary_crossed" &&
            mountedRef.current &&
            pendingBoundaryRefreshRef.current
          ) {
            setBoundaryRetryToken((value) => value + 1);
          }
        }
        if (
          reason === "nearby_boundary_crossed" &&
          (decision.cause === "client_cooldown" ||
            decision.cause === "server_cooldown")
        ) {
          pendingBoundaryRefreshRef.current = true;
          const retryAt =
            decision.cause === "server_cooldown"
              ? entry.nextAllowedAt
              : entry.lastFetchAt + clientCooldownMs;
          clearBoundaryRetryTimer();
          boundaryRetryTimerRef.current = setTimeout(() => {
            boundaryRetryTimerRef.current = null;
            if (!mountedRef.current || !pendingBoundaryRefreshRef.current) return;
            setBoundaryRetryToken((value) => value + 1);
          }, Math.max(0, retryAt - Date.now()));
        }
        return;
      }

      patchProjectionCacheEntry(cacheKey, { lastFetchAt: now });
      if (reason === "nearby_boundary_crossed") {
        pendingBoundaryRefreshRef.current = false;
        clearBoundaryRetryTimer();
      }
      devLog("fetch started", {
        reason,
        cacheKey,
        hasCachedData: entry.data !== null,
        previousLoadedAt: entry.loadedAt || null,
      });

      if (!entry.data && mountedRef.current) {
        setState((prev) =>
          prev.status === "loaded" && prev.cacheKey === cacheKey
            ? prev
            : { status: "loading", cacheKey, sessionKey: projectionSessionKey },
        );
      }

      const requestPromise = (async () => {
        try {
          const token = authToken
            ? await ensureFreshAuthToken({ token: authToken, refreshAuthToken })
            : null;
          const result = await fetchProjectedWindow({
            apiUrl: API_URL ?? "",
            roomId,
            token,
            clientId: meClientId,
          });

          const completedAt = Date.now();
          if (result.ok) {
            patchProjectionCacheEntry(cacheKey, {
              data: result.data,
              loadedAt: completedAt,
              lastErrorAt: 0,
              lastErrorStatus: null,
            });
            devLog("fetch success", {
              reason,
              cacheKey,
              projectedRank: result.data.myStanding.projectedRank,
              liveScore: result.data.myStanding.liveScore,
              nearbyCount: result.data.nearbyOpponents.length,
              nearby: result.data.nearbyOpponents.map((opponent) => ({
                rank: opponent.rank,
                score: opponent.bestScore,
                relation: opponent.relation,
                gap: opponent.gapFromMe,
                name: opponent.displayName,
              })),
              topCount: result.data.topEntries.length,
              cacheSource: result.data.cache.source,
              ttlMs: result.data.cache.ttlMs,
            });
            return result.data;
          }

          const failedEntry = getProjectionCacheEntry(cacheKey);
          const nextPatch: Partial<ProjectionCacheEntry> = {
            lastErrorAt: completedAt,
            lastErrorStatus: result.status,
          };
          if (result.status === 429) {
            const retryAfterMs =
              result.retryAfterMs ?? DEFAULT_429_RETRY_AFTER_MS;
            nextPatch.nextAllowedAt = Math.max(
              failedEntry.nextAllowedAt,
              completedAt + retryAfterMs,
            );
            devLog("fetch 429", {
              reason,
              cacheKey,
              retryAfterMs,
              nextAllowedAt: nextPatch.nextAllowedAt,
            });
          }
          patchProjectionCacheEntry(cacheKey, nextPatch);
          return null;
        } catch {
          const failedAt = Date.now();
          patchProjectionCacheEntry(cacheKey, {
            lastErrorAt: failedAt,
            lastErrorStatus: 0,
          });
          return null;
        }
      })();

      patchProjectionCacheEntry(cacheKey, { inFlight: requestPromise });
      const data = await requestPromise;

      if (getProjectionCacheEntry(cacheKey).inFlight === requestPromise) {
        patchProjectionCacheEntry(cacheKey, { inFlight: null });
      }

      if (!mountedRef.current) return;

      if (data) {
        const successEntry = getProjectionCacheEntry(cacheKey);
        loadedDataRef.current = data;
        setState({
          status: "loaded",
          data,
          loadedAt: successEntry.loadedAt,
          cacheKey,
          sessionKey: projectionSessionKey,
        });
        return;
      }

      const completedEntry = getProjectionCacheEntry(cacheKey);
      if (completedEntry.data) {
        hydrateFromEntry(completedEntry);
        return;
      }

      setState((prev) => {
        if (prev.status === "loaded" && prev.cacheKey === cacheKey) return prev;
        const message =
          completedEntry.lastErrorStatus === 429
            ? "排行榜更新太頻繁，稍後再試"
            : "排行榜暫時無法載入";
        return { status: "error", message, cacheKey, sessionKey: projectionSessionKey };
      });
    },
    [
      enabled,
      roomId,
      authLoading,
      cacheKey,
      hydrateFromEntry,
      clearBoundaryRetryTimer,
      projectionSessionKey,
      authToken,
      refreshAuthToken,
      meClientId,
    ],
  );

  useEffect(() => {
    latestLiveScoreRef.current = myLiveScore;
  }, [myLiveScore]);

  useEffect(() => {
    mountedRef.current = true;
    const entry = getProjectionCacheEntry(cacheKey);
    if (entry.data) {
      queueMicrotask(() => hydrateFromEntry(entry));
    } else {
      loadedDataRef.current = null;
      queueMicrotask(() => {
        if (mountedRef.current) {
          setState({ status: "idle", cacheKey, sessionKey: projectionSessionKey });
        }
      });
    }
    prevLiveScoreRef.current = latestLiveScoreRef.current;
    gainAnimKeyRef.current = 0;
    pendingBoundaryRefreshRef.current = false;
    queueMicrotask(() => {
      if (mountedRef.current) {
        setGainState({ key: 0, amount: 0 });
      }
    });
    return () => {
      mountedRef.current = false;
      cancelInitialFetchSchedule();
      clearBoundaryRetryTimer();
    };
  }, [
    cacheKey,
    projectionSessionKey,
    hydrateFromEntry,
    cancelInitialFetchSchedule,
    clearBoundaryRetryTimer,
  ]);

  useEffect(() => {
    if (!enabled || !canLoadInitialProjection) return;

    const entry = getProjectionCacheEntry(cacheKey);
    const now = Date.now();
    if (shouldUseFreshProjectionCache(entry, now)) {
      devLog("fetch skipped", { reason: "initial", cacheKey, cause: "fresh_cache" });
      queueMicrotask(() => hydrateFromEntry(entry));
      return;
    }
    if (entry.data || entry.inFlight || entry.initialScheduled) return;

    patchProjectionCacheEntry(cacheKey, { initialScheduled: true });

    const fire = () => {
      jitterTimerRef.current = null;
      if (document.hidden) {
        patchProjectionCacheEntry(cacheKey, { initialScheduled: false });
        return;
      }
      patchProjectionCacheEntry(cacheKey, { initialScheduled: false });
      void doFetch("initial");
    };

    const jitter = Math.max(0, initialFetchJitterMs);
    const delay = jitter <= 0 ? 0 : Math.random() * jitter;
    jitterTimerRef.current = setTimeout(fire, delay);

    return cancelInitialFetchSchedule;
  }, [
    enabled,
    canLoadInitialProjection,
    cacheKey,
    doFetch,
    hydrateFromEntry,
    initialFetchJitterMs,
    cancelInitialFetchSchedule,
  ]);

  useEffect(() => {
    const onVisible = () => {
      if (document.hidden || !enabled || !canLoadInitialProjection) return;
      const entry = getProjectionCacheEntry(cacheKey);
      if (entry.data && shouldUseFreshProjectionCache(entry, Date.now())) {
        devLog("fetch skipped", {
          reason: "page_visible",
          cacheKey,
          cause: "fresh_cache",
        });
        hydrateFromEntry(entry);
        return;
      }
      if (!entry.data || Date.now() - entry.loadedAt >= PROJECTION_CACHE_FRESH_MS) {
        void doFetch("page_visible");
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled, canLoadInitialProjection, cacheKey, doFetch, hydrateFromEntry]);

  useEffect(() => {
    const wasLoading = prevAuthLoadingRef.current;
    prevAuthLoadingRef.current = authLoading;
    if (!wasLoading || authLoading) return;
    if (!enabled || !canLoadInitialProjection) return;

    const entry = getProjectionCacheEntry(cacheKey);
    if (entry.data) {
      devLog("fetch skipped", {
        reason: "auth_ready",
        cacheKey,
        cause: "fresh_cache",
      });
      queueMicrotask(() => hydrateFromEntry(entry));
      return;
    }
    queueMicrotask(() => {
      void doFetch("auth_ready");
    });
  }, [
    authLoading,
    enabled,
    canLoadInitialProjection,
    cacheKey,
    hydrateFromEntry,
    doFetch,
  ]);

  useEffect(() => {
    const prev = prevLiveScoreRef.current;
    prevLiveScoreRef.current = myLiveScore;

    if (myLiveScore <= prev) return;

    const delta = myLiveScore - prev;
    gainAnimKeyRef.current += 1;
    setGainState({ key: gainAnimKeyRef.current, amount: delta });

    if (!canLoadInitialProjection) return;

    const crossedVisibleBoundary = shouldRefetchNearbyWindow(
      prev,
      myLiveScore,
      loadedDataRef.current,
    );
    if (!crossedVisibleBoundary) return;

    devLog("boundary crossed", {
      cacheKey,
      previousScore: prev,
      liveScore: myLiveScore,
      nearbyScores:
        loadedDataRef.current?.nearbyOpponents.map((opponent) => ({
          userId: opponent.userId,
          rank: opponent.rank,
          bestScore: opponent.bestScore,
        })) ?? [],
    });

    if (enabled) {
      pendingBoundaryRefreshRef.current = false;
      queueMicrotask(() => {
        void doFetch("nearby_boundary_crossed");
      });
    } else {
      pendingBoundaryRefreshRef.current = true;
    }
  }, [enabled, canLoadInitialProjection, myLiveScore, cacheKey, doFetch]);

  useEffect(() => {
    if (!enabled || !canLoadInitialProjection) return;
    if (!pendingBoundaryRefreshRef.current) return;

    pendingBoundaryRefreshRef.current = false;
    queueMicrotask(() => {
      void doFetch("nearby_boundary_crossed");
    });
  }, [enabled, canLoadInitialProjection, doFetch, boundaryRetryToken]);

  const stateForCurrentSession = useMemo<ChallengeProjectionState>(
    () =>
      state.cacheKey === cacheKey && state.sessionKey === projectionSessionKey
        ? state
        : { status: "idle" },
    [state, cacheKey, projectionSessionKey],
  );

  const refresh = useCallback(() => {
    void doFetch("manual");
  }, [doFetch]);

  return {
    state: stateForCurrentSession,
    refresh,
    gainAnimKey: gainState.key,
    gainAmount: gainState.amount,
  };
}
