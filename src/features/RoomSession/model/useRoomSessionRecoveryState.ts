import { useEffect, useMemo, useState } from "react";
import type { SessionProgressPayload } from "./types";

export type PostResumeGate = {
  /** startedAt from the gameState inside the resumeSession ack */
  resumeStartedAt: number;
  /** phase at resume time, used for richer status text */
  resumePhase: "guess" | "reveal";
} | null;

type UseRoomSessionRecoveryStateParams = {
  currentRoomId: string | null;
  currentRoomObjectId: string | null | undefined;
  isConnected: boolean;
  sessionProgress: SessionProgressPayload | null;
};

export const useRoomSessionRecoveryState = ({
  currentRoomId,
  currentRoomObjectId,
  isConnected,
  sessionProgress,
}: UseRoomSessionRecoveryStateParams) => {
  const [postResumeGate, setPostResumeGate] = useState<PostResumeGate>(null);

  const isRecoveringConnection = useMemo(() => {
    const hasTargetRoom = Boolean(currentRoomId || currentRoomObjectId);
    if (!hasTargetRoom) return false;

    if (!isConnected) return true;

    if (
      sessionProgress?.flow === "resume" &&
      sessionProgress.status === "active"
    ) {
      return true;
    }

    return postResumeGate !== null;
  }, [currentRoomId, currentRoomObjectId, isConnected, postResumeGate, sessionProgress]);

  const recoveryStatusText = useMemo(() => {
    const hasTargetRoom = Boolean(currentRoomId || currentRoomObjectId);
    if (!hasTargetRoom) return null;

    if (!isConnected) {
      return "正在恢復連線...";
    }

    if (
      sessionProgress?.flow === "resume" &&
      sessionProgress.status === "active"
    ) {
      switch (sessionProgress.stage) {
        case "server_validating":
          return "正在驗證連線...";
        case "room_lookup":
          return "正在尋找房間...";
        case "membership_restore":
          return "正在恢復房間成員狀態...";
        case "state_build":
          return "正在同步遊戲狀態...";
        case "ready_to_send":
          return "即將完成同步...";
        default:
          return "正在同步房間狀態...";
      }
    }

    if (postResumeGate !== null) {
      return postResumeGate.resumePhase === "guess"
        ? "等待伺服器推進遊戲節奏..."
        : "等待下一題開始...";
    }

    return null;
  }, [currentRoomId, currentRoomObjectId, isConnected, postResumeGate, sessionProgress]);

  // Last-resort guard. The gate normally clears when onGameUpdated arrives
  // with a fresh startedAt, but it should not block the UI indefinitely.
  useEffect(() => {
    if (postResumeGate === null) return;
    const timer = window.setTimeout(() => {
      setPostResumeGate(null);
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [postResumeGate]);

  return {
    isRecoveringConnection,
    postResumeGate,
    recoveryStatusText,
    setPostResumeGate,
  };
};

export default useRoomSessionRecoveryState;
