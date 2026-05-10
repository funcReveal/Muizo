import React from "react";

import type { CareerHighlightItem } from "../../../types/career";
import CareerSurface from "./CareerSurface";

interface CareerHighlightsSectionProps {
  highlights: CareerHighlightItem[];
  onOpenShare: () => void;
}

const CareerHighlightsSection: React.FC<CareerHighlightsSectionProps> = ({
  highlights,
  onOpenShare,
}) => {
  return (
    <CareerSurface>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--mc-text)]">
          高光
        </h3>

        <button
          type="button"
          onClick={onOpenShare}
          className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-100 transition hover:border-emerald-300/45 hover:bg-emerald-300/16"
        >
          分享
        </button>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {highlights.length > 0 ? (
          highlights.map((item) => (
            <div
              key={`${item.key}-${item.label}`}
              className={`rounded-[18px] border p-3 ${item.accentClass}`}
            >
              <div className="text-[11px] tracking-[0.12em] text-slate-200/90">
                {item.label}
              </div>

              <div className="mt-2 text-2xl font-semibold text-white">
                {item.value}
              </div>

              <div className="mt-1 truncate text-xs text-slate-200/75">
                {item.subtitle}
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[16px] border border-dashed border-white/10 bg-white/[0.025] px-4 py-5 text-center text-sm text-[var(--mc-text-muted)] sm:col-span-2">
            尚無高光紀錄
          </div>
        )}
      </div>
    </CareerSurface>
  );
};

export default CareerHighlightsSection;
