import { useEffect, useRef, useState } from "react";

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
  displayDurationMs?: number;
};

const useMobileScoreFeedback = ({
  participants,
  meClientId,
  enabled,
  gameStatus,
  scope,
  challengeProjection = null,
  displayDurationMs = 2800,
}: UseMobileScoreFeedbackParams): MobileScoreFeedbackEvent | null => {
  const [event, setEvent] = useState<MobileScoreFeedbackEvent | null>(null);
  const prevSnapshotRef = useRef<MobileScoreFeedbackSnapshot | null>(null);
  const prevScopeRef = useRef<MobileScoreFeedbackScope | null>(null);
  const clearTimerRef = useRef<number | null>(null);
  const isActive = enabled && gameStatus === "playing" && Boolean(meClientId);

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
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
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
    const prevSnapshot = prevSnapshotRef.current;
    const scopeChanged = prevScopeRef.current !== scope;

    prevScopeRef.current = scope;
    prevSnapshotRef.current = nextSnapshot;

    if (!prevSnapshot || scopeChanged) {
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

    if (clearTimerRef.current !== null) {
      window.clearTimeout(clearTimerRef.current);
    }
    publishEvent(nextEvent);
    clearTimerRef.current = window.setTimeout(() => {
      setEvent(null);
      clearTimerRef.current = null;
    }, displayDurationMs);

    return () => {
      cancelled = true;
    };
  }, [
    challengeProjection,
    displayDurationMs,
    isActive,
    meClientId,
    participants,
    scope,
  ]);

  useEffect(
    () => () => {
      if (clearTimerRef.current !== null) {
        window.clearTimeout(clearTimerRef.current);
        clearTimerRef.current = null;
      }
    },
    [],
  );

  return event;
};

export default useMobileScoreFeedback;
