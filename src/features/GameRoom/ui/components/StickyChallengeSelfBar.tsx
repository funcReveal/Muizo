import React from "react";
import type { ChallengeProjectedMyStanding } from "../../model/projectionTypes";

interface StickyChallengeSelfBarProps {
  standing: ChallengeProjectedMyStanding;
  isSettled?: boolean;
}

export const StickyChallengeSelfBar = React.memo(
  function StickyChallengeSelfBar({
    standing,
    isSettled = false,
  }: StickyChallengeSelfBarProps) {
    const { liveScore, projectedRank, officialRank, nextTarget } = standing;
    const rankDisplay = isSettled
      ? officialRank !== null
        ? `#${officialRank}`
        : "--"
      : projectedRank !== null
        ? `#${projectedRank}`
        : "--";
    const rankColor = isSettled ? "text-amber-300" : "text-sky-300";

    return (
      <div className="sticky-challenge-self-bar sticky bottom-0 z-10 border-t border-white/10 bg-slate-900/95 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-white/80">
                YOU
              </span>
              <span className={`text-sm font-bold ${rankColor}`}>
                {rankDisplay}
              </span>
            </div>
            {nextTarget && !isSettled ? (
              <div className="mt-0.5 truncate text-xs text-slate-400">
                <span>{nextTarget.displayName}</span>{" "}
                <span className="font-medium text-rose-400">
                  -{Math.abs(nextTarget.gap).toLocaleString()}
                </span>
              </div>
            ) : null}
          </div>
          <div className="shrink-0 text-right font-mono text-base font-bold text-white">
            {liveScore.toLocaleString()}
          </div>
        </div>
      </div>
    );
  },
);
