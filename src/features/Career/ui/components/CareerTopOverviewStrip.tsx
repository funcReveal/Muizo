import React from "react";

import type { CareerHeroStats } from "../../types/career";
import {
  formatCareerPlayTime,
  formatCareerRank,
  formatCareerScore,
} from "../../model/careerUiFormatters";

interface CareerTopOverviewStripProps {
  hero: CareerHeroStats;
  avatarUrl?: string | null;
}

const quickCardClass =
  "rounded-[16px] border border-white/8 bg-white/[0.045] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]";

const CareerTopOverviewStrip: React.FC<CareerTopOverviewStripProps> = ({
  hero,
  avatarUrl,
}) => {
  const avatarLabel = hero.displayName.trim().slice(0, 2).toUpperCase() || "MU";

  const stats = [
    {
      label: "總場次",
      value: hero.totalMatches.toLocaleString("zh-TW"),
    },
    {
      label: "總分數",
      value: formatCareerScore(hero.totalScore),
    },
    {
      label: "最高分",
      value: formatCareerScore(hero.bestScore),
    },
    {
      label: "最佳名次",
      value: formatCareerRank(hero.bestRank),
    },
    {
      label: "遊玩時數",
      value: formatCareerPlayTime(hero.playTimeSec),
    },
    {
      label: "最高 Combo",
      value: hero.bestCombo ? `x${hero.bestCombo}` : "-",
    },
  ];

  return (
    <section className="relative shrink-0 overflow-hidden rounded-[26px] border border-[var(--mc-border)] bg-[radial-gradient(circle_at_16%_0%,rgba(245,158,11,0.16),transparent_34%),linear-gradient(180deg,rgba(20,17,13,0.98),rgba(8,7,5,0.99))] p-4 shadow-[0_22px_54px_-36px_var(--mc-glow),inset_0_1px_0_rgba(255,255,255,0.055)]">
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/45 to-transparent" />

      <div className="flex items-center gap-3">
        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-amber-200/28 bg-[radial-gradient(circle_at_30%_25%,rgba(251,191,36,0.95),rgba(120,53,15,0.95))] text-lg font-bold text-white shadow-[0_0_0_6px_rgba(245,158,11,0.08),0_18px_34px_-24px_rgba(245,158,11,0.9)]">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={hero.displayName}
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            avatarLabel
          )}
          <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/18" />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold tracking-tight text-[var(--mc-text)] sm:text-2xl">
            {hero.displayName}
          </h2>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        {stats.map((stat) => (
          <div key={stat.label} className={quickCardClass}>
            <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
              {stat.label}
            </div>
            <div className="mt-1 text-xl font-semibold text-[var(--mc-text)]">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default CareerTopOverviewStrip;
