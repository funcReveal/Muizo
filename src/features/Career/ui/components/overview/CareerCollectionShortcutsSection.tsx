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
    <CareerSurface className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-lg font-semibold tracking-tight text-[var(--mc-text)]">
          近期遊玩
        </h3>

        <button
          type="button"
          onClick={onOpenCollectionRanks}
          className="rounded-full border border-[var(--mc-border)] bg-amber-300/12 px-3 py-1.5 text-[11px] font-semibold text-[var(--mc-text)] transition hover:border-[var(--mc-accent)] hover:bg-amber-300/20"
        >
          全部
        </button>
      </div>

      <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2">
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
                  {item.lastPlayedAt
                    ? `最近 ${item.lastPlayedAt} · ${formatCareerRank(
                        item.leaderboardRank,
                      )}`
                    : formatCareerRank(item.leaderboardRank)}
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
          <div className="flex flex-1 items-center justify-center rounded-[16px] border border-dashed border-white/10 bg-white/[0.025] px-4 py-5 text-center text-sm text-[var(--mc-text-muted)]">
            尚無題庫戰績
          </div>
        )}
      </div>
    </CareerSurface>
  );
};

export default CareerCollectionShortcutsSection;
