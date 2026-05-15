import React, { useEffect, useMemo, useRef, useState } from "react";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import type {
  ChallengeProjectedMyStanding,
  ChallengeProjectionState,
} from "../../model/projectionTypes";
import { buildChallengeLeaderboardDisplayRows } from "../../model/buildChallengeLeaderboardDisplayRows";
import {
  ChallengeSeparatorRow,
  ChallengeSelfRow,
  ChallengeEllipsisRow,
} from "./ChallengeLeaderboardRow";
import type { ChallengeRankChangePulse } from "./ChallengeLeaderboardRow";
import { ChallengeAnimatedRows } from "./ChallengeAnimatedRows";
import type { SelfRowBaseProps } from "./ChallengeAnimatedRows";
import { useScoreboardWheelScroll } from "./useScoreboardWheelScroll";

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
// Panel props
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

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

const SCORE_GAIN_VISIBLE_BEFORE_RANK_SWAP_MS = 0;
const RANK_CHANGE_LANE_VISIBLE_MS = 2500;

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
    const { setScrollNodeRef, onWheel } =
      useScoreboardWheelScroll<HTMLDivElement>();

    const sourceData = state.status === "loaded" ? state.data : null;
    const [displayData, setDisplayData] = useState(sourceData);
    const [rankChange, setRankChange] =
      useState<ChallengeRankChangePulse | null>(null);
    const displayDataRef = useRef(displayData);
    const presentationScopeKeyRef = useRef<string | null>(null);
    const rankChangeKeyRef = useRef(0);
    const commitTimerRef = useRef<number | null>(null);
    const clearRankChangeTimerRef = useRef<number | null>(null);

    useEffect(() => {
      const clearTimers = () => {
        if (commitTimerRef.current !== null) {
          window.clearTimeout(commitTimerRef.current);
          commitTimerRef.current = null;
        }
        if (clearRankChangeTimerRef.current !== null) {
          window.clearTimeout(clearRankChangeTimerRef.current);
          clearRankChangeTimerRef.current = null;
        }
      };

      const commitDisplayData = (
        nextData: typeof sourceData,
        nextRankChange: ChallengeRankChangePulse | null,
      ) => {
        displayDataRef.current = nextData;
        setDisplayData(nextData);
        setRankChange(nextRankChange);
      };

      if (!sourceData) {
        clearTimers();
        presentationScopeKeyRef.current = null;
        commitDisplayData(null, null);
        return clearTimers;
      }

      const presentationScopeKey = [
        sourceData.roomId,
        sourceData.collectionId,
        sourceData.profileKey,
        sourceData.myStanding.viewerDbUserId ?? "",
        viewerDisplayName ?? "",
        viewerAvatarUrl ?? "",
      ].join(":");
      const previousData = displayDataRef.current;
      if (
        !previousData ||
        presentationScopeKeyRef.current !== presentationScopeKey
      ) {
        clearTimers();
        presentationScopeKeyRef.current = presentationScopeKey;
        commitDisplayData(sourceData, null);
        return clearTimers;
      }

      const fromRank = previousData.myStanding.projectedRank;
      const toRank = sourceData.myStanding.projectedRank;
      if (
        fromRank === null ||
        toRank === null ||
        fromRank === toRank
      ) {
        clearTimers();
        commitDisplayData(sourceData, null);
        return clearTimers;
      }

      clearTimers();
      const commitRankChange = () => {
        const nextRankChange: ChallengeRankChangePulse = {
          key: ++rankChangeKeyRef.current,
          fromRank,
          toRank,
          direction: toRank < fromRank ? "up" : "down",
        };
        commitDisplayData(sourceData, nextRankChange);
        clearRankChangeTimerRef.current = window.setTimeout(() => {
          setRankChange(null);
          clearRankChangeTimerRef.current = null;
        }, RANK_CHANGE_LANE_VISIBLE_MS);
      };

      if (
        gainAnimKey <= 0 ||
        gainAmount <= 0 ||
        SCORE_GAIN_VISIBLE_BEFORE_RANK_SWAP_MS <= 0
      ) {
        commitRankChange();
      } else {
        commitTimerRef.current = window.setTimeout(
          commitRankChange,
          SCORE_GAIN_VISIBLE_BEFORE_RANK_SWAP_MS,
        );
      }

      return clearTimers;
    }, [gainAmount, gainAnimKey, sourceData, viewerAvatarUrl, viewerDisplayName]);

    const data = displayData;

    const meUserId = data?.myStanding.viewerDbUserId ?? null;

    // -----------------------------------------------------------------------
    // Self row base props (without gapToNext — supplied by display row model)
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
          ? { ...data.myStanding, liveScore: viewerScore }
          : null,
      [data, viewerScore],
    );

    const selfRowBaseProps = useMemo<SelfRowBaseProps>(
      () =>
        data && liveStanding
          ? {
            standing: liveStanding,
            isSettled,
            displayName: viewerDisplayName,
            avatarUrl: viewerAvatarUrl,
            combo: viewerCombo,
            gainAnimKey,
            gainAmount,
            rankChange,
          }
          : {
            standing: skeletonStanding,
            isSettled: false,
            displayName: viewerDisplayName,
            avatarUrl: viewerAvatarUrl,
            combo: viewerCombo,
            gainAnimKey,
            gainAmount,
            rankChange: null,
          },
      [
        data,
        liveStanding,
        isSettled,
        viewerDisplayName,
        viewerAvatarUrl,
        viewerCombo,
        gainAnimKey,
        gainAmount,
        rankChange,
        skeletonStanding,
      ],
    );

    const hasSelfInfo = Boolean(viewerDisplayName);

    // -----------------------------------------------------------------------
    // Build display rows (pure function — no side-effects)
    // -----------------------------------------------------------------------

    const { listRows } = useMemo(
      () =>
        data
          ? buildChallengeLeaderboardDisplayRows({
            data,
            viewerScore,
            meUserId,
          })
          : { layoutMode: "nearby" as const, listRows: [] },
      [data, viewerScore, meUserId],
    );

    const stickySelfRowBaseProps = useMemo<SelfRowBaseProps>(() => {
      const listSelfRank =
        listRows.find((row) => row.kind === "self")?.displayRank ?? null;
      if (!data || listSelfRank === null) return selfRowBaseProps;

      return {
        ...selfRowBaseProps,
        standing: {
          ...selfRowBaseProps.standing,
          projectedRank: listSelfRank,
        },
      };
    }, [data, listRows, selfRowBaseProps]);

    // -----------------------------------------------------------------------
    // Loading state
    // -----------------------------------------------------------------------

    if (state.status === "idle" || state.status === "loading") {
      return (
        <div
          className="challenge-lb-panel game-room-scoreboard-body h-full"
          onWheel={onWheel}
        >
          <div
            ref={setScrollNodeRef}
            className="game-room-scoreboard-list mq-autohide-scrollbar px-1 py-1"
          >
            <div className="game-room-scoreboard-stack challenge-lb-animated-stack">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} opacity={1 - i * 0.1} />
              ))}
              <ChallengeEllipsisRow />
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={`n${i}`} opacity={0.55 - i * 0.07} />
              ))}
              {hasSelfInfo ? (
                <ChallengeSelfRow {...selfRowBaseProps} />
              ) : (
                <SkeletonRow opacity={0.4} />
              )}
            </div>
          </div>
          <div className="game-room-scoreboard-self-sticky-bar px-1">
            <ChallengeSeparatorRow />
            {hasSelfInfo ? (
              <ChallengeSelfRow {...selfRowBaseProps} showGainLane={false} />
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

    // -----------------------------------------------------------------------
    // Loaded render
    //
    // Layout is fully determined by buildChallengeLeaderboardDisplayRows:
    //   top-window  (projectedRank ≤ 10) — self injected into Top-10 list
    //   top-eleven  (projectedRank = 11) — Top-10 + self at #11, no ellipsis
    //   nearby      (projectedRank ≥ 12 or null) — Top-5 + ellipsis + nearby
    //
    // ChallengeAnimatedRows handles move / enter / exit animations.
    // The sticky self bar is rendered separately and never participates in
    // the list's layout animations.
    // -----------------------------------------------------------------------

    return (
      <div
        className="challenge-lb-panel game-room-scoreboard-body h-full"
        onWheel={onWheel}
      >
        <div
          ref={setScrollNodeRef}
          className="game-room-scoreboard-list mq-autohide-scrollbar px-1 py-1"
        >
          <div className="game-room-scoreboard-stack challenge-lb-animated-stack">
            <ChallengeAnimatedRows
              rows={listRows}
              selfRowBaseProps={selfRowBaseProps}
            />
          </div>
        </div>

        {/* Sticky self bar — always visible, separate from animated list */}
        <div className="game-room-scoreboard-self-sticky-bar px-1">
          <ChallengeSeparatorRow />
          <ChallengeSelfRow {...stickySelfRowBaseProps} showGainLane={false} />
        </div>
      </div>
    );
  },
);
