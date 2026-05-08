/**
 * useChallengeLeaderboardProjection
 *
 * Hook for in-game projected challenge leaderboard data.
 *
 * Update strategy:
 *  - Initial load when challenge tab becomes active.
 *  - Refresh on every correct answer (myLiveScore increase) — guarantees the
 *    display always reflects the CURRENT score, never the previous question's.
 *  - Cooldown: 4 seconds between requests (backend also enforces this).
 *  - Stale data is kept while re-fetching; no empty flash.
 *
 * Score gain tracking:
 *  - gainAnimKey increments each time myLiveScore increases.
 *  - gainAmount holds the delta for the floating "+N" animation.
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
  ChallengeNearbyOpponent,
  ChallengeProjectionState,
} from "./projectionTypes";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Front-end cooldown: ignore backend 429, just don't fire. */
const CLIENT_COOLDOWN_MS = 4_000;

// ---------------------------------------------------------------------------
// Boundary check — only re-fetch when the score window is stale
// ---------------------------------------------------------------------------

function shouldRefetchNearbyWindow(
  newScore: number,
  data: ChallengeProjectedLeaderboardResponse | null,
): boolean {
  if (!data) return true;
  if (data.nearbyOpponents.length === 0) return true;
  // Treat relation by bestScore vs newScore, not the stale relation field
  const ahead = data.nearbyOpponents.filter((n) => n.bestScore > newScore);
  if (ahead.length === 0) return true; // passed all ahead opponents
  const passedCount = data.nearbyOpponents.filter(
    (n) => n.bestScore <= newScore,
  ).length;
  if (passedCount >= 2) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type UseChallengeLeaderboardProjectionInput = {
  /** Only run when true — typically when challenge tab is active */
  enabled: boolean;
  roomId: string;
  meClientId: string;
  /** Live score from room participants (server-authoritative, updated per question) */
  myLiveScore: number;
};

export type UseChallengeLeaderboardProjectionResult = {
  state: ChallengeProjectionState;
  refresh: () => void;
  /** Increments each time myLiveScore increases — use as React key for animation */
  gainAnimKey: number;
  /** Score delta from the most recent correct answer (0 if none yet) */
  gainAmount: number;
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChallengeLeaderboardProjection(
  input: UseChallengeLeaderboardProjectionInput,
): UseChallengeLeaderboardProjectionResult {
  const { enabled, roomId, meClientId, myLiveScore } = input;

  const { authToken, refreshAuthToken, authLoading } = useAuth();
  const [state, setState] = useState<ChallengeProjectionState>({
    status: "idle",
  });

  const abortRef = useRef<AbortController | null>(null);
  const lastFetchAtRef = useRef<number>(0);
  const loadedDataRef = useRef<ChallengeProjectedLeaderboardResponse | null>(
    null,
  );

  // Gain animation state — updated synchronously on score increase
  const gainAnimKeyRef = useRef(0);
  const [gainState, setGainState] = useState<{ key: number; amount: number }>({
    key: 0,
    amount: 0,
  });

  // Tracks the score from the previous render to detect increases
  const prevLiveScoreRef = useRef(myLiveScore);

  const canFetch = useCallback((): boolean => {
    const now = Date.now();
    return now - lastFetchAtRef.current >= CLIENT_COOLDOWN_MS;
  }, []);

  const doFetch = useCallback(
    async (_reason: string) => {
      if (!enabled || !roomId) return;
      if (authLoading) return;
      if (!canFetch()) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      lastFetchAtRef.current = Date.now();

      setState((prev) =>
        prev.status === "loaded"
          ? prev
          : { status: "loading" },
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
          });
        } else {
          if (result.status === 429) return;
          setState((prev) =>
            prev.status === "loaded"
              ? prev
              : { status: "error", message: result.error },
          );
        }
      } catch {
        if (controller.signal.aborted) return;
        setState((prev) =>
          prev.status === "loaded"
            ? prev
            : { status: "error", message: "排行榜暫時無法使用" },
        );
      }
    },
    [enabled, roomId, meClientId, authToken, refreshAuthToken, canFetch, authLoading],
  );

  // ------------------------------------------------------------------
  // Initial load when challenge tab becomes active
  // ------------------------------------------------------------------
  const prevEnabledRef = useRef(false);
  useEffect(() => {
    if (enabled && !prevEnabledRef.current) {
      void doFetch("tab_activated");
    }
    prevEnabledRef.current = enabled;
  }, [enabled, doFetch]);

  // ------------------------------------------------------------------
  // Auth-ready retry
  // Fires when authLoading transitions true → false while challenge tab
  // is active and no data has been fetched yet.
  // ------------------------------------------------------------------
  const prevAuthLoadingRef = useRef(authLoading);
  useEffect(() => {
    const wasLoading = prevAuthLoadingRef.current;
    prevAuthLoadingRef.current = authLoading;

    if (!wasLoading || authLoading) return;

    if (enabled && loadedDataRef.current === null) {
      lastFetchAtRef.current = 0;
      void doFetch("auth_ready");
    }
  }, [authLoading, enabled, doFetch]);

  // ------------------------------------------------------------------
  // Score-increase trigger (primary update mechanism)
  // Fires whenever myLiveScore increases (correct answer submitted).
  // This guarantees the leaderboard reflects the CURRENT score, not
  // the previous question's — fixing the "one question behind" bug.
  // ------------------------------------------------------------------
  useEffect(() => {
    const prev = prevLiveScoreRef.current;
    prevLiveScoreRef.current = myLiveScore;

    if (myLiveScore > prev) {
      const delta = myLiveScore - prev;
      gainAnimKeyRef.current += 1;
      setGainState({ key: gainAnimKeyRef.current, amount: delta });
      if (enabled && shouldRefetchNearbyWindow(myLiveScore, loadedDataRef.current)) {
        void doFetch("boundary_crossed");
      }
    }
  }, [enabled, myLiveScore, doFetch]);

  // ------------------------------------------------------------------
  // Cleanup when disabled
  // ------------------------------------------------------------------
  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      abortRef.current = null;
    }
  }, [enabled]);

  // ------------------------------------------------------------------
  // Reset when roomId changes (new match / room)
  // ------------------------------------------------------------------
  useEffect(() => {
    loadedDataRef.current = null;
    setState({ status: "idle" });
    abortRef.current?.abort();
    abortRef.current = null;
    lastFetchAtRef.current = 0;
    prevLiveScoreRef.current = 0;
    setGainState({ key: 0, amount: 0 });
    gainAnimKeyRef.current = 0;
  }, [roomId]);

  // ------------------------------------------------------------------
  // Derived nearby opponents with re-calculated gapFromMe
  // Recompute on myLiveScore change without a network fetch.
  // ------------------------------------------------------------------
  const stateWithUpdatedGaps = useMemo<ChallengeProjectionState>(() => {
    if (state.status !== "loaded") return state;
    const data = state.data;
    const updatedOpponents: ChallengeNearbyOpponent[] = data.nearbyOpponents.map((opp) => ({
      ...opp,
      gapFromMe: opp.bestScore - myLiveScore,
      relation: (opp.bestScore > myLiveScore ? "ahead" : "passed") as "ahead" | "passed",
    }));
    return {
      ...state,
      data: {
        ...data,
        nearbyOpponents: updatedOpponents,
        myStanding: {
          ...data.myStanding,
          liveScore: myLiveScore,
        },
      },
    };
  }, [state, myLiveScore]);

  const refresh = useCallback(() => {
    lastFetchAtRef.current = 0;
    void doFetch("manual_refresh");
  }, [doFetch]);

  return {
    state: stateWithUpdatedGaps,
    refresh,
    gainAnimKey: gainState.key,
    gainAmount: gainState.amount,
  };
}
