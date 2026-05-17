import React from "react";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";

import type {
  CareerCollectionRankSortKey,
  CareerCollectionRankSortOrder,
} from "../../../types/career";

interface CareerCollectionRanksToolbarProps {
  sortKey: CareerCollectionRankSortKey;
  sortOrder: CareerCollectionRankSortOrder;
  setSortKey: (value: CareerCollectionRankSortKey) => void;
  setSortOrder: (value: CareerCollectionRankSortOrder) => void;
}

const sortOptions: Array<{
  value: CareerCollectionRankSortKey;
  label: string;
}> = [
  { value: "leaderboardRank", label: "榜單名次" },
  { value: "delta", label: "Δ 排名變動" },
  { value: "bestScore", label: "最佳分數" },
  { value: "playCount", label: "遊玩場次" },
  { value: "lastPlayedAt", label: "最近遊玩" },
];

const CareerCollectionRanksToolbar: React.FC<
  CareerCollectionRanksToolbarProps
> = ({ sortKey, sortOrder, setSortKey, setSortOrder }) => {
  const nextSortOrder = sortOrder === "asc" ? "desc" : "asc";

  return (
    <div className="flex flex-col gap-3 rounded-[18px] border border-amber-300/14 bg-[linear-gradient(180deg,rgba(38,27,13,0.78),rgba(12,10,7,0.88))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <label
          htmlFor="career-collection-rank-sort"
          className="shrink-0 text-[11px] font-semibold tracking-[0.12em] text-amber-100/82"
        >
          排序
        </label>

        <select
          id="career-collection-rank-sort"
          value={sortKey}
          onChange={(event) =>
            setSortKey(event.target.value as CareerCollectionRankSortKey)
          }
          className="min-w-0 rounded-[14px] border border-[var(--mc-border)] bg-[rgba(8,7,5,0.92)] px-3 py-2 text-sm font-semibold text-[var(--mc-text)] outline-none transition hover:border-amber-300/32 focus:border-amber-300/48 focus:bg-[rgba(15,12,8,0.96)] sm:min-w-[180px]"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        title={sortOrder === "asc" ? "目前升冪，點擊切換降冪" : "目前降冪，點擊切換升冪"}
        aria-label={sortOrder === "asc" ? "切換為降冪" : "切換為升冪"}
        onClick={() => setSortOrder(nextSortOrder)}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border border-amber-300/24 bg-amber-300/12 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition hover:border-amber-300/46 hover:bg-amber-300/20 focus:outline-none focus:ring-2 focus:ring-amber-200/28"
      >
        {sortOrder === "asc" ? (
          <ArrowUpwardRoundedIcon sx={{ fontSize: 20 }} />
        ) : (
          <ArrowDownwardRoundedIcon sx={{ fontSize: 20 }} />
        )}
      </button>
    </div>
  );
};

export default CareerCollectionRanksToolbar;
