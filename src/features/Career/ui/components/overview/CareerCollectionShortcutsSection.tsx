import React from "react";

import type { CareerCollectionRankShortcutItem } from "../../../types/career";
import {
  formatCareerDelta,
  formatCareerRank,
  getCareerDeltaClassName,
} from "../../../model/careerUiFormatters";
import CareerSurface from "./CareerSurface";

interface CareerCollectionShortcutsSectionProps {
  items: CareerCollectionRankShortcutItem[];
  onOpenCollectionRanks: () => void;
}

const CareerCollectionShortcutsSection: React.FC<
  CareerCollectionShortcutsSectionProps
> = ({ items, onOpenCollectionRanks }) => {
  return (
    <CareerSurface>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--mc-text)]">
          題庫戰績
        </h3>

        <button
          type="button"
          onClick={onOpenCollectionRanks}
          className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1.5 text-[11px] font-semibold text-sky-100 transition hover:border-sky-300/45 hover:bg-sky-300/16"
        >
          全部
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={onOpenCollectionRanks}
              className="flex w-full items-center justify-between gap-4 rounded-[16px] border border-white/8 bg-white/[0.04] px-3 py-2.5 text-left transition hover:border-amber-200/20 hover:bg-white/[0.06]"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-[var(--mc-text)]">
                  {item.title}
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--mc-text-muted)]">
                  {formatCareerRank(item.leaderboardRank)}
                </div>
              </div>

              <div
                className={`shrink-0 text-sm font-semibold ${getCareerDeltaClassName(
                  item.delta,
                )}`}
              >
                {formatCareerDelta(item.delta)}
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-[16px] border border-dashed border-white/10 bg-white/[0.025] px-4 py-5 text-center text-sm text-[var(--mc-text-muted)]">
            尚無題庫戰績
          </div>
        )}
      </div>
    </CareerSurface>
  );
};

export default CareerCollectionShortcutsSection;
