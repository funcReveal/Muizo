import React from "react";

export type CareerTabKey = "overview" | "collectionRanks" | "history" | "share";

interface CareerTabsProps {
  activeTab: CareerTabKey;
  onChange: (tab: CareerTabKey) => void;
}

const tabs: Array<{
  key: CareerTabKey;
  label: string;
  description: string;
}> = [
  {
    key: "overview",
    label: "總覽",
    description: "綜合表現、本週進度、高光紀錄",
  },
  {
    key: "collectionRanks",
    label: "題庫戰績",
    description: "題庫 + 名次 + Δ 排名變動",
  },
  {
    key: "history",
    label: "對戰歷史",
    description: "完整對戰紀錄與回顧",
  },
  {
    key: "share",
    label: "分享",
    description: "分享卡、文案、輸出",
  },
];

const CareerTabs: React.FC<CareerTabsProps> = ({ activeTab, onChange }) => {
  return (
    <div className="mt-4 rounded-[24px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(18,16,13,0.94),rgba(8,7,5,0.98))] p-2 shadow-[0_18px_38px_-28px_rgba(0,0,0,0.72)]">
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              aria-pressed={active}
              className={`rounded-[18px] border px-3 py-3 text-left transition sm:px-4 sm:py-3.5 ${
                active
                  ? "border-sky-300/42 bg-[linear-gradient(180deg,rgba(20,78,126,0.34),rgba(8,31,52,0.9))] shadow-[0_12px_28px_-20px_rgba(14,165,233,0.55)]"
                  : "border-transparent bg-transparent hover:border-sky-300/20 hover:bg-sky-300/8"
              }`}
            >
              <div className="text-sm font-semibold tracking-[0.08em] text-[var(--mc-text)] sm:text-base">
                {tab.label}
              </div>
              <div className="mt-1 text-[11px] leading-5 text-[var(--mc-text-muted)] sm:text-xs">
                {tab.description}
              </div>
              {active && (
                <div className="mt-3 h-1 w-full rounded-full bg-sky-300/90" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CareerTabs;
