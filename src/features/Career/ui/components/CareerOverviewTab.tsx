import React from "react";

import type {
  CareerCollectionRankShortcutItem,
  CareerCompositeScope,
  CareerCompositeStats,
  CareerHighlightItem,
} from "../../types/career";
import CareerCollectionShortcutsSection from "./overview/CareerCollectionShortcutsSection";
import CareerCompositeSection from "./overview/CareerCompositeSection";

interface CareerOverviewTabProps {
  composite: CareerCompositeStats;
  compositeScopes: CareerCompositeScope[];
  highlights: CareerHighlightItem[];
  collectionShortcuts: CareerCollectionRankShortcutItem[];
  onOpenCollectionRanks: () => void;
  onOpenShare: () => void;
}

const CareerOverviewTab: React.FC<CareerOverviewTabProps> = ({
  composite,
  compositeScopes,
  highlights,
  collectionShortcuts,
  onOpenCollectionRanks,
  onOpenShare,
}) => {
  return (
    <div className="flex min-h-0 flex-1">
      <div className="grid min-h-0 flex-1 items-stretch gap-4 xl:grid-cols-[1.28fr_0.72fr]">
        <div className="min-h-0">
          <CareerCompositeSection
            composite={composite}
            compositeScopes={compositeScopes}
            highlights={highlights}
            onOpenShare={onOpenShare}
          />
        </div>

        <div className="grid min-h-0 gap-4">
          <CareerCollectionShortcutsSection
            items={collectionShortcuts}
            onOpenCollectionRanks={onOpenCollectionRanks}
          />
        </div>
      </div>
    </div>
  );
};

export default CareerOverviewTab;
