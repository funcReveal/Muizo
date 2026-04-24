import React from "react";

import type { CareerShareTemplate } from "../../../types/career";
import CareerActionButton from "../primitives/CareerActionButton";
import CareerSectionHeader from "../primitives/CareerSectionHeader";
import CareerWorkbenchShell from "../primitives/CareerWorkbenchShell";

interface CareerShareTemplateSectionProps {
  activeTemplate: CareerShareTemplate;
  setActiveTemplate: (value: CareerShareTemplate) => void;
  templates: Array<{
    key: CareerShareTemplate;
    label: string;
    description: string;
  }>;
}

const CareerShareTemplateSection: React.FC<CareerShareTemplateSectionProps> = ({
  activeTemplate,
  setActiveTemplate,
  templates,
}) => {
  const activeTemplateDescription =
    templates.find((item) => item.key === activeTemplate)?.description ?? "";

  return (
    <CareerWorkbenchShell className="p-4">
      <CareerSectionHeader
        title="分享"
        description="選擇你想輸出的分享樣式，預覽卡片與文案會跟著模板調整。"
        badge="SHARE V1"
        compact
      />

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {templates.map((template) => {
          const active = template.key === activeTemplate;

          return (
            <button
              key={template.key}
              type="button"
              onClick={() => setActiveTemplate(template.key)}
              className={[
                "rounded-[16px] border px-3 py-3 text-left transition",
                active
                  ? "border-sky-300/42 bg-sky-300/12 shadow-[0_14px_28px_-24px_rgba(14,165,233,0.7)]"
                  : "border-[var(--mc-border)] bg-[rgba(10,18,30,0.34)] hover:border-sky-300/24 hover:bg-sky-300/8",
              ].join(" ")}
            >
              <div
                className={[
                  "text-sm font-semibold tracking-[0.08em]",
                  active ? "text-sky-100" : "text-[var(--mc-text)]",
                ].join(" ")}
              >
                {template.label}
              </div>

              <div className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--mc-text-muted)]">
                {template.description}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-[14px] border border-[var(--mc-border)] bg-[rgba(10,18,30,0.32)] px-3 py-2">
        <div className="min-w-0 truncate text-xs text-[var(--mc-text-muted)]">
          目前模板：{activeTemplateDescription}
        </div>

        <CareerActionButton
          tone="secondary"
          onClick={() => setActiveTemplate("career")}
          disabled={activeTemplate === "career"}
        >
          重設
        </CareerActionButton>
      </div>
    </CareerWorkbenchShell>
  );
};

export default CareerShareTemplateSection;
