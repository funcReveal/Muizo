import React, { useMemo } from "react";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import type {
  ChallengeProjectedLeaderboardResponse,
  ChallengeProjectedMyStanding,
  ChallengeProjectionState,
  ChallengeNearbyOpponent,
} from "../../model/projectionTypes";
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
    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 animate-pulse"
    style={{ opacity }}
  >
    <div className="h-3.5 w-5 rounded bg-white/10" />
    <div className="h-5 w-5 rounded-full bg-white/10" />
    <div className="h-2.5 flex-1 rounded bg-white/10" />
    <div className="h-2.5 w-12 rounded bg-white/10" />
  </div>
);

// ---------------------------------------------------------------------------
// Nearby section layout computation
//
// Total nearby slots = 5: [aheadToShow opponents][self][passedToShow opponents]
// passedToShow = min(passed.length, 2)
// aheadToShow  = 4 - passedToShow
// Both arrays sorted DESC by bestScore (highest first).
// displayAhead = ahead.slice(-aheadToShow) — the closest N ahead opponents.
// displayPassed = passed.slice(0, passedToShow) — the 2 closest passed opponents.
// Remaining slots filled with ChallengePlaceholderRow.
// ---------------------------------------------------------------------------

function buildNearbyLayout(
  nearbyOpponents: ChallengeNearbyOpponent[],
  meUserId: string | null,
): {
  displayAhead: ChallengeNearbyOpponent[];
  displayPassed: ChallengeNearbyOpponent[];
  aheadPadCount: number;
  passedPadCount: number;
} {
  const opponents = meUserId
    ? nearbyOpponents.filter((n) => n.userId !== meUserId)
    : nearbyOpponents;

  const ahead = opponents
    .filter((n) => n.relation === "ahead")
    .sort((a, b) => b.bestScore - a.bestScore);

  const passed = opponents
    .filter((n) => n.relation === "passed")
    .sort((a, b) => b.bestScore - a.bestScore);

  const passedToShow = Math.min(passed.length, 2);
  const aheadToShow = 4 - passedToShow;

  const displayPassed = passed.slice(0, passedToShow);
  // slice(-N) gives last N in DESC-sorted array = closest ahead opponents
  const displayAhead = aheadToShow > 0 ? ahead.slice(-aheadToShow) : [];

  const aheadPadCount = Math.max(0, aheadToShow - displayAhead.length);
  const passedPadCount = Math.max(0, passedToShow - displayPassed.length);

  return { displayAhead, displayPassed, aheadPadCount, passedPadCount };
}

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

    // Minimal standing used in skeleton state — rank unknown, totalPlayers unknown
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
    // Shows real self row at bottom immediately; top5+nearby remain skeleton.
    // -----------------------------------------------------------------------
    if (state.status === "idle" || state.status === "loading") {
      return (
        <div className="challenge-lb-panel flex flex-col h-full overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto px-1 py-1.5 space-y-0.5">
            {/* Top 5 skeleton */}
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} opacity={1 - i * 0.1} />
            ))}

            {/* Ellipsis */}
            <ChallengeEllipsisRow />

            {/* Nearby 4 skeleton + real self at position 5 */}
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonRow key={`n${i}`} opacity={0.55 - i * 0.07} />
            ))}
            {hasSelfInfo ? (
              <ChallengeSelfRow {...selfRowProps} />
            ) : (
              <SkeletonRow opacity={0.4} />
            )}

            {/* Separator + fixed self */}
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

    // Top 5 padded to always render 5 rows
    const topRows = topEntries.slice(0, 5);
    const topPadCount = Math.max(0, 5 - topRows.length);

    // Nearby layout
    const { displayAhead, displayPassed, aheadPadCount, passedPadCount } =
      buildNearbyLayout(nearbyOpponents, meUserId);

    return (
      <div className="challenge-lb-panel flex flex-col h-full overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto px-1 py-1.5 space-y-0.5">

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

          {/* ── Ellipsis — exactly one row height ── */}
          <ChallengeEllipsisRow />

          {/* ── Nearby section: 4 opponent slots + self = 5 rows total ── */}

          {/* Ahead placeholders (top of window, farthest ahead) */}
          {Array.from({ length: aheadPadCount }).map((_, i) => (
            <ChallengePlaceholderRow key={`ap${i}`} />
          ))}

          {/* Ahead opponents — highest score first (farthest), closest just above self */}
          {displayAhead.map((opp) => (
            <ChallengeNearbyRow key={opp.userId} opponent={opp} />
          ))}

          {/* Self row — inline position in the window */}
          <ChallengeSelfRow {...selfRowProps} />

          {/* Passed opponents — highest passed first (closest below self) */}
          {displayPassed.map((opp) => (
            <ChallengeNearbyRow key={opp.userId} opponent={opp} />
          ))}

          {/* Passed placeholders */}
          {Array.from({ length: passedPadCount }).map((_, i) => (
            <ChallengePlaceholderRow key={`pp${i}`} />
          ))}

          {/* ── Separator ── */}
          <ChallengeSeparatorRow />

          {/* ── Fixed self row at bottom ── */}
          <ChallengeSelfRow {...selfRowProps} />

        </div>
      </div>
    );
  },
);
