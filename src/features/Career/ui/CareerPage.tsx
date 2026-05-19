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
      <div className="rounded-[26px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(20,17,13,0.94),rgba(8,7,5,0.98))] p-4">
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

      <div className="h-[64px] animate-pulse rounded-[22px] border border-[var(--mc-border)] bg-white/[0.04]" />
      <div className="grid gap-3 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="h-[360px] animate-pulse rounded-[24px] border border-white/8 bg-white/[0.045]" />
        <div className="h-[360px] animate-pulse rounded-[24px] border border-white/8 bg-white/[0.045]" />
      </div>
    </div>
  );
};

const CareerPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<CareerTabKey>("overview");
  const [tabsDocked, setTabsDocked] = useState(false);
  const tabsSentinelRef = React.useRef<HTMLDivElement | null>(null);
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

  React.useEffect(() => {
    const sentinel = tabsSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setTabsDocked(!entry.isIntersecting);
      },
      {
        rootMargin: "-1px 0px 0px 0px",
        threshold: 0,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <main className="flex h-full min-h-0 w-full min-w-0 flex-1 flex-col px-1 pb-8 sm:px-0 xl:overflow-hidden">
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

          <div ref={tabsSentinelRef} className="h-px" aria-hidden="true" />

          <div
            className={`sticky top-0 z-20 -mx-1 mt-2 px-1 transition-[background-color,box-shadow,padding,backdrop-filter] duration-200 sm:mx-0 sm:px-0 ${
              tabsDocked
                ? "bg-[linear-gradient(180deg,rgba(0,0,0,0.96),rgba(0,0,0,0.82))] py-3 shadow-[0_18px_36px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl"
                : "bg-transparent py-1 shadow-none"
            }`}
          >
            <CareerTabs activeTab={activeTab} onChange={setActiveTab} />
          </div>

          <section
            className="mt-3 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            aria-live="polite"
          >
            {activeTab === "overview" && (
              <CareerOverviewTab
                composite={overviewQuery.data.composite}
                compositeScopes={overviewQuery.data.compositeScopes}
                highlights={overviewQuery.data.highlights}
                collectionShortcuts={overviewQuery.data.collectionShortcuts}
                scopeContent={overviewQuery.data.scopeContent}
                onOpenCollectionRanks={() => setActiveTab("collectionRanks")}
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
