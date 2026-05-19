import React from "react";

import type {
  CareerCollectionRankShortcutItem,
  CareerCompositeScope,
  CareerCompositeStats,
  CareerHighlightItem,
  CareerOverviewScopeContent,
} from "../../types/career";
import CareerCollectionShortcutsSection from "./overview/CareerCollectionShortcutsSection";
import CareerCompositeSection from "./overview/CareerCompositeSection";

interface CareerOverviewTabProps {
  composite: CareerCompositeStats;
  compositeScopes: CareerCompositeScope[];
  highlights: CareerHighlightItem[];
  collectionShortcuts: CareerCollectionRankShortcutItem[];
  scopeContent: CareerOverviewScopeContent[];
  onOpenCollectionRanks: () => void;
}

const CareerOverviewTab: React.FC<CareerOverviewTabProps> = ({
  composite,
  compositeScopes,
  highlights,
  collectionShortcuts,
  scopeContent,
  onOpenCollectionRanks,
}) => {
  const fallbackScopeKey = compositeScopes[0]?.key ?? "overall";
  const [activeScopeKey, setActiveScopeKey] = React.useState(fallbackScopeKey);

  React.useEffect(() => {
    if (compositeScopes.some((scope) => scope.key === activeScopeKey)) return;
    setActiveScopeKey(fallbackScopeKey);
  }, [activeScopeKey, compositeScopes, fallbackScopeKey]);

  const activeScope =
    compositeScopes.find((scope) => scope.key === activeScopeKey) ??
    compositeScopes[0];
  const activeScopeContent = scopeContent.find(
    (content) => content.scopeKey === activeScope?.key,
  );
  const activeHighlights =
    activeScopeContent?.highlights ??
    (activeScope?.key === fallbackScopeKey ? highlights : []);
  const activeCollectionShortcuts =
    activeScopeContent?.collectionShortcuts ??
    (activeScope?.key === fallbackScopeKey ? collectionShortcuts : []);

  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      <div className="grid h-full min-h-0 flex-1 items-stretch gap-4 overflow-hidden xl:grid-cols-[1.28fr_0.72fr]">
        <div className="h-full min-h-0 overflow-hidden">
          <CareerCompositeSection
            composite={composite}
            compositeScopes={compositeScopes}
            activeScopeKey={activeScopeKey}
            onActiveScopeChange={setActiveScopeKey}
            highlights={activeHighlights}
          />
        </div>

        <div className="grid h-full min-h-0 overflow-hidden">
          <CareerCollectionShortcutsSection
            items={activeCollectionShortcuts}
            activeScopeKind={activeScope?.kind ?? "casual"}
            onOpenCollectionRanks={onOpenCollectionRanks}
          />
        </div>
      </div>
    </div>
  );
};

export default CareerOverviewTab;
