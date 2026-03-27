import React from "react";

import type {
  SettingsSectionMeta,
  SettingsSectionId,
} from "../../model/settingsTypes";

type SettingsSectionAnchorListProps = {
  sections: SettingsSectionMeta[];
  activeAnchorId: SettingsSectionId | null;
  onAnchorClick: (sectionId: SettingsSectionId) => void;
  compact?: boolean;
};

const SettingsSectionAnchorList: React.FC<SettingsSectionAnchorListProps> = ({
  sections,
  activeAnchorId,
  onAnchorClick,
  compact = false,
}) => {
  if (sections.length === 0) return null;

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "space-y-1"}>
      {sections.map((section) => {
        const active = section.id === activeAnchorId;
        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onAnchorClick(section.id)}
            className={
              compact
                ? `group inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-left text-[11px] transition ${
                    active
                      ? "border-cyan-300/35 bg-cyan-400/12 text-cyan-50"
                      : "border-slate-700/60 bg-slate-950/35 text-slate-300 hover:border-slate-500/70"
                  }`
                : `group flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
                    active
                      ? "border-cyan-300/35 bg-cyan-400/10"
                      : "border-slate-700/60 bg-slate-950/35 hover:border-slate-500/70"
                  }`
            }
          >
            <span className={compact ? "truncate font-semibold" : "min-w-0"}>
              <span
                className={`block truncate ${
                  compact
                    ? "text-[11px] font-semibold"
                    : "text-sm font-semibold text-slate-100"
                }`}
              >
                {section.title}
              </span>
              {!compact ? (
                <span className="block truncate text-[11px] text-slate-400">
                  {section.status === "ready" ? "可調整" : "規劃中"}
                </span>
              ) : null}
            </span>
            {!compact ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-[0.12em] ${
                  section.status === "ready"
                    ? "border border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                    : "border border-amber-300/25 bg-amber-400/10 text-amber-100"
                }`}
              >
                {section.status === "ready" ? "READY" : "PLAN"}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
};

export default SettingsSectionAnchorList;
