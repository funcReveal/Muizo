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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChallengeLeaderboardPanelProps {
  state: ChallengeProjectionState;
  isSettled?: boolean;
  onRefresh?: () => void;
  viewerDisplayName?: string;
  viewerAvatarUrl?: string | null;
  /** Current combo from room participant state */
  viewerCombo?: number;
  /** Current live score from room participant state — shown immediately in skeleton */
  viewerScore?: number;
  /** Increments on each score gain — drives React key for animation restart */
  gainAnimKey?: number;
  /** Delta to animate as "+N" floating text */
  gainAmount?: number;
}

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------

const SkeletonRow: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <div
    className="game-room-score-row flex items-center justify-between animate-pulse"
    style={{ opacity }}
  >
    <span className="flex items-center gap-2">
      <div className="h-3.5 w-5 rounded bg-white/10" />
      <div className="h-[38px] w-[38px] rounded-full bg-white/10" />
      <div className="h-2.5 w-24 rounded bg-white/10" />
    </span>
    <div className="h-2.5 w-12 rounded bg-white/10" />
  </div>
);

// ---------------------------------------------------------------------------
// Main panel
// ---------------------------------------------------------------------------

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

    const selfRowProps = data
      ? {
          standing: data.myStanding,
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

    // -----------------------------------------------------------------------
    // Skeleton / loading state
    // -----------------------------------------------------------------------
    if (state.status === "idle" || state.status === "loading") {
      return (
        <div className="challenge-lb-panel flex flex-col h-full overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto px-1 py-1 space-y-1">
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

    // -----------------------------------------------------------------------
    // Error state
    // -----------------------------------------------------------------------
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

    const { topEntries, nearbyOpponents, myStanding } = data;

    const topRows = topEntries.slice(0, 5);
    const topPadCount = Math.max(0, 5 - topRows.length);

    const nearbyRows = buildChallengeNearbyDisplayRows({
      nearbyOpponents,
      myStanding,
      liveScore: myStanding.liveScore,
      meUserId,
      slots: 5,
    });

    return (
      <div className="challenge-lb-panel flex flex-col h-full overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto px-1 py-1 space-y-1">

          {/* ── Top 5 ── */}
          {topRows.map((entry) => (
            <ChallengeTopEntryRow
              key={entry.userId}
              entry={entry}
              isMe={meUserId ? entry.userId === meUserId : false}
            />
          ))}
          {Array.from({ length: topPadCount }).map((_, i) => (
            <ChallengePlaceholderRow key={`tp${i}`} dim />
          ))}

          {/* ── Ellipsis ── */}
          <ChallengeEllipsisRow />

          {/* ── Nearby section: 5 rows ── */}
          {nearbyRows.map((row) => {
            if (row.type === "placeholder") {
              return <ChallengePlaceholderRow key={row.key} />;
            }
            if (row.type === "opponent") {
              return (
                <ChallengeNearbyRow
                  key={row.key}
                  opponent={row.opponent}
                  liveScore={myStanding.liveScore}
                />
              );
            }
            return <ChallengeSelfRow key={row.key} {...selfRowProps} />;
          })}

          {/* ── Separator ── */}
          <ChallengeSeparatorRow />

          {/* ── Fixed self row at bottom ── */}
          <ChallengeSelfRow {...selfRowProps} />

        </div>
      </div>
    );
  },
);
