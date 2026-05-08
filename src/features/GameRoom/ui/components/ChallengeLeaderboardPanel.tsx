import React, { useMemo } from "react";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import type {
  ChallengeProjectedLeaderboardResponse,
  ChallengeProjectedMyStanding,
  ChallengeProjectionState,
} from "../../model/projectionTypes";
import { buildChallengeNearbyDisplayRows } from "../../model/challengeNearbyDisplay";
import {
  ChallengeTopEntryRow,
  ChallengeNearbyRow,
  ChallengeSeparatorRow,
  ChallengeEllipsisRow,
  ChallengePlaceholderRow,
  ChallengeSelfRow,
} from "./ChallengeLeaderboardRow";
import { useScoreboardWheelScroll } from "./useScoreboardWheelScroll";

interface ChallengeLeaderboardPanelProps {
  state: ChallengeProjectionState;
  isSettled?: boolean;
  onRefresh?: () => void;
  viewerDisplayName?: string;
  viewerAvatarUrl?: string | null;
  viewerCombo?: number;
  viewerScore?: number;
  gainAnimKey?: number;
  gainAmount?: number;
}

const SkeletonRow: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <div
    className="game-room-score-row flex items-center justify-between animate-pulse"
    style={{ opacity }}
  >
    <span className="flex min-w-0 flex-1 items-center gap-2">
      <div className="h-3.5 w-5 shrink-0 rounded bg-white/10" />
      <div className="game-room-score-row-avatar-skeleton shrink-0 rounded-full bg-white/10" />
      <div className="h-2.5 w-24 rounded bg-white/10" />
    </span>
    <div className="h-2.5 w-12 shrink-0 rounded bg-white/10" />
  </div>
);

export const ChallengeLeaderboardPanel = React.memo(
  function ChallengeLeaderboardPanel({
    state,
    isSettled = false,
    onRefresh,
    viewerDisplayName,
    viewerAvatarUrl,
    viewerCombo = 0,
    viewerScore = 0,
    gainAnimKey = 0,
    gainAmount = 0,
  }: ChallengeLeaderboardPanelProps) {
    const { scrollRef, onWheel } =
      useScoreboardWheelScroll<HTMLDivElement>();
    const data: ChallengeProjectedLeaderboardResponse | null =
      state.status === "loaded" ? state.data : null;

    const meUserId = data?.myStanding.viewerDbUserId ?? null;

    const skeletonStanding = useMemo<ChallengeProjectedMyStanding>(
      () => ({
        liveScore: viewerScore,
        officialBestScore: null,
        projectedRank: null,
        officialRank: null,
        totalPlayers: 0,
        rankIsFinal: false,
        viewerDbUserId: null,
        nextTarget: null,
      }),
      [viewerScore],
    );

    const liveStanding = useMemo<ChallengeProjectedMyStanding | null>(
      () =>
        data
          ? {
              ...data.myStanding,
              liveScore: viewerScore,
            }
          : null,
      [data, viewerScore],
    );

    const selfRowProps =
      data && liveStanding
        ? {
            standing: liveStanding,
            isSettled,
            displayName: viewerDisplayName,
            avatarUrl: viewerAvatarUrl,
            combo: viewerCombo,
            gainAnimKey,
            gainAmount,
          }
        : {
            standing: skeletonStanding,
            isSettled: false,
            displayName: viewerDisplayName,
            avatarUrl: viewerAvatarUrl,
            combo: viewerCombo,
            gainAnimKey,
            gainAmount,
          };

    const hasSelfInfo = Boolean(viewerDisplayName);
    const topRows = useMemo(
      () => (data ? data.topEntries.slice(0, 10) : []),
      [data],
    );
    const isTopTenMode =
      data?.myStanding.projectedRank !== null &&
      data?.myStanding.projectedRank !== undefined &&
      data.myStanding.projectedRank <= 10;
    const displayedTopRows = isTopTenMode ? topRows : topRows.slice(0, 5);
    const topPadCount = Math.max(
      0,
      (isTopTenMode ? 10 : 5) - displayedTopRows.length,
    );
    const nearbyRows = useMemo(
      () =>
        data && !isTopTenMode
          ? buildChallengeNearbyDisplayRows({
              nearbyOpponents: data.nearbyOpponents,
              myStanding: data.myStanding,
              liveScore: data.myStanding.liveScore,
              meUserId,
              slots: 5,
            })
          : [],
      [data, isTopTenMode, meUserId],
    );

    if (state.status === "idle" || state.status === "loading") {
      return (
        <div
          className="challenge-lb-panel game-room-scoreboard-body h-full"
          onWheel={onWheel}
        >
          <div
            ref={scrollRef}
            className="game-room-scoreboard-list mq-autohide-scrollbar px-1 py-1"
          >
            <div className="game-room-scoreboard-stack overflow-visible">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} opacity={1 - i * 0.1} />
              ))}
              <ChallengeEllipsisRow />
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={`n${i}`} opacity={0.55 - i * 0.07} />
              ))}
              {hasSelfInfo ? (
                <ChallengeSelfRow {...selfRowProps} />
              ) : (
                <SkeletonRow opacity={0.4} />
              )}
            </div>
          </div>
          <div className="game-room-scoreboard-self-sticky-bar px-1">
            <ChallengeSeparatorRow />
            {hasSelfInfo ? (
              <ChallengeSelfRow {...selfRowProps} />
            ) : (
              <SkeletonRow opacity={0.7} />
            )}
          </div>
        </div>
      );
    }

    if (state.status === "error") {
      return (
        <div className="challenge-lb-panel flex flex-col items-center justify-center h-full gap-3 text-center px-4">
          <p className="text-sm text-slate-400">{state.message}</p>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1 rounded-md bg-white/10 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/15 transition-colors"
            >
              <RefreshRoundedIcon fontSize="inherit" />
              重新載入
            </button>
          )}
        </div>
      );
    }

    if (!data) return null;

    return (
      <div
        className="challenge-lb-panel game-room-scoreboard-body h-full"
        onWheel={onWheel}
      >
        <div
          ref={scrollRef}
          className="game-room-scoreboard-list mq-autohide-scrollbar px-1 py-1"
        >
          <div className="game-room-scoreboard-stack overflow-visible">
            {displayedTopRows.map((entry) => (
              <ChallengeTopEntryRow
                key={entry.userId}
                entry={entry}
                isMe={meUserId ? entry.userId === meUserId : false}
              />
            ))}
            {Array.from({ length: topPadCount }).map((_, i) => (
              <ChallengePlaceholderRow key={`tp${i}`} dim />
            ))}

            {!isTopTenMode && (
              <>
                <ChallengeEllipsisRow />
                {nearbyRows.map((row) => {
                  if (row.type === "placeholder") {
                    return <ChallengePlaceholderRow key={row.key} />;
                  }
                  if (row.type === "opponent") {
                    return (
                      <ChallengeNearbyRow
                        key={row.key}
                        opponent={row.opponent}
                      />
                    );
                  }
                  return <ChallengeSelfRow key={row.key} {...selfRowProps} />;
                })}
              </>
            )}
          </div>
        </div>
        <div className="game-room-scoreboard-self-sticky-bar px-1">
          <ChallengeSeparatorRow />
          <ChallengeSelfRow {...selfRowProps} />
        </div>
      </div>
    );
  },
);
