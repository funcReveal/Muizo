import React, { useMemo, useState } from "react";

import { useAuth } from "@shared/auth/AuthContext";

import useCareerCollectionRanksData from "../model/useCareerCollectionRanksData";
import useCareerOverviewData from "../model/useCareerOverviewData";
import useCareerShareData from "../model/useCareerShareData";
import CareerCollectionRanksTab from "./components/CareerCollectionRanksTab";
import CareerHistoryWorkspace from "./components/CareerHistoryWorkspace";
import CareerOverviewTab from "./components/CareerOverviewTab";
import CareerShareTab from "./components/CareerShareTab";
import CareerTabs, { type CareerTabKey } from "./components/CareerTabs";
import CareerTopOverviewStrip from "./components/CareerTopOverviewStrip";
import CareerStatePanel from "./components/primitives/CareerStatePanel";

const CareerPageSkeleton: React.FC = () => {
  return (
    <div className="space-y-3">
      <div className="rounded-[26px] border border-cyan-100/12 bg-[linear-gradient(180deg,rgba(8,15,28,0.94),rgba(2,6,23,0.98))] p-4">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 animate-pulse rounded-2xl bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-5 w-40 animate-pulse rounded-full bg-white/12" />
            <div className="h-3 w-56 max-w-full animate-pulse rounded-full bg-white/8" />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-[72px] animate-pulse rounded-[16px] border border-white/8 bg-white/[0.045]"
            />
          ))}
        </div>
      </div>

      <div className="h-[64px] animate-pulse rounded-[22px] border border-cyan-100/12 bg-white/[0.04]" />
      <div className="grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="h-[360px] animate-pulse rounded-[24px] border border-white/8 bg-white/[0.045]" />
        <div className="h-[360px] animate-pulse rounded-[24px] border border-white/8 bg-white/[0.045]" />
      </div>
    </div>
  );
};

const CareerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CareerTabKey>("overview");
  const { authUser } = useAuth();

  const overviewQuery = useCareerOverviewData();
  const collectionRanksQuery = useCareerCollectionRanksData();
  const shareQuery = useCareerShareData(overviewQuery.data);

  const topLevelError = useMemo(() => {
    if (overviewQuery.error) return overviewQuery.error;
    if (activeTab === "collectionRanks") return collectionRanksQuery.error;
    if (activeTab === "share") return shareQuery.error;
    return null;
  }, [
    activeTab,
    collectionRanksQuery.error,
    overviewQuery.error,
    shareQuery.error,
  ]);

  const isInitialLoading = overviewQuery.isLoading && !overviewQuery.error;

  return (
    <main className="mx-auto flex w-full max-w-[1420px] min-w-0 flex-col px-1 pb-8 sm:px-0">
      {isInitialLoading ? (
        <CareerPageSkeleton />
      ) : (
        <>
          {topLevelError && (
            <CareerStatePanel tone="warning" className="mb-3">
              {topLevelError}
            </CareerStatePanel>
          )}

          <CareerTopOverviewStrip
            hero={overviewQuery.data.hero}
            avatarUrl={authUser?.avatar_url ?? null}
          />

          <div className="sticky top-2 z-20 mt-3">
            <CareerTabs activeTab={activeTab} onChange={setActiveTab} />
          </div>

          <section className="mt-3 min-w-0" aria-live="polite">
            {activeTab === "overview" && (
              <CareerOverviewTab
                composite={overviewQuery.data.composite}
                weekly={overviewQuery.data.weekly}
                highlights={overviewQuery.data.highlights}
                collectionShortcuts={overviewQuery.data.collectionShortcuts}
                onOpenCollectionRanks={() => setActiveTab("collectionRanks")}
                onOpenShare={() => setActiveTab("share")}
              />
            )}

            {activeTab === "collectionRanks" && (
              <CareerCollectionRanksTab
                items={collectionRanksQuery.items}
                sortKey={collectionRanksQuery.sortKey}
                sortOrder={collectionRanksQuery.sortOrder}
                setSortKey={collectionRanksQuery.setSortKey}
                setSortOrder={collectionRanksQuery.setSortOrder}
                isLoading={collectionRanksQuery.isLoading}
                error={collectionRanksQuery.error}
              />
            )}

            {activeTab === "history" && <CareerHistoryWorkspace />}

            {activeTab === "share" && (
              <CareerShareTab
                activeTemplate={shareQuery.activeTemplate}
                setActiveTemplate={shareQuery.setActiveTemplate}
                templates={shareQuery.templates}
                preview={shareQuery.preview}
                caption={shareQuery.caption}
                isLoading={shareQuery.isLoading}
                error={shareQuery.error}
              />
            )}
          </section>
        </>
      )}
    </main>
  );
};

export default CareerPage;
