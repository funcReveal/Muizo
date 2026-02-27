import React from "react";

import type {
  SettingsSectionMeta,
  SettingsSectionId,
} from "../../model/settingsTypes";

type SettingsSectionAnchorListProps = {
  sections: SettingsSectionMeta[];
  activeAnchorId: SettingsSectionId | null;
  onAnchorClick: (sectionId: SettingsSectionId) => void;
};

const SettingsSectionAnchorList: React.FC<SettingsSectionAnchorListProps> = ({
  sections,
  activeAnchorId,
  onAnchorClick,
}) => {
  if (sections.length === 0) return null;

  return (
    <div className="space-y-1">
      {sections.map((section) => {
        const active = section.id === activeAnchorId;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onAnchorClick(section.id)}
            className={`group flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
              active
                ? "border-cyan-300/35 bg-cyan-400/10"
                : "border-slate-700/60 bg-slate-950/35 hover:border-slate-500/70"
            }`}
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-100">
                {section.title}
              </span>
              <span className="block truncate text-[11px] text-slate-400">
                {section.status === "ready" ? "可調整" : "規劃中"}
              </span>
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] ${
                section.status === "ready"
                  ? "border border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                  : "border border-amber-300/25 bg-amber-400/10 text-amber-100"
              }`}
            >
              {section.status === "ready" ? "READY" : "PLAN"}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default SettingsSectionAnchorList;
