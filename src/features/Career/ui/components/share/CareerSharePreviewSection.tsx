import React from "react";

import type { CareerShareCardData } from "../../../types/career";
import {
  formatCareerPlayTime,
  formatCareerRank,
  formatCareerScore,
} from "../../../model/careerUiFormatters";
import CareerSectionHeader from "../primitives/CareerSectionHeader";
import CareerStatCard from "../primitives/CareerStatCard";
import CareerWorkbenchShell from "../primitives/CareerWorkbenchShell";

interface CareerSharePreviewSectionProps {
  preview: CareerShareCardData;
}

const CareerSharePreviewSection: React.FC<CareerSharePreviewSectionProps> = ({
  preview,
}) => {
  return (
    <CareerWorkbenchShell className="min-h-0 p-4">
      <CareerSectionHeader
        title="分享卡預覽"
        description="之後可以直接輸出成圖片，先把卡片資訊層級固定下來。"
        compact
      />

      <div className="mt-4 flex min-h-0 items-center justify-center">
        <div className="w-full max-w-[620px] rounded-[28px] border border-sky-300/18 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.22),transparent_34%),linear-gradient(135deg,rgba(11,24,49,0.98),rgba(6,12,24,0.98))] p-5 shadow-[0_24px_60px_-36px_rgba(14,165,233,0.7)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="text-3xl font-bold tracking-tight text-white">
                Muizo
              </div>
              <div className="mt-2 text-sm font-semibold text-sky-300">
                Career Snapshot
              </div>
            </div>

            <div className="shrink-0 rounded-full border border-sky-300/28 bg-sky-300/10 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-sky-100">
              {preview.descriptor}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <CareerStatCard
              label="對戰數"
              value={preview.totalMatches.toLocaleString("zh-TW")}
              emphasis="accent"
              className="border-sky-300/14 bg-white/5"
            />

            <CareerStatCard
              label="最佳名次"
              value={formatCareerRank(preview.bestRank)}
              emphasis="accent"
              className="border-sky-300/14 bg-white/5"
            />

            <CareerStatCard
              label="最高分"
              value={formatCareerScore(preview.bestScore)}
              emphasis="accent"
              className="border-sky-300/14 bg-white/5"
            />

            <CareerStatCard
              label="最高 Combo"
              value={preview.bestCombo ? `x${preview.bestCombo}` : "-"}
              emphasis="accent"
              className="border-sky-300/14 bg-white/5"
            />
          </div>

          <div className="mt-4 rounded-[20px] border border-white/10 bg-white/5 p-4">
            <div className="text-[11px] tracking-[0.12em] text-slate-300">
              {preview.highlightTitle}
            </div>

            <div className="mt-2 text-3xl font-semibold text-white">
              {preview.highlightValue}
            </div>

            <div className="mt-2 text-sm leading-6 text-slate-200/80">
              {preview.highlightSubtitle}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
            <span className="font-semibold text-slate-100">
              {preview.playerName}
            </span>
            <span>總分 {formatCareerScore(preview.totalScore)}</span>
            <span>{formatCareerPlayTime(preview.playTimeSec)}</span>
          </div>
        </div>
      </div>
    </CareerWorkbenchShell>
  );
};

export default CareerSharePreviewSection;
