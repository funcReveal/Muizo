import React, { useMemo } from "react";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import type {
  ChallengeLeaderboardEntry,
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
import { useChallengeFlip } from "./useChallengeFlip";

// ---------------------------------------------------------------------------
// Layout modes
// ---------------------------------------------------------------------------

/**
 * top-ten  — projectedRank ≤ 10: self injected into the top-10 list.
 * eleventh — projectedRank = 11: top-10 shown, full-height ellipsis, then self.
 * nearby   — projectedRank ≥ 12 (or unknown): top-5 + ellipsis + 5 nearby rows.
 */
type ChallengeLayoutMode = "top-ten" | "eleventh" | "nearby";

// ---------------------------------------------------------------------------
// Merged-top-section row type
// ---------------------------------------------------------------------------

type TopSectionRow =
  | { type: "official"; entry: ChallengeLeaderboardEntry; isMe: boolean }
  | { type: "self" };

// ---------------------------------------------------------------------------
// Skeleton row (loading state)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

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
    const { scrollRef, onWheel } = useScoreboardWheelScroll<HTMLDivElement>();
    const { refFor } = useChallengeFlip();

    const data: ChallengeProjectedLeaderboardResponse | null =
      state.status === "loaded" ? state.data : null;

    const meUserId = data?.myStanding.viewerDbUserId ?? null;

    // -----------------------------------------------------------------------
    // Standing snapshots
    // -----------------------------------------------------------------------

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

    // -----------------------------------------------------------------------
    // Layout mode
    // -----------------------------------------------------------------------

    const projectedRank = data?.myStanding.projectedRank ?? null;

    const layoutMode = useMemo<ChallengeLayoutMode>(() => {
      if (projectedRank !== null && projectedRank <= 10) return "top-ten";
      if (projectedRank === 11) return "eleventh";
      return "nearby";
    }, [projectedRank]);

    // -----------------------------------------------------------------------
    // Top-section rows
    //
    // nearby   → top 5 official entries (viewer excluded)
    // eleventh → top 10 official entries (viewer excluded; self rendered below)
    // top-ten  → top 10, viewer's historical entry replaced by ChallengeSelfRow
    //            at the projected rank position (projectedRank ≤ 10 guaranteed)
    //
    // The viewer's historical DB entry is ALWAYS excluded from the official list,
    // regardless of layout mode. In top-ten mode self is injected at projectedRank;
    // in nearby/eleventh it appears in the nearby section or below the ellipsis.
    //
    // Motivation: showing the historical entry (e.g. rank #2 best score) alongside
    // a live sticky bar at rank #10 is misleading — the displayed list must reflect
    // the current live competition state.
    // -----------------------------------------------------------------------

    const topRows = useMemo(
      () => (data ? data.topEntries.slice(0, 10) : []),
      [data],
    );

    const mergedTopRows = useMemo<TopSectionRow[]>(() => {
      const target = layoutMode === "nearby" ? 5 : 10;
      const baseRows = topRows.slice(0, target);

      // If the viewer already appears in the official top entries, just mark their
      // row with isMe so a YOU badge is shown. No injection or removal needed.
      const isSelfInOfficial =
        meUserId !== null && baseRows.some((e) => e.userId === meUserId);

      if (layoutMode !== "top-ten" || isSelfInOfficial) {
        return baseRows.map((entry) => ({
          type: "official",
          entry,
          isMe: meUserId !== null && entry.userId === meUserId,
        }));
      }

      // top-ten mode, self absent from official entries: live score exceeds the
      // viewer's all-time best (new record in progress, not yet committed to DB).
      // Inject ChallengeSelfRow at the projected rank position, shifting official
      // entries down. The last entry that overflows target is dropped.
      const insertAt = Math.min(projectedRank! - 1, target - 1);

      const result: TopSectionRow[] = [];
      let selfInserted = false;

      for (const entry of baseRows) {
        if (!selfInserted && result.length === insertAt) {
          result.push({ type: "self" });
          selfInserted = true;
        }
        if (result.length < target) {
          result.push({ type: "official", entry, isMe: false });
        }
      }
      if (!selfInserted && result.length < target) {
        result.push({ type: "self" });
      }

      return result;
    }, [layoutMode, topRows, meUserId, projectedRank]);

    const topPadCount = Math.max(
      0,
      (layoutMode === "nearby" ? 5 : 10) - mergedTopRows.length,
    );

    // Gap from viewer's live score to the #10 entry (eleventh mode only).
    // Positive = viewer is behind; negative = viewer has surpassed #10 locally.
    const eleventhGapToNext = useMemo(() => {
      if (layoutMode !== "eleventh" || !data) return null;
      const tenth = data.topEntries[9];
      if (!tenth) return null;
      return tenth.bestScore - viewerScore;
    }, [layoutMode, data, viewerScore]);

    // -----------------------------------------------------------------------
    // Nearby rows (nearby mode only)
    //
    // viewerScore is the authoritative live score from room participant state
    // and must be used here. Using data.myStanding.liveScore (API-time) causes
    // stale gap values and missing re-renders between refreshes.
    // -----------------------------------------------------------------------

    const nearbyRows = useMemo(
      () =>
        data && layoutMode === "nearby"
          ? buildChallengeNearbyDisplayRows({
              nearbyOpponents: data.nearbyOpponents,
              myStanding: data.myStanding,
              liveScore: viewerScore,
              meUserId,
              slots: 5,
            })
          : [],
      [data, layoutMode, meUserId, viewerScore],
    );

    // -----------------------------------------------------------------------
    // Loading / error states
    // -----------------------------------------------------------------------

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

    // -----------------------------------------------------------------------
    // Loaded render
    // -----------------------------------------------------------------------

    const topSection = (
      <>
        {mergedTopRows.map((row) =>
          row.type === "self" ? (
            // Wrap with a stable-height div so FLIP can measure top.
            // Key prefix "t-" avoids collisions with nearby section keys.
            <div key="t-self" ref={refFor("t-self")}>
              <ChallengeSelfRow {...selfRowProps} />
            </div>
          ) : (
            <div key={"t-" + row.entry.userId} ref={refFor("t-" + row.entry.userId)}>
              <ChallengeTopEntryRow entry={row.entry} isMe={row.isMe} />
            </div>
          ),
        )}
        {Array.from({ length: topPadCount }).map((_, i) => (
          <ChallengePlaceholderRow key={`tp${i}`} dim />
        ))}
      </>
    );

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

            {/* ── Top section ─────────────────────────────────────────────── */}
            {topSection}

            {/* ── Eleventh mode: full-height ellipsis + self ──────────────── */}
            {layoutMode === "eleventh" && (
              <>
                <ChallengeEllipsisRow fullRow />
                <div ref={refFor("self-eleventh")}>
                  <ChallengeSelfRow {...selfRowProps} gapToNext={eleventhGapToNext} />
                </div>
              </>
            )}

            {/* ── Nearby mode: compact ellipsis + animated nearby rows ─────── */}
            {layoutMode === "nearby" && (
              <>
                <ChallengeEllipsisRow />
                {nearbyRows.map((row) => {
                  if (row.type === "placeholder") {
                    // Placeholders are visual spacers — no FLIP animation
                    return <ChallengePlaceholderRow key={row.key} />;
                  }
                  if (row.type === "opponent") {
                    return (
                      // Wrap with a stable-height div so FLIP can measure top
                      <div key={row.key} ref={refFor(row.key)}>
                        <ChallengeNearbyRow
                          opponent={row.opponent}
                          approxRank={row.approxRank}
                          liveGap={row.liveGap}
                        />
                      </div>
                    );
                  }
                  // type === "self"
                  return (
                    <div key={row.key} ref={refFor(row.key)}>
                      <ChallengeSelfRow {...selfRowProps} />
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* ── Sticky self bar (always visible) ────────────────────────────── */}
        <div className="game-room-scoreboard-self-sticky-bar px-1">
          <ChallengeSeparatorRow />
          <ChallengeSelfRow {...selfRowProps} />
        </div>
      </div>
    );
  },
);
