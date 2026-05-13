/**
 * GameRoomLeaderboardSidebar
 *
 * Unified leaderboard sidebar that supports two modes:
 *   - "room" tab: shows current room participants scoreboard (GameRoomLeftSidebar)
 *   - "challenge" tab: shows projected challenge leaderboard (Top5 + nearby + self)
 *
 * Tab rules:
 *   - isLeaderboardRoom === false → always "room" tab, no tabs shown
 *   - isLeaderboardRoom === true  → default "challenge", user can switch
 *
 * The challenge leaderboard hook is ONLY mounted when isLeaderboardRoom is true.
 * Switching to "room" tab pauses challenge refreshes (enabled=false).
 */

import React, { useCallback, useMemo, useState } from "react";
import type { GameState, RoomParticipant } from "@features/RoomSession";
import type { QuestionScoreBreakdown } from "@features/RoomSession";
import type { TopTwoSwapState } from "../model/gameRoomTypes";
import type { ScoreboardRow } from "../model/gameRoomDerivations";
import type {
  ScoreboardBorderAnimationId,
  ScoreboardBorderLineStyleId,
  ScoreboardBorderThemeId,
} from "../../Setting/model/scoreboardBorderEffects";
import type { AvatarEffectLevel } from "../../../shared/ui/playerAvatar/playerAvatarTheme";
import type {
  ChallengeProjectedLeaderboardResponse,
  GameRoomScoreboardTab,
} from "../model/projectionTypes";
import { useChallengeLeaderboardProjection } from "../model/useChallengeLeaderboardProjection";
import RoomScoreboardPanel from "./components/RoomScoreboardPanel";
import { ChallengeLeaderboardPanel } from "./components/ChallengeLeaderboardPanel";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GameRoomLeaderboardSidebarProps {
  // --- Room scoreboard props ---
  scoreboardRows: ScoreboardRow[];
  answeredClientIdSet: Set<string>;
  answeredRankByClientId: Map<string, number>;
  scorePartsByClientId: Map<string, { base: number; gain: number }>;
  scoreBreakdownByClientId?: Map<string, QuestionScoreBreakdown>;
  isReveal: boolean;
  meClientId: string;
  participants: RoomParticipant[];
  meRoomRank: number | null;
  meRoomParticipant: RoomParticipant | null;
  roomRankByClientId: Map<string, number>;
  topTwoSwapState: TopTwoSwapState | null;
  className?: string;
  onOpenMobileChat?: () => void;
  mobileChatUnread?: number;
  mobileOverlayMode?: boolean;
  mobileMinimalHeader?: boolean;
  swapAnimationEnabled?: boolean;
  swapReplayToken?: number;

  // --- Settings ---
  avatarEffectLevel?: AvatarEffectLevel;
  scoreboardBorderEnabled?: boolean;
  scoreboardBorderMaskEnabled?: boolean;
  scoreboardBorderAnimation?: ScoreboardBorderAnimationId;
  scoreboardBorderLineStyle?: ScoreboardBorderLineStyleId;
  scoreboardBorderTheme?: ScoreboardBorderThemeId;
  scoreboardBorderParticleCount?: number;

  // --- Challenge leaderboard ---
  /** true if room.gameSettings?.leaderboardProfileKey is set */
  isLeaderboardRoom: boolean;
  roomId: string;
  /** Whether the game has settled (changes display labels) */
  isSettled?: boolean;
  gameStatus: GameState["status"];
  gamePhase: GameState["phase"];
  currentQuestionIndex: number;
  trackSessionKey: string;
  projectionSessionKey: string;
  waitingToStart: boolean;
  isInterTrackWait: boolean;
  isRecoveringConnection?: boolean;
  activeTab?: GameRoomScoreboardTab;
  onActiveTabChange?: (tab: GameRoomScoreboardTab) => void;
  onProjectionDataChange?: (
    data: ChallengeProjectedLeaderboardResponse | null,
  ) => void;
}

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------

const TabButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${active
      ? "bg-white/15 text-white"
      : "text-slate-400 hover:text-slate-200 hover:bg-white/8"
      }`}
  >
    {label}
  </button>
);

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const GameRoomLeaderboardSidebar: React.FC<GameRoomLeaderboardSidebarProps> = ({
  // room scoreboard
  scoreboardRows,
  answeredClientIdSet,
  answeredRankByClientId,
  scorePartsByClientId,
  scoreBreakdownByClientId,
  isReveal,
  meClientId,
  participants,
  meRoomRank,
  meRoomParticipant,
  roomRankByClientId,
  topTwoSwapState,
  className,
  onOpenMobileChat,
  mobileChatUnread,
  mobileOverlayMode,
  mobileMinimalHeader,
  swapAnimationEnabled,
  swapReplayToken,
  // settings
  avatarEffectLevel,
  scoreboardBorderEnabled,
  scoreboardBorderMaskEnabled,
  scoreboardBorderAnimation,
  scoreboardBorderLineStyle,
  scoreboardBorderTheme,
  scoreboardBorderParticleCount,
  // challenge lb
  isLeaderboardRoom,
  roomId,
  isSettled = false,
  gameStatus,
  gamePhase,
  currentQuestionIndex,
  trackSessionKey,
  projectionSessionKey,
  waitingToStart,
  isInterTrackWait,
  isRecoveringConnection = false,
  activeTab: controlledActiveTab,
  onActiveTabChange,
  onProjectionDataChange,
}) => {
  const [uncontrolledActiveTab, setUncontrolledActiveTab] = useState<GameRoomScoreboardTab>(
    isLeaderboardRoom ? "challenge" : "room",
  );
  const activeTab = controlledActiveTab ?? uncontrolledActiveTab;

  // Ensure casual rooms are locked to "room" tab
  const resolvedTab: GameRoomScoreboardTab = isLeaderboardRoom
    ? activeTab
    : "room";

  React.useEffect(() => {
    onActiveTabChange?.(resolvedTab);
  }, [onActiveTabChange, resolvedTab]);

  // Live score + viewer display info from participants list
  const { myLiveScore, viewerDisplayName, viewerAvatarUrl, viewerCombo } = useMemo(() => {
    const me = participants.find((p) => p.clientId === meClientId);
    return {
      myLiveScore: me?.score ?? 0,
      viewerDisplayName: me?.username ?? undefined,
      viewerAvatarUrl: (me?.avatar_url ?? me?.avatarUrl ?? null) as string | null,
      viewerCombo: me?.combo ?? 0,
    };
  }, [participants, meClientId]);

  const challengeEnabled = isLeaderboardRoom && resolvedTab === "challenge";
  const isPlayablePhase = gamePhase === "guess" || gamePhase === "reveal";
  const canLoadInitialProjection =
    challengeEnabled &&
    gameStatus === "playing" &&
    isPlayablePhase &&
    currentQuestionIndex >= 0 &&
    trackSessionKey.trim().length > 0 &&
    !waitingToStart &&
    !isInterTrackWait &&
    !isRecoveringConnection;

  const { state: projectionState, refresh, gainAnimKey, gainAmount } =
    useChallengeLeaderboardProjection({
      enabled: challengeEnabled,
      roomId,
      meClientId,
      myLiveScore,
      canLoadInitialProjection,
      projectionSessionKey,
    });

  React.useEffect(() => {
    onProjectionDataChange?.(
      projectionState.status === "loaded" ? projectionState.data : null,
    );
  }, [onProjectionDataChange, projectionState]);

  const handleTabChallenge = useCallback(() => {
    if (!isLeaderboardRoom) return;
    setUncontrolledActiveTab("challenge");
    onActiveTabChange?.("challenge");
  }, [isLeaderboardRoom, onActiveTabChange]);

  const handleTabRoom = useCallback(() => {
    setUncontrolledActiveTab("room");
    onActiveTabChange?.("room");
  }, [onActiveTabChange]);

  return (
    <div
      className={[
        "game-room-leaderboard-sidebar flex h-full flex-col",
        mobileOverlayMode ? "game-room-leaderboard-sidebar--mobile-overlay" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Tab bar — only shown for leaderboard rooms */}
      {isLeaderboardRoom && (
        <div className="game-room-leaderboard-tabs flex gap-1 px-2 pt-2 pb-1 shrink-0">
          <TabButton
            label="挑戰排行"
            active={resolvedTab === "challenge"}
            onClick={handleTabChallenge}
          />
          <TabButton
            label="房間排行"
            active={resolvedTab === "room"}
            onClick={handleTabRoom}
          />
        </div>
      )}

      {/* Panel */}
      <div className="game-room-leaderboard-panel min-h-0 flex-1 overflow-hidden">
        {resolvedTab === "challenge" && isLeaderboardRoom ? (
          <ChallengeLeaderboardPanel
            state={projectionState}
            isSettled={isSettled}
            onRefresh={refresh}
            viewerDisplayName={viewerDisplayName}
            viewerAvatarUrl={viewerAvatarUrl}
            viewerCombo={viewerCombo}
            viewerScore={myLiveScore}
            gainAnimKey={gainAnimKey}
            gainAmount={gainAmount}
          />
        ) : (
          <RoomScoreboardPanel
            scoreboardRows={scoreboardRows}
            answeredClientIdSet={answeredClientIdSet}
            answeredRankByClientId={answeredRankByClientId}
            scorePartsByClientId={scorePartsByClientId}
            scoreBreakdownByClientId={scoreBreakdownByClientId}
            isReveal={isReveal}
            meClientId={meClientId}
            meRoomRank={meRoomRank}
            meRoomParticipant={meRoomParticipant}
            roomRankByClientId={roomRankByClientId}
            topTwoSwapState={topTwoSwapState}
            className="!h-full"
            onOpenMobileChat={onOpenMobileChat}
            mobileChatUnread={mobileChatUnread}
            mobileOverlayMode={mobileOverlayMode}
            mobileMinimalHeader={mobileMinimalHeader}
            swapAnimationEnabled={swapAnimationEnabled}
            swapReplayToken={swapReplayToken}
            avatarEffectLevel={avatarEffectLevel}
            scoreboardBorderEnabled={scoreboardBorderEnabled}
            scoreboardBorderMaskEnabled={scoreboardBorderMaskEnabled}
            scoreboardBorderAnimation={scoreboardBorderAnimation}
            scoreboardBorderLineStyle={scoreboardBorderLineStyle}
            scoreboardBorderTheme={scoreboardBorderTheme}
            scoreboardBorderParticleCount={scoreboardBorderParticleCount}
          />
        )}
      </div>
    </div>
  );
};

export default GameRoomLeaderboardSidebar;
