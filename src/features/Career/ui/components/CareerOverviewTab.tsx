import React from "react";

export interface CareerOverviewHeroStats {
  displayName: string;
  descriptor: string;
  totalMatches: string;
  totalScore: string;
  bestScore: string;
  bestRank: string;
  playTime: string;
  bestCombo: string;
}

export interface CareerCompositeStats {
  averageRank: string;
  averageScore: string;
  top3Rate: string;
  firstPlaceCount: string;
  averageAccuracy: string;
  trendLabels: string[];
  trendValues: number[];
}

export interface CareerWeeklyStats {
  matches: string;
  matchesDelta: string;
  score: string;
  scoreDelta: string;
  accuracy: string;
  accuracyDelta: string;
}

export interface CareerHighlightItem {
  label: string;
  value: string;
  subtitle: string;
  accentClass: string;
}

export interface CareerCollectionRankShortcutItem {
  title: string;
  currentRank: string;
  delta: number;
}

interface CareerOverviewTabProps {
  hero: CareerOverviewHeroStats;
  composite: CareerCompositeStats;
  weekly: CareerWeeklyStats;
  highlights: CareerHighlightItem[];
  collectionShortcuts: CareerCollectionRankShortcutItem[];
  onOpenCollectionRanks: () => void;
  onOpenShare: () => void;
}

const cardClass =
  "rounded-[24px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(20,17,13,0.96),rgba(8,7,5,0.98))] p-5 shadow-[0_18px_38px_-28px_rgba(0,0,0,0.72)]";

const formatDelta = (delta: number) => {
  if (delta > 0) return `↑ +${delta}`;
  if (delta < 0) return `↓ ${delta}`;
  return "→ 0";
};

const deltaClassName = (delta: number) => {
  if (delta > 0) return "text-emerald-300";
  if (delta < 0) return "text-rose-300";
  return "text-slate-300";
};

const CareerOverviewTab: React.FC<CareerOverviewTabProps> = ({
  hero,
  composite,
  weekly,
  highlights,
  collectionShortcuts,
  onOpenCollectionRanks,
  onOpenShare,
}) => {
  const maxTrend = Math.max(...composite.trendValues, 1);

  return (
    <div className="mt-5 space-y-4">
      <section className={`${cardClass} overflow-hidden`}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-stretch xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-sky-300/40 bg-[radial-gradient(circle_at_30%_30%,rgba(61,160,255,0.9),rgba(18,49,91,1))] text-2xl font-bold text-white shadow-[0_0_0_6px_rgba(14,165,233,0.08)]">
                ZY
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-3xl font-semibold tracking-tight text-[var(--mc-text)] sm:text-4xl">
                  {hero.displayName}
                </h2>
                <div className="mt-2 text-base font-semibold text-sky-300">
                  {hero.descriptor}
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--mc-text-muted)]">
                  先聚焦你的整體表現與近期狀態，再延伸到題庫排名與分享。
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <div className="rounded-full border border-sky-300/32 bg-sky-300/10 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-sky-100">
                綜合表現可視化
              </div>
              <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-emerald-100">
                本週持續成長中
              </div>
              <div className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-amber-100">
                題庫戰績支援 Δ 變動
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:w-[560px]">
            <div className="rounded-[22px] border border-sky-300/18 bg-[rgba(10,20,34,0.72)] p-4">
              <div className="text-xs tracking-[0.12em] text-[var(--mc-text-muted)]">
                總場次
              </div>
              <div className="mt-2 text-3xl font-semibold text-[var(--mc-text)]">
                {hero.totalMatches}
              </div>
            </div>
            <div className="rounded-[22px] border border-sky-300/18 bg-[rgba(10,20,34,0.72)] p-4">
              <div className="text-xs tracking-[0.12em] text-[var(--mc-text-muted)]">
                總分數
              </div>
              <div className="mt-2 text-3xl font-semibold text-[var(--mc-text)]">
                {hero.totalScore}
              </div>
            </div>
            <div className="rounded-[22px] border border-sky-300/18 bg-[rgba(10,20,34,0.72)] p-4">
              <div className="text-xs tracking-[0.12em] text-[var(--mc-text-muted)]">
                最高分
              </div>
              <div className="mt-2 text-3xl font-semibold text-[var(--mc-text)]">
                {hero.bestScore}
              </div>
            </div>
            <div className="rounded-[22px] border border-sky-300/18 bg-[rgba(10,20,34,0.72)] p-4">
              <div className="text-xs tracking-[0.12em] text-[var(--mc-text-muted)]">
                最佳名次
              </div>
              <div className="mt-2 text-3xl font-semibold text-[var(--mc-text)]">
                {hero.bestRank}
              </div>
            </div>
            <div className="rounded-[18px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] p-3">
              <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                遊玩時數
              </div>
              <div className="mt-1 text-lg font-semibold text-[var(--mc-text)]">
                {hero.playTime}
              </div>
            </div>
            <div className="rounded-[18px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] p-3">
              <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                最高 Combo
              </div>
              <div className="mt-1 text-lg font-semibold text-[var(--mc-text)]">
                {hero.bestCombo}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <section className={cardClass}>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold tracking-tight text-[var(--mc-text)]">
                綜合表現
              </h3>
              <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
                先看整體穩定度，再看單場高光。
              </p>
            </div>
            <div className="rounded-full border border-sky-300/24 bg-sky-300/10 px-3 py-1 text-[11px] font-semibold tracking-[0.12em] text-sky-100">
              OVERALL
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            <div className="rounded-[20px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] p-4">
              <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                平均名次
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--mc-text)]">
                {composite.averageRank}
              </div>
            </div>
            <div className="rounded-[20px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] p-4">
              <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                平均得分
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--mc-text)]">
                {composite.averageScore}
              </div>
            </div>
            <div className="rounded-[20px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] p-4">
              <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                Top 3 率
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--mc-text)]">
                {composite.top3Rate}
              </div>
            </div>
            <div className="rounded-[20px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] p-4">
              <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                第一名次數
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--mc-text)]">
                {composite.firstPlaceCount}
              </div>
            </div>
            <div className="rounded-[20px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] p-4">
              <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                平均答對率
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--mc-text)]">
                {composite.averageAccuracy}
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-[22px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--mc-text)]">
                近 7 場趨勢
              </div>
              <div className="text-xs text-[var(--mc-text-muted)]">
                越早看到趨勢，越有回訪動機
              </div>
            </div>

            <div className="flex h-[170px] items-end gap-3">
              {composite.trendValues.map((value, index) => {
                const height = Math.max(
                  18,
                  Math.round((value / maxTrend) * 120),
                );

                return (
                  <div
                    key={`${composite.trendLabels[index]}-${value}`}
                    className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"
                  >
                    <div className="text-[11px] text-slate-300">
                      {value.toLocaleString("zh-TW")}
                    </div>
                    <div className="flex h-[126px] items-end">
                      <div
                        className="w-8 rounded-t-xl bg-[linear-gradient(180deg,rgba(56,189,248,0.95),rgba(29,78,216,0.88))] shadow-[0_0_18px_rgba(14,165,233,0.28)]"
                        style={{ height }}
                      />
                    </div>
                    <div className="text-[11px] text-[var(--mc-text-muted)]">
                      {composite.trendLabels[index]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className={cardClass}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-[var(--mc-text)]">
                  本週進度
                </h3>
                <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
                  用 delta 告訴玩家自己最近是不是更強了。
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="rounded-[20px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] p-4">
                <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                  本週對戰
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div className="text-3xl font-semibold text-[var(--mc-text)]">
                    {weekly.matches}
                  </div>
                  <div className="text-sm font-semibold text-emerald-300">
                    {weekly.matchesDelta}
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] p-4">
                <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                  本週總分
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div className="text-3xl font-semibold text-[var(--mc-text)]">
                    {weekly.score}
                  </div>
                  <div className="text-sm font-semibold text-emerald-300">
                    {weekly.scoreDelta}
                  </div>
                </div>
              </div>

              <div className="rounded-[20px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] p-4">
                <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                  本週答對率
                </div>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <div className="text-3xl font-semibold text-[var(--mc-text)]">
                    {weekly.accuracy}
                  </div>
                  <div className="text-sm font-semibold text-emerald-300">
                    {weekly.accuracyDelta}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold tracking-tight text-[var(--mc-text)]">
                  題庫戰績捷徑
                </h3>
                <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
                  先看你在哪些題庫進步或退步最多。
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenCollectionRanks}
                className="rounded-full border border-sky-300/30 bg-sky-300/10 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-sky-100 transition hover:border-sky-300/45 hover:bg-sky-300/16"
              >
                查看全部
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {collectionShortcuts.length === 0 ? (
                <div className="rounded-[18px] border border-dashed border-[var(--mc-border)] px-4 py-5 text-sm text-[var(--mc-text-muted)]">
                  尚無足夠題庫資料
                </div>
              ) : (
                collectionShortcuts.map((item) => (
                  <div
                    key={`${item.title}-${item.currentRank}`}
                    className="flex items-center justify-between gap-4 rounded-[18px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--mc-text)]">
                        {item.title}
                      </div>
                      <div className="mt-1 text-xs text-[var(--mc-text-muted)]">
                        目前名次 {item.currentRank}
                      </div>
                    </div>
                    <div
                      className={`shrink-0 text-sm font-semibold ${deltaClassName(
                        item.delta,
                      )}`}
                    >
                      {formatDelta(item.delta)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      <section className={cardClass}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold tracking-tight text-[var(--mc-text)]">
              高光紀錄
            </h3>
            <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
              這一區只放值得炫耀的代表表現。
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenShare}
            className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold tracking-[0.12em] text-emerald-100 transition hover:border-emerald-300/45 hover:bg-emerald-300/16"
          >
            前往分享
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => (
            <div
              key={`${item.label}-${item.subtitle}`}
              className={`rounded-[20px] border p-4 ${item.accentClass}`}
            >
              <div className="text-xs tracking-[0.12em] text-slate-200/90">
                {item.label}
              </div>
              <div className="mt-3 text-3xl font-semibold text-white">
                {item.value}
              </div>
              <div className="mt-3 text-sm text-slate-200/80">
                {item.subtitle}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CareerOverviewTab;
