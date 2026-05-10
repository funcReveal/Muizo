import React from "react";

import type { CareerCompositeStats } from "../../../types/career";
import {
  formatCareerPercent,
  formatCareerScore,
} from "../../../model/careerUiFormatters";
import CareerSurface, { careerMiniCardClass } from "./CareerSurface";

interface CareerCompositeSectionProps {
  composite: CareerCompositeStats;
}

const CareerCompositeSection: React.FC<CareerCompositeSectionProps> = ({
  composite,
}) => {
  const maxTrend = Math.max(...composite.trend.map((item) => item.score), 1);
  const hasTrend = composite.trend.length > 0;

  const stats = [
    {
      label: "平均名次",
      value: composite.averagePlacement?.toFixed(1) ?? "-",
    },
    {
      label: "平均得分",
      value: formatCareerScore(composite.averageScore),
    },
    {
      label: "Top 3 率",
      value: formatCareerPercent(composite.top3Rate),
    },
    {
      label: "第一名",
      value: composite.firstPlaceCount.toLocaleString("zh-TW"),
    },
    {
      label: "平均答對率",
      value: formatCareerPercent(composite.averageAccuracyRate),
    },
  ];

  return (
    <CareerSurface className="h-full">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-[var(--mc-text)]">
            綜合表現
          </h3>
        </div>

        <div className="rounded-full border border-sky-300/24 bg-sky-300/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] text-sky-100">
          OVERALL
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label} className={careerMiniCardClass}>
            <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
              {stat.label}
            </div>
            <div className="mt-1 text-xl font-semibold text-[var(--mc-text)]">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[20px] border border-white/8 bg-black/16 p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-[var(--mc-text)]">
            分數趨勢
          </div>
          <div className="text-[11px] text-[var(--mc-text-muted)]">
            近期紀錄
          </div>
        </div>

        {hasTrend ? (
          <div className="flex min-h-[168px] items-end gap-2 overflow-x-auto pb-1">
            {composite.trend.map((point) => {
              const height = Math.max(
                20,
                Math.round((point.score / maxTrend) * 124),
              );

              return (
                <div
                  key={`${point.label}-${point.score}`}
                  className="flex min-w-[42px] flex-1 flex-col items-center justify-end gap-2"
                >
                  <div className="text-[10px] font-semibold text-slate-300">
                    {point.score.toLocaleString("zh-TW")}
                  </div>

                  <div className="flex h-[128px] items-end">
                    <div
                      className="w-7 rounded-t-lg bg-[linear-gradient(180deg,rgba(103,232,249,0.96),rgba(37,99,235,0.9))] shadow-[0_0_18px_rgba(14,165,233,0.24)]"
                      style={{ height }}
                    />
                  </div>

                  <div className="max-w-[56px] truncate text-[10px] text-[var(--mc-text-muted)]">
                    {point.label}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex min-h-[168px] items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.025] px-4 text-center text-sm text-[var(--mc-text-muted)]">
            尚無趨勢資料
          </div>
        )}
      </div>
    </CareerSurface>
  );
};

export default CareerCompositeSection;
