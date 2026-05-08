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
    const {
      liveScore,
      projectedRank,
      officialRank,
      totalPlayers,
      nextTarget,
    } = standing;

    const rankDisplay = isSettled
      ? officialRank !== null
        ? `正式 #${officialRank}`
        : "未上榜"
      : projectedRank !== null
        ? `預估 #${projectedRank}`
        : "計算中";

    const rankColor = isSettled
      ? "text-amber-300"
      : "text-sky-300";

    return (
      <div className="sticky-challenge-self-bar sticky bottom-0 z-10 border-t border-white/10 bg-slate-900/95 px-3 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-white/80 uppercase tracking-wide">YOU</span>
              <span className={`text-sm font-bold ${rankColor}`}>{rankDisplay}</span>
              {totalPlayers > 0 && (
                <span className="text-xs text-slate-500">/ {totalPlayers.toLocaleString()} 人</span>
              )}
              {!isSettled && (
                <span className="text-xs text-slate-600 italic">（預估）</span>
              )}
            </div>
            {nextTarget && !isSettled && (
              <div className="mt-0.5 text-xs text-slate-400 truncate">
                目標：{nextTarget.displayName}，
                <span className="text-rose-400 font-medium">
                  還差 {Math.abs(nextTarget.gap).toLocaleString()}
                </span>
              </div>
            )}
            {isSettled && officialRank !== null && (
              <div className="mt-0.5 text-xs text-amber-500/60">
                結算後正式排名
              </div>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className="font-mono text-base font-bold text-white">
              {liveScore.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500">分</div>
          </div>
        </div>
      </div>
    );
  },
);
