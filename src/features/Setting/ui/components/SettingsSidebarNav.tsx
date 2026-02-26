import React from "react";

import type {
  SettingsCategoryId,
  SettingsCategoryMeta,
  SettingsSectionId,
  SettingsSectionMeta,
} from "../../model/settingsTypes";
import SettingsSectionAnchorList from "./SettingsSectionAnchorList";

type SettingsSidebarNavProps = {
  categories: SettingsCategoryMeta[];
  activeCategoryId: SettingsCategoryId;
  onCategoryChange: (categoryId: SettingsCategoryId) => void;
  activeAnchorId: SettingsSectionId | null;
  categorySections: SettingsSectionMeta[];
  onAnchorClick: (sectionId: SettingsSectionId) => void;
};

const cardClassName =
  "rounded-2xl border border-slate-700/70 bg-[linear-gradient(180deg,rgba(8,12,20,0.96),rgba(6,10,16,0.92))] p-3 shadow-[0_18px_48px_-38px_rgba(2,6,23,0.95)]";

const SettingsSidebarNav: React.FC<SettingsSidebarNavProps> = ({
  categories,
  activeCategoryId,
  onCategoryChange,
  activeAnchorId,
  categorySections,
  onAnchorClick,
}) => {
  return (
    <aside className="flex h-full min-h-0 flex-col gap-4">
      <section className={cardClassName}>
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
          分類
        </p>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
          {categories.map((category) => {
            const active = category.id === activeCategoryId;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onCategoryChange(category.id)}
                className={`rounded-xl border px-3 py-3 text-left transition ${
                  active
                    ? "border-cyan-300/35 bg-cyan-400/10 shadow-[0_0_0_1px_rgba(34,211,238,0.08)]"
                    : "border-slate-700/60 bg-slate-950/35 hover:border-slate-500/70"
                }`}
              >
                <span className="block text-sm font-bold text-slate-100">
                  {category.title}
                </span>
                <span className="mt-1 block text-xs leading-4 text-slate-400">
                  {category.subtitle}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`${cardClassName} min-h-0 xl:flex xl:flex-1 xl:flex-col`}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">
            區段索引
          </p>
          <span className="rounded-full border border-slate-700/60 bg-slate-900/60 px-2 py-0.5 text-[10px] font-bold text-slate-300">
            {categorySections.length}
          </span>
        </div>
        <div className="max-h-52 overflow-y-auto pr-1 sm:max-h-60 xl:max-h-none xl:flex-1 xl:min-h-0">
          <SettingsSectionAnchorList
            sections={categorySections}
            activeAnchorId={activeAnchorId}
            onAnchorClick={onAnchorClick}
          />
        </div>
      </section>
    </aside>
  );
};

export default SettingsSidebarNav;

