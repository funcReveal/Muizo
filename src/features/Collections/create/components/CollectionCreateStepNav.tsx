import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { CollectionCreateStep } from "../hooks/useCollectionCreateReadiness";

type Props = {
  currentStep: CollectionCreateStep;
  onStepChange: (step: CollectionCreateStep) => void;
  canOpenReview: boolean;
  canOpenPublish: boolean;
};

type StepItem = {
  key: CollectionCreateStep;
  index: number;
  title: string;
  mobileTitle: string;
  description: string;
  disabled: boolean;
};

export default function CollectionCreateStepNav({
  currentStep,
  onStepChange,
  canOpenReview,
  canOpenPublish,
}: Props) {
  const { t } = useTranslation("collectionCreate");

  const steps = useMemo<StepItem[]>(
    () => [
      {
        key: "source",
        index: 1,
        title: t("steps.source.title", { defaultValue: "匯入來源" }),
        mobileTitle: t("steps.source.mobileTitle", {
          defaultValue: "匯入",
        }),
        description: t("steps.source.description", {
          defaultValue: "貼上 YouTube 播放清單，或從帳號清單匯入。",
        }),
        disabled: false,
      },
      {
        key: "review",
        index: 2,
        title: t("steps.review.title", { defaultValue: "檢查內容" }),
        mobileTitle: t("steps.review.mobileTitle", {
          defaultValue: "檢查",
        }),
        description: t("steps.review.description", {
          defaultValue: "確認曲目、重複項目、超長曲目與匯入狀態。",
        }),
        disabled: !canOpenReview,
      },
      {
        key: "publish",
        index: 3,
        title: t("steps.publish.title", { defaultValue: "發布設定" }),
        mobileTitle: t("steps.publish.mobileTitle", {
          defaultValue: "發布",
        }),
        description: t("steps.publish.description", {
          defaultValue: "設定標題、描述與公開狀態後建立收藏庫。",
        }),
        disabled: !canOpenPublish,
      },
    ],
    [canOpenPublish, canOpenReview, t],
  );

  const currentIndex =
    steps.find((step) => step.key === currentStep)?.index ?? 1;

  return (
    <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/55 p-2 sm:p-3">
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {steps.map((step) => {
          const isActive = step.key === currentStep;
          const isDone = step.index < currentIndex;

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => {
                if (step.disabled) return;
                onStepChange(step.key);
              }}
              disabled={step.disabled}
              aria-current={isActive ? "step" : undefined}
              className={[
                "group min-w-0 rounded-xl border px-1.5 py-2 text-center transition sm:px-3 sm:py-3 sm:text-left",
                "disabled:cursor-not-allowed disabled:opacity-50",
                isActive
                  ? "border-cyan-300/35 bg-cyan-300/12 shadow-[0_14px_40px_rgba(34,211,238,0.12)]"
                  : isDone
                    ? "border-emerald-300/25 bg-emerald-300/8 hover:border-emerald-300/35"
                    : "border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/35 hover:border-cyan-300/25 hover:bg-[var(--mc-surface-strong)]/50",
              ].join(" ")}
            >
              <div className="flex min-w-0 flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
                <div
                  className={[
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold sm:h-7 sm:w-7 sm:text-xs",
                    isActive
                      ? "border-cyan-200/50 bg-cyan-200/20 text-cyan-100"
                      : isDone
                        ? "border-emerald-200/40 bg-emerald-200/15 text-emerald-100"
                        : "border-[var(--mc-border)] bg-black/15 text-[var(--mc-text-muted)]",
                  ].join(" ")}
                >
                  {isDone ? "✓" : step.index}
                </div>

                <div className="min-w-0">
                  <div
                    className={[
                      "truncate text-[11px] font-semibold leading-4 sm:text-sm",
                      isActive
                        ? "text-[var(--mc-text)]"
                        : "text-[var(--mc-text-muted)] group-hover:text-[var(--mc-text)]",
                    ].join(" ")}
                  >
                    <span className="sm:hidden">{step.mobileTitle}</span>
                    <span className="hidden sm:inline">{step.title}</span>
                  </div>
                </div>
              </div>

              <div className="mt-2 hidden overflow-hidden text-[11px] leading-4 text-[var(--mc-text-muted)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] sm:block">
                {step.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
