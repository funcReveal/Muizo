import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";

import type {
  GameState,
  PlaybackExtensionVoteState,
} from "@features/RoomSession";

interface UseGameRoomVoteDialogEffectsInput {
  trackSessionKey: string;
  isManualPlaybackExtensionMode: boolean;
  isAutoPlaybackExtensionMode: boolean;
  playbackExtensionVote: PlaybackExtensionVoteState | null;
  playbackExtensionSeconds: number;
  meClientId?: string;
  myPlaybackVote: "approve" | "reject" | null;
  playbackVoteResolvedSeconds: number;
  gamePhase: GameState["phase"];
  gameStatus: GameState["status"];
  setPlaybackVoteDialogOpen: Dispatch<SetStateAction<boolean>>;
  setPlaybackVoteRequestPending: Dispatch<SetStateAction<boolean>>;
  setPlaybackVoteSubmitPending: Dispatch<
    SetStateAction<"approve" | "reject" | null>
  >;
}

/**
 * Manages vote-dialog side-effects for GameRoomPage:
 *   1. Reset dialog state when track changes
 *   2. Track one-shot vote lifecycle keys so dialog behavior stays stable
 */
export function useGameRoomVoteDialogEffects({
  trackSessionKey,
  isManualPlaybackExtensionMode,
  isAutoPlaybackExtensionMode,
  playbackExtensionVote,
  playbackExtensionSeconds,
  meClientId,
  myPlaybackVote,
  playbackVoteResolvedSeconds,
  gamePhase,
  gameStatus,
  setPlaybackVoteDialogOpen,
  setPlaybackVoteRequestPending,
  setPlaybackVoteSubmitPending,
}: UseGameRoomVoteDialogEffectsInput) {
  const lastPlaybackVotePromptKeyRef = useRef<string | null>(null);
  const lastPlaybackVoteActiveKeyRef = useRef<string | null>(null);
  const lastPlaybackVoteResolvedKeyRef = useRef<string | null>(null);
  const lastAutoPlaybackExtensionNoticeRef = useRef<string | null>(null);

  useEffect(() => {
    setPlaybackVoteDialogOpen(false);
    setPlaybackVoteRequestPending(false);
    setPlaybackVoteSubmitPending(null);
    lastPlaybackVotePromptKeyRef.current = null;
    lastPlaybackVoteActiveKeyRef.current = null;
    lastPlaybackVoteResolvedKeyRef.current = null;
    lastAutoPlaybackExtensionNoticeRef.current = null;
  }, [
    trackSessionKey,
    setPlaybackVoteDialogOpen,
    setPlaybackVoteRequestPending,
    setPlaybackVoteSubmitPending,
  ]);

  useEffect(() => {
    if (!isManualPlaybackExtensionMode) return;

    if (!playbackExtensionVote || playbackExtensionVote.status !== "active") {
      setPlaybackVoteDialogOpen(false);
      return;
    }

    if (!meClientId || myPlaybackVote !== null) return;

    const promptKey = `${trackSessionKey}:${playbackExtensionVote.startedAt}`;
    if (lastPlaybackVotePromptKeyRef.current === promptKey) return;

    lastPlaybackVotePromptKeyRef.current = promptKey;
  }, [
    isManualPlaybackExtensionMode,
    meClientId,
    myPlaybackVote,
    playbackExtensionVote,
    setPlaybackVoteDialogOpen,
    trackSessionKey,
  ]);

  useEffect(() => {
    if (!playbackExtensionVote || playbackExtensionVote.status !== "active") {
      return;
    }
    if (!isManualPlaybackExtensionMode) return;
    const activeKey = `${trackSessionKey}:${playbackExtensionVote.startedAt}:active`;
    if (lastPlaybackVoteActiveKeyRef.current === activeKey) return;
    lastPlaybackVoteActiveKeyRef.current = activeKey;
  }, [isManualPlaybackExtensionMode, playbackExtensionVote, trackSessionKey]);

  useEffect(() => {
    if (
      !playbackExtensionVote ||
      (playbackExtensionVote.status !== "approved" &&
        playbackExtensionVote.status !== "rejected")
    ) {
      return;
    }
    const resolvedKey = `${trackSessionKey}:${playbackExtensionVote.startedAt}:${playbackExtensionVote.status}:${playbackVoteResolvedSeconds}`;
    if (lastPlaybackVoteResolvedKeyRef.current === resolvedKey) return;
    lastPlaybackVoteResolvedKeyRef.current = resolvedKey;
  }, [playbackExtensionVote, playbackVoteResolvedSeconds, trackSessionKey]);

  useEffect(() => {
    if (!isAutoPlaybackExtensionMode) return;
    if (gamePhase !== "guess" || gameStatus !== "playing") return;
    if (playbackExtensionSeconds <= 0) return;
    const autoNoticeKey = `${trackSessionKey}:${playbackExtensionSeconds}`;
    if (lastAutoPlaybackExtensionNoticeRef.current === autoNoticeKey) return;
    lastAutoPlaybackExtensionNoticeRef.current = autoNoticeKey;
  }, [
    gamePhase,
    gameStatus,
    isAutoPlaybackExtensionMode,
    playbackExtensionSeconds,
    trackSessionKey,
  ]);
}
