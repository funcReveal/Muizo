import { useCallback, useEffect, useRef, useState } from "react";

import type { GameState, RoomParticipant } from "@features/RoomSession";

import {
  buildMobileScoreFeedbackEvent,
  buildMobileScoreFeedbackSnapshot,
  type MobileScoreFeedbackEvent,
  type MobileScoreFeedbackSnapshot,
  type MobileScoreFeedbackScope,
} from "./mobileScoreFeedback";
import { deferStateUpdate } from "./gameRoomUtils";
import type { ChallengeProjectedLeaderboardResponse } from "./projectionTypes";

type UseMobileScoreFeedbackParams = {
  participants: RoomParticipant[];
  meClientId?: string;
  enabled: boolean;
  gameStatus: GameState["status"];
  scope: MobileScoreFeedbackScope;
  challengeProjection?: ChallengeProjectedLeaderboardResponse | null;
  resetKey?: string;
  scoreDurationMs?: number;
  rankDurationMs?: number;
};

const MOBILE_REVEAL_FEEDBACK_TOTAL_MS = 5000;
const MOBILE_SCORE_GAIN_PHASE_MS = 2500;
const MOBILE_RANK_SWAP_PHASE_MS = 2500;

const useMobileScoreFeedback = ({
  participants,
  meClientId,
  enabled,
  gameStatus,
  scope,
  challengeProjection = null,
  resetKey = "",
  scoreDurationMs = MOBILE_SCORE_GAIN_PHASE_MS,
  rankDurationMs = MOBILE_RANK_SWAP_PHASE_MS,
}: UseMobileScoreFeedbackParams): MobileScoreFeedbackEvent | null => {
  const [event, setEvent] = useState<MobileScoreFeedbackEvent | null>(null);
  const prevSnapshotRef = useRef<MobileScoreFeedbackSnapshot | null>(null);
  const prevScopeRef = useRef<MobileScoreFeedbackScope | null>(null);
  const prevResetKeyRef = useRef(resetKey);
  const clearTimerRef = useRef<number | null>(null);
  const rankTimerRef = useRef<number | null>(null);
  const scorePhaseUntilRef = useRef(0);
  const isActive = enabled && gameStatus === "playing" && Boolean(meClientId);

  const clearTimers = useCallback((resetScorePhase = true) => {
    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    if (rankTimerRef.current !== null) {
      window.clearTimeout(rankTimerRef.current);
      rankTimerRef.current = null;
    }
    if (resetScorePhase) {
      scorePhaseUntilRef.current = 0;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const publishEvent = (nextEvent: MobileScoreFeedbackEvent | null) => {
      deferStateUpdate(() => {
        if (!cancelled) {
          setEvent(nextEvent);
        }
      });
    };

    if (!isActive) {
      prevSnapshotRef.current = null;
      prevScopeRef.current = null;
      prevResetKeyRef.current = resetKey;
      clearTimers();
      publishEvent(null);
      return () => {
        cancelled = true;
      };
    }

    const nextSnapshot = buildMobileScoreFeedbackSnapshot({
      scope,
      participants,
      meClientId,
      challengeProjection,
    });
    if (prevResetKeyRef.current !== resetKey) {
      prevResetKeyRef.current = resetKey;
      prevScopeRef.current = scope;
      prevSnapshotRef.current = nextSnapshot;
      clearTimers();
      publishEvent(null);
      return () => {
        cancelled = true;
      };
    }

    const prevSnapshot = prevSnapshotRef.current;
    const scopeChanged = prevScopeRef.current !== scope;

    prevScopeRef.current = scope;
    prevSnapshotRef.current = nextSnapshot;

    if (!prevSnapshot || scopeChanged) {
      clearTimers();
      publishEvent(null);
      return;
    }

    if (!prevSnapshot || prevSnapshot.scope !== nextSnapshot.scope) {
      prevSnapshotRef.current = nextSnapshot;
      return;
    }

    const nextEvent = buildMobileScoreFeedbackEvent(prevSnapshot, nextSnapshot);
    if (!nextEvent) {
      return;
    }

    clearTimers(false);

    const clearAfter = (durationMs: number) => {
      clearTimerRef.current = window.setTimeout(() => {
        setEvent(null);
        clearTimerRef.current = null;
      }, durationMs);
    };

    const publishRankEvent = () => {
      publishEvent(nextEvent);
      clearAfter(rankDurationMs);
    };

    if (nextEvent.type === "score") {
      scorePhaseUntilRef.current = Date.now() + scoreDurationMs;
      publishEvent(nextEvent);
      clearAfter(scoreDurationMs);
      return () => {
        cancelled = true;
      };
    }

    if (nextEvent.type === "passed" && nextEvent.scoreGain > 0) {
      scorePhaseUntilRef.current = Date.now() + scoreDurationMs;
      publishEvent({
        type: "score",
        scope: nextEvent.scope,
        scoreGain: nextEvent.scoreGain,
        me: nextEvent.me,
        target: null,
        remainingScore: null,
        runnerUp: null,
        leadScore: null,
      });
      rankTimerRef.current = window.setTimeout(() => {
        rankTimerRef.current = null;
        publishRankEvent();
      }, scoreDurationMs);
    } else {
      const scorePhaseRemainingMs = Math.max(
        0,
        scorePhaseUntilRef.current - Date.now(),
      );
      if (scorePhaseRemainingMs > 0) {
        rankTimerRef.current = window.setTimeout(() => {
          rankTimerRef.current = null;
          publishRankEvent();
        }, Math.min(scorePhaseRemainingMs, MOBILE_REVEAL_FEEDBACK_TOTAL_MS));
      } else {
        publishRankEvent();
      }
    }

    return () => {
      cancelled = true;
    };
  }, [
    challengeProjection,
    isActive,
    meClientId,
    participants,
    rankDurationMs,
    resetKey,
    scope,
    scoreDurationMs,
    clearTimers,
  ]);

  useEffect(
    () => () => {
      clearTimers();
    },
    [clearTimers],
  );

  return event;
};

export default useMobileScoreFeedback;
