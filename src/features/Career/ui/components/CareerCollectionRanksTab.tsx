import React from "react";

import type {
  CareerCollectionRankRow,
  CareerCollectionRankSortKey,
  CareerCollectionRankSortOrder,
} from "../../types/career";
import CareerCollectionRanksMobileList from "./collectionRanks/CareerCollectionRanksMobileList";
import CareerCollectionRanksTable from "./collectionRanks/CareerCollectionRanksTable";
import CareerCollectionRanksToolbar from "./collectionRanks/CareerCollectionRanksToolbar";
import CareerStatePanel from "./primitives/CareerStatePanel";
import CareerWorkbenchShell from "./primitives/CareerWorkbenchShell";

interface CareerCollectionRanksTabProps {
  items: CareerCollectionRankRow[];
  sortKey: CareerCollectionRankSortKey;
  sortOrder: CareerCollectionRankSortOrder;
  setSortKey: (value: CareerCollectionRankSortKey) => void;
  setSortOrder: (value: CareerCollectionRankSortOrder) => void;
  isLoading: boolean;
  error: string | null;
}

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
    <div className="flex min-h-0 flex-1 flex-col">
      <CareerWorkbenchShell className="flex min-h-0 flex-1 flex-col overflow-visible p-0">
        <div className="sticky top-[84px] z-10 rounded-t-[24px] border-b border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(20,17,13,0.98),rgba(8,7,5,0.94))] p-3 shadow-[0_18px_34px_-28px_rgba(0,0,0,0.88)] backdrop-blur-xl">
          <CareerCollectionRanksToolbar
            sortKey={sortKey}
            sortOrder={sortOrder}
            setSortKey={setSortKey}
            setSortOrder={setSortOrder}
          />
        </div>

        <div className="min-h-0 flex-1 p-4">
          {isLoading ? (
            <CareerStatePanel>載入題庫戰績中...</CareerStatePanel>
          ) : error ? (
            <CareerStatePanel tone="danger">{error}</CareerStatePanel>
          ) : items.length === 0 ? (
            <CareerStatePanel>尚無足夠題庫排名資料。</CareerStatePanel>
          ) : (
            <>
              <CareerCollectionRanksTable items={items} />
              <CareerCollectionRanksMobileList items={items} />
            </>
          )}
        </div>
      </CareerWorkbenchShell>
    </div>
  );
};

export default CareerCollectionRanksTab;
