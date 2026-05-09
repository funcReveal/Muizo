/**
 * useChallengeLeaderboardProjection
 *
 * In-game projected challenge leaderboard data.
 *
 * Update strategy:
 *  - Initial load fires after a random jitter (0–1500 ms) to spread the
 *    request storm that occurs when all players start simultaneously.
 *  - Score changes update only the self row and gain animation locally.
 *  - Network refresh on score increase only when the live score has passed
 *    the closest visible opponent ahead of the player.
 *  - Manual/initial loads bypass the client cooldown. Backend cooldown and
 *    server-authoritative ranking remain unchanged.
 *  - When document.hidden the initial jitter timer is cancelled; it fires
 *    again when the page becomes visible.
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

const CLIENT_COOLDOWN_MS = 4_000;
/** Random jitter applied to the initial fetch to spread the game-start storm. */
const INITIAL_JITTER_MAX_MS = 1_500;

type InternalProjectionState = ChallengeProjectionState & {
  sessionKey: string;
};

function shouldRefetchNearbyWindow(
  previousScore: number,
  newScore: number,
  data: ChallengeProjectedLeaderboardResponse | null,
): boolean {
  if (!data) return true;
  if (data.nearbyOpponents.length === 0) return false;

  const closestAheadBeforeScoreChange = data.nearbyOpponents
    .filter((opponent) => opponent.bestScore > previousScore)
    .sort((a, b) => a.bestScore - b.bestScore)[0];

  return Boolean(
    closestAheadBeforeScoreChange &&
      newScore >= closestAheadBeforeScoreChange.bestScore,
  );
}

export type UseChallengeLeaderboardProjectionInput = {
  enabled: boolean;
  roomId: string;
  meClientId: string;
  myLiveScore: number;
  canLoadInitialProjection: boolean;
  projectionSessionKey: string;
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
  } = input;

  const { authToken, refreshAuthToken, authLoading } = useAuth();
  const [state, setState] = useState<InternalProjectionState>({
    status: "idle",
    sessionKey: projectionSessionKey,
  });

  const abortRef = useRef<AbortController | null>(null);
  const inFlightKeyRef = useRef<string | null>(null);
  const lastFetchAtRef = useRef(0);
  const loadedDataRef = useRef<ChallengeProjectedLeaderboardResponse | null>(null);
  const gainAnimKeyRef = useRef(0);
  const [gainState, setGainState] = useState<{ key: number; amount: number }>({
    key: 0,
    amount: 0,
  });
  const prevLiveScoreRef = useRef(myLiveScore);

  // Jitter timer for initial fetch — cleared on unmount / session change
  const jitterTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const jitterScheduledForSessionRef = useRef<string | null>(null);

  const clearJitterTimer = useCallback(() => {
    if (jitterTimerRef.current !== null) {
      clearTimeout(jitterTimerRef.current);
      jitterTimerRef.current = null;
    }
    jitterScheduledForSessionRef.current = null;
  }, []);

  const canFetch = useCallback((bypassClientCooldown = false): boolean => {
    if (bypassClientCooldown) return true;
    return Date.now() - lastFetchAtRef.current >= CLIENT_COOLDOWN_MS;
  }, []);

  const doFetch = useCallback(
    async (
      _reason: string,
      options?: { bypassClientCooldown?: boolean; replaceInFlight?: boolean },
    ) => {
      if (!enabled || !roomId || authLoading) return;
      if (!canFetch(options?.bypassClientCooldown)) return;

      const requestKey = `${roomId}:${projectionSessionKey}`;
      if (
        inFlightKeyRef.current === requestKey &&
        !options?.replaceInFlight
      ) {
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      inFlightKeyRef.current = requestKey;
      lastFetchAtRef.current = Date.now();

      setState((prev) =>
        prev.status === "loaded" && prev.sessionKey === projectionSessionKey
          ? prev
          : { status: "loading", sessionKey: projectionSessionKey },
      );

      try {
        const token = authToken
          ? await ensureFreshAuthToken({ token: authToken, refreshAuthToken })
          : null;
        const result = await fetchProjectedWindow({
          apiUrl: API_URL ?? "",
          roomId,
          token,
          clientId: meClientId,
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (result.ok) {
          loadedDataRef.current = result.data;
          setState({
            status: "loaded",
            data: result.data,
            loadedAt: Date.now(),
            sessionKey: projectionSessionKey,
          });
          return;
        }

        setState((prev) =>
          prev.status === "loaded" && prev.sessionKey === projectionSessionKey
            ? prev
            : {
                status: "error",
                message: result.error,
                sessionKey: projectionSessionKey,
              },
        );
      } catch {
        if (controller.signal.aborted) return;
        setState((prev) =>
          prev.status === "loaded" && prev.sessionKey === projectionSessionKey
            ? prev
            : {
                status: "error",
                message: "排行榜暫時無法載入",
                sessionKey: projectionSessionKey,
              },
        );
      } finally {
        if (inFlightKeyRef.current === requestKey) {
          inFlightKeyRef.current = null;
        }
      }
    },
    [
      enabled,
      roomId,
      authLoading,
      canFetch,
      projectionSessionKey,
      authToken,
      refreshAuthToken,
      meClientId,
    ],
  );

  // Reset all state when session changes
  useEffect(() => {
    clearJitterTimer();
    loadedDataRef.current = null;
    abortRef.current?.abort();
    abortRef.current = null;
    inFlightKeyRef.current = null;
    lastFetchAtRef.current = 0;
    prevLiveScoreRef.current = 0;
    gainAnimKeyRef.current = 0;
    queueMicrotask(() => {
      setGainState({ key: 0, amount: 0 });
    });
  }, [roomId, projectionSessionKey, clearJitterTimer]);

  // Initial fetch with jitter — fires once when canLoadInitialProjection becomes true
  useEffect(() => {
    if (!enabled || !canLoadInitialProjection || loadedDataRef.current !== null) return;
    // Don't schedule if we already have a jitter pending for this session
    if (jitterScheduledForSessionRef.current === projectionSessionKey) return;

    jitterScheduledForSessionRef.current = projectionSessionKey;

    const fire = () => {
      jitterTimerRef.current = null;
      // Don't fetch if document is hidden — page-visible handler will re-trigger
      if (document.hidden) {
        jitterScheduledForSessionRef.current = null;
        return;
      }
      void doFetch("initial_game_started", { bypassClientCooldown: true });
    };

    const jitter = Math.random() * INITIAL_JITTER_MAX_MS;
    jitterTimerRef.current = setTimeout(fire, jitter);

    return () => {
      // Cleanup if the effect re-runs before timer fires
      clearJitterTimer();
    };
  }, [enabled, canLoadInitialProjection, projectionSessionKey, doFetch, clearJitterTimer]);

  // When page becomes visible, retry if we skipped the initial fetch
  useEffect(() => {
    const onVisible = () => {
      if (document.hidden) return;
      if (
        enabled &&
        canLoadInitialProjection &&
        loadedDataRef.current === null &&
        jitterTimerRef.current === null
      ) {
        lastFetchAtRef.current = 0;
        void doFetch("page_visible", { bypassClientCooldown: true });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [enabled, canLoadInitialProjection, doFetch]);

  // After auth finishes loading, retry if still no data
  const prevAuthLoadingRef = useRef(authLoading);
  useEffect(() => {
    const wasLoading = prevAuthLoadingRef.current;
    prevAuthLoadingRef.current = authLoading;
    if (!wasLoading || authLoading) return;
    if (
      enabled &&
      canLoadInitialProjection &&
      loadedDataRef.current === null
    ) {
      lastFetchAtRef.current = 0;
      void doFetch("auth_ready", { bypassClientCooldown: true });
    }
  }, [authLoading, enabled, canLoadInitialProjection, doFetch]);

  // Boundary-based refresh: refetch only when closest ahead opponent is passed
  useEffect(() => {
    const prev = prevLiveScoreRef.current;
    prevLiveScoreRef.current = myLiveScore;

    if (myLiveScore <= prev) return;

    const delta = myLiveScore - prev;
    gainAnimKeyRef.current += 1;
    setGainState({ key: gainAnimKeyRef.current, amount: delta });

    if (
      enabled &&
      canLoadInitialProjection &&
      shouldRefetchNearbyWindow(prev, myLiveScore, loadedDataRef.current)
    ) {
      void doFetch("closest_ahead_passed");
    }
  }, [enabled, canLoadInitialProjection, myLiveScore, doFetch]);

  // Abort in-flight request when disabled
  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      abortRef.current = null;
      inFlightKeyRef.current = null;
      clearJitterTimer();
    }
  }, [enabled, clearJitterTimer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearJitterTimer();
      abortRef.current?.abort();
    };
  }, [clearJitterTimer]);

  const stateForCurrentSession = useMemo<ChallengeProjectionState>(
    () =>
      state.sessionKey === projectionSessionKey ? state : { status: "idle" },
    [state, projectionSessionKey],
  );

  const refresh = useCallback(() => {
    lastFetchAtRef.current = 0;
    void doFetch("manual_refresh", {
      bypassClientCooldown: true,
      replaceInFlight: true,
    });
  }, [doFetch]);

  return {
    state: stateForCurrentSession,
    refresh,
    gainAnimKey: gainState.key,
    gainAmount: gainState.amount,
  };
}
