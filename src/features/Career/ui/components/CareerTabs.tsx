import React from "react";

export type CareerTabKey = "overview" | "collectionRanks" | "history" | "share";

interface CareerTabsProps {
  activeTab: CareerTabKey;
  onChange: (tab: CareerTabKey) => void;
}

const tabs: Array<{
  key: CareerTabKey;
  label: string;
  shortLabel: string;
}> = [
  {
    key: "overview",
    label: "總覽",
    shortLabel: "總覽",
  },
  {
    key: "collectionRanks",
    label: "題庫戰績",
    shortLabel: "題庫",
  },
  {
    key: "history",
    label: "對戰歷史",
    shortLabel: "歷史",
  },
  {
    key: "share",
    label: "分享",
    shortLabel: "分享",
  },
];

const CareerTabs: React.FC<CareerTabsProps> = ({ activeTab, onChange }) => {
  return (
    <nav className="rounded-[22px] border border-cyan-100/12 bg-[linear-gradient(180deg,rgba(8,15,28,0.9),rgba(2,6,23,0.96))] p-1.5 shadow-[0_16px_36px_-30px_rgba(34,211,238,0.5)] backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-1.5">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              aria-pressed={active}
              className={`relative min-w-0 rounded-[16px] border px-2 py-2 text-center transition sm:px-3 ${
                active
                  ? "border-sky-300/40 bg-sky-300/12 text-sky-50"
                  : "border-transparent text-[var(--mc-text-muted)] hover:border-cyan-300/18 hover:bg-cyan-300/8 hover:text-[var(--mc-text)]"
              }`}
            >
              <div className="truncate text-xs font-semibold sm:hidden">
                {tab.shortLabel}
              </div>

              <div className="hidden truncate text-sm font-semibold sm:block">
                {tab.label}
              </div>

              <div
                className={`mx-auto mt-1.5 h-0.5 rounded-full transition ${
                  active ? "w-8 bg-cyan-200" : "w-0 bg-transparent"
                }`}
              />
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default CareerTabs;
