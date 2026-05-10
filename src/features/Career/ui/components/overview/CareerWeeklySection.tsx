import React from "react";

import type { CareerWeeklyStats } from "../../../types/career";
import {
  formatCareerPercent,
  formatCareerScore,
  formatCareerSignedInt,
  formatCareerSignedPercent,
} from "../../../model/careerUiFormatters";
import CareerSurface from "./CareerSurface";

interface CareerWeeklySectionProps {
  weekly: CareerWeeklyStats;
}

const getDeltaClassName = (value: number | null) => {
  if (value === null || !Number.isFinite(value)) return "text-slate-400";
  if (value > 0) return "text-emerald-300";
  if (value < 0) return "text-rose-300";
  return "text-slate-300";
};

const CareerWeeklySection: React.FC<CareerWeeklySectionProps> = ({
  weekly,
}) => {
  const items = [
    {
      label: "對戰",
      value: weekly.currentMatches.toLocaleString("zh-TW"),
      delta: weekly.matchesDelta,
      deltaLabel: formatCareerSignedInt(weekly.matchesDelta),
    },
    {
      label: "總分",
      value: formatCareerScore(weekly.currentScore),
      delta: weekly.scoreDelta,
      deltaLabel: formatCareerSignedInt(weekly.scoreDelta),
    },
    {
      label: "答對率",
      value: formatCareerPercent(weekly.currentAccuracyRate),
      delta: weekly.accuracyDelta,
      deltaLabel: formatCareerSignedPercent(weekly.accuracyDelta),
    },
  ];

  return (
    <CareerSurface>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--mc-text)]">
          本週
        </h3>

        <div className="rounded-full border border-emerald-300/24 bg-emerald-300/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-emerald-100">
          WEEK
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-[18px] border border-white/8 bg-white/[0.045] p-3"
          >
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                  {item.label}
                </div>

                <div className="mt-1 text-2xl font-semibold text-[var(--mc-text)]">
                  {item.value}
                </div>
              </div>

              <div
                className={`rounded-full border border-current/20 bg-current/10 px-2.5 py-1 text-xs font-semibold ${getDeltaClassName(
                  item.delta,
                )}`}
              >
                {item.deltaLabel}
              </div>
            </div>
          </div>
        ))}
      </div>
    </CareerSurface>
  );
};

export default CareerWeeklySection;
