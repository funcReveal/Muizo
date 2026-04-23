import React from "react";

import type {
  CareerCollectionRankRow,
  CareerCollectionRankSortKey,
  CareerCollectionRankSortOrder,
} from "../../types/career";
import CareerCollectionRanksToolbar from "./collectionRanks/CareerCollectionRanksToolbar";

interface CareerCollectionRanksTabProps {
  items: CareerCollectionRankRow[];
  sortKey: CareerCollectionRankSortKey;
  sortOrder: CareerCollectionRankSortOrder;
  setSortKey: (value: CareerCollectionRankSortKey) => void;
  setSortOrder: (value: CareerCollectionRankSortOrder) => void;
  isLoading: boolean;
  error: string | null;
}

const cardClass =
  "rounded-[24px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(20,17,13,0.96),rgba(8,7,5,0.98))] p-5 shadow-[0_18px_38px_-28px_rgba(0,0,0,0.72)]";

const formatDelta = (delta: number | null) => {
  if (delta === null || !Number.isFinite(delta)) return "—";
  if (delta > 0) return `↑ +${delta}`;
  if (delta < 0) return `↓ ${delta}`;
  return "→ 0";
};

const deltaClassName = (delta: number | null) => {
  if (delta === null || !Number.isFinite(delta)) return "text-slate-300";
  if (delta > 0) return "text-emerald-300";
  if (delta < 0) return "text-rose-300";
  return "text-slate-300";
};

const formatRank = (rank: number | null) => {
  if (rank === null || !Number.isFinite(rank)) return "-";
  return `#${rank}`;
};

const formatScore = (score: number | null) => {
  if (score === null || !Number.isFinite(score)) return "-";
  return Math.floor(score).toLocaleString("zh-TW");
};

const CareerCollectionRanksTab: React.FC<CareerCollectionRanksTabProps> = ({
  items,
  sortKey,
  sortOrder,
  setSortKey,
  setSortOrder,
  isLoading,
  error,
}) => {
  return (
    <div className="mt-5 space-y-4">
      <section className={cardClass}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--mc-text)]">
              題庫戰績
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--mc-text-muted)]">
              這裡專門看你在各題庫的表現。重點不是只有榜單名次，還要能看出最近排名有沒有上升或下降。
            </p>
          </div>

          <div className="inline-flex items-center rounded-full border border-sky-300/28 bg-sky-300/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.12em] text-sky-100">
            COLLECTION RANKS
          </div>
        </div>
      </section>

      <CareerCollectionRanksToolbar
        sortKey={sortKey}
        sortOrder={sortOrder}
        setSortKey={setSortKey}
        setSortOrder={setSortOrder}
      />

      <section className="overflow-hidden rounded-[24px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(20,17,13,0.96),rgba(8,7,5,0.98))] shadow-[0_18px_38px_-28px_rgba(0,0,0,0.72)]">
        <div className="hidden grid-cols-[minmax(0,2fr)_110px_110px_110px_120px_100px_120px] gap-3 border-b border-[var(--mc-border)] px-5 py-4 text-xs font-semibold tracking-[0.12em] text-[var(--mc-text-muted)] lg:grid">
          <div>題庫</div>
          <div>榜單名次</div>
          <div>前期名次</div>
          <div>Δ 變動</div>
          <div>最佳分數</div>
          <div>場次</div>
          <div>最近遊玩</div>
        </div>

        {isLoading ? (
          <div className="px-5 py-8 text-sm text-[var(--mc-text-muted)]">
            載入題庫戰績中...
          </div>
        ) : error ? (
          <div className="px-5 py-8 text-sm text-rose-300">{error}</div>
        ) : items.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[var(--mc-text-muted)]">
            尚無足夠題庫排名資料。
          </div>
        ) : (
          <>
            <div className="hidden divide-y divide-[var(--mc-border)] lg:block">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(0,2fr)_110px_110px_110px_120px_100px_120px] gap-3 px-5 py-4 text-sm"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-[var(--mc-text)]">
                      {item.title}
                    </div>
                  </div>
                  <div className="font-semibold text-[var(--mc-text)]">
                    {formatRank(item.leaderboardRank)}
                  </div>
                  <div className="font-semibold text-[var(--mc-text)]">
                    {formatRank(item.previousLeaderboardRank)}
                  </div>
                  <div
                    className={`font-semibold ${deltaClassName(item.delta)}`}
                  >
                    {formatDelta(item.delta)}
                  </div>
                  <div className="font-semibold text-[var(--mc-text)]">
                    {formatScore(item.bestScore)}
                  </div>
                  <div className="text-[var(--mc-text-muted)]">
                    {item.playCount.toLocaleString("zh-TW")}
                  </div>
                  <div className="text-[var(--mc-text-muted)]">
                    {item.lastPlayedAt ?? "-"}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3 p-4 lg:hidden">
              {items.map((item) => (
                <div
                  key={`${item.id}-mobile`}
                  className="rounded-[20px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.55)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[var(--mc-text)]">
                        {item.title}
                      </div>
                      <div className="mt-1 text-xs text-[var(--mc-text-muted)]">
                        最近遊玩 {item.lastPlayedAt ?? "-"}
                      </div>
                    </div>
                    <div
                      className={`text-sm font-semibold ${deltaClassName(item.delta)}`}
                    >
                      {formatDelta(item.delta)}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-[16px] border border-[var(--mc-border)] bg-[rgba(255,255,255,0.02)] p-3">
                      <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                        榜單名次
                      </div>
                      <div className="mt-1 font-semibold text-[var(--mc-text)]">
                        {formatRank(item.leaderboardRank)}
                      </div>
                    </div>

                    <div className="rounded-[16px] border border-[var(--mc-border)] bg-[rgba(255,255,255,0.02)] p-3">
                      <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                        前期名次
                      </div>
                      <div className="mt-1 font-semibold text-[var(--mc-text)]">
                        {formatRank(item.previousLeaderboardRank)}
                      </div>
                    </div>

                    <div className="rounded-[16px] border border-[var(--mc-border)] bg-[rgba(255,255,255,0.02)] p-3">
                      <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                        最佳分數
                      </div>
                      <div className="mt-1 font-semibold text-[var(--mc-text)]">
                        {formatScore(item.bestScore)}
                      </div>
                    </div>

                    <div className="rounded-[16px] border border-[var(--mc-border)] bg-[rgba(255,255,255,0.02)] p-3">
                      <div className="text-[11px] tracking-[0.12em] text-[var(--mc-text-muted)]">
                        遊玩場次
                      </div>
                      <div className="mt-1 font-semibold text-[var(--mc-text)]">
                        {item.playCount.toLocaleString("zh-TW")}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default CareerCollectionRanksTab;
