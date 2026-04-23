import { useMemo, useState } from "react";

import { mockCareerCollectionRankRows } from "../mocks/career.mock";
import type {
  CareerCollectionRankRow,
  CareerCollectionRanksQueryResult,
  CareerCollectionRankSortKey,
  CareerCollectionRankSortOrder,
} from "../types/career";

const normalizeNumber = (
  value: number | null | undefined,
  fallback: number,
) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return value;
};

const sortItems = (
  items: CareerCollectionRankRow[],
  sortKey: CareerCollectionRankSortKey,
  sortOrder: CareerCollectionRankSortOrder,
) => {
  const sorted = [...items].sort((a, b) => {
    switch (sortKey) {
      case "leaderboardRank": {
        const aValue = normalizeNumber(a.leaderboardRank, 999999);
        const bValue = normalizeNumber(b.leaderboardRank, 999999);
        return aValue - bValue;
      }
      case "delta": {
        const aValue = normalizeNumber(a.delta, -999999);
        const bValue = normalizeNumber(b.delta, -999999);
        return aValue - bValue;
      }
      case "playCount": {
        return a.playCount - b.playCount;
      }
      case "bestScore": {
        const aValue = normalizeNumber(a.bestScore, -1);
        const bValue = normalizeNumber(b.bestScore, -1);
        return aValue - bValue;
      }
      case "lastPlayedAt": {
        const aValue = a.lastPlayedAt ?? "";
        const bValue = b.lastPlayedAt ?? "";
        return aValue.localeCompare(bValue);
      }
      default:
        return 0;
    }
  });

  return sortOrder === "asc" ? sorted : sorted.reverse();
};

export const useCareerCollectionRanksData =
  (): CareerCollectionRanksQueryResult => {
    const [sortKey, setSortKey] =
      useState<CareerCollectionRankSortKey>("leaderboardRank");
    const [sortOrder, setSortOrder] =
      useState<CareerCollectionRankSortOrder>("asc");

    const items = useMemo(
      () => sortItems(mockCareerCollectionRankRows, sortKey, sortOrder),
      [sortKey, sortOrder],
    );

    return {
      items,
      sortKey,
      sortOrder,
      setSortKey,
      setSortOrder,
      isLoading: false,
      error: null,
    };
  };

export default useCareerCollectionRanksData;
