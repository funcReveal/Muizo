import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  totalImportedItems: number;
  selectedItems: number;
  removedItems: number;
  readyItems: number;
  longItems: number;
  removedDuplicateCount: number;
  skippedCount: number;
  isDraftOverflow: boolean;
  draftOverflowCount: number;
  collectionItemLimit: number | null;
  collectionsCount: number;
  privateCollectionsCount: number;
  remainingCollectionSlots: number;
  remainingPrivateCollectionSlots: number;
  maxCollectionsPerUser: number;
  maxPrivateCollectionsPerUser: number;
  reachedCollectionLimit: boolean;
  reachedPrivateCollectionLimit: boolean;
  isAdmin: boolean;
  visibility: "private" | "public";
  createError: string | null;
};

type SummaryItem = {
  label: string;
  value: string | number;
  tone?: "default" | "warning" | "danger" | "success";
};

const toneClassName: Record<NonNullable<SummaryItem["tone"]>, string> = {
  default:
    "border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/35 text-[var(--mc-text)]",
  warning: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  danger: "border-rose-300/25 bg-rose-300/10 text-rose-100",
  success: "border-emerald-300/25 bg-emerald-300/10 text-emerald-100",
};

function SummaryCard({ item }: { item: SummaryItem }) {
  const tone = item.tone ?? "default";

  return (
    <div
      className={`min-w-0 rounded-xl border px-3 py-2 ${toneClassName[tone]}`}
    >
      <div className="truncate text-[10px] leading-4 opacity-75 sm:text-[11px]">
        {item.label}
      </div>
      <div className="mt-0.5 truncate text-base font-semibold leading-6 sm:text-lg">
        {item.value}
      </div>
    </div>
  );
}

export default function CollectionCreateInspectorPanel({
  totalImportedItems,
  selectedItems,
  removedItems,
  readyItems,
  longItems,
  removedDuplicateCount,
  skippedCount,
  isDraftOverflow,
  draftOverflowCount,
  collectionItemLimit,
  collectionsCount,
  privateCollectionsCount,
  remainingCollectionSlots,
  remainingPrivateCollectionSlots,
  maxCollectionsPerUser,
  maxPrivateCollectionsPerUser,
  reachedCollectionLimit,
  reachedPrivateCollectionLimit,
  isAdmin,
  visibility,
  createError,
}: Props) {
  const { t } = useTranslation("collectionCreate");

  const itemLimitLabel =
    collectionItemLimit === null ? "∞" : collectionItemLimit;

  const primaryItems = useMemo<SummaryItem[]>(
    () => [
      {
        label: t("inspector.readyItems", { defaultValue: "可建立" }),
        value: readyItems,
        tone: isDraftOverflow
          ? "danger"
          : readyItems > 0
            ? "success"
            : "default",
      },
      {
        label: t("inspector.importedItems", { defaultValue: "已匯入" }),
        value: totalImportedItems,
      },
      {
        label: t("inspector.longItems", { defaultValue: "超長" }),
        value: longItems,
        tone: longItems > 0 ? "warning" : "default",
      },
      {
        label: t("inspector.skippedItems", { defaultValue: "略過" }),
        value: skippedCount,
        tone: skippedCount > 0 ? "warning" : "default",
      },
    ],
    [
      isDraftOverflow,
      longItems,
      readyItems,
      skippedCount,
      t,
      totalImportedItems,
    ],
  );

  const secondaryItems = useMemo<SummaryItem[]>(
    () => [
      {
        label: t("inspector.selectedItems", { defaultValue: "目前選入" }),
        value: selectedItems,
      },
      {
        label: t("inspector.removedItems", { defaultValue: "已移除" }),
        value: removedItems,
        tone: removedItems > 0 ? "warning" : "default",
      },
      {
        label: t("inspector.duplicates", { defaultValue: "重複移除" }),
        value: removedDuplicateCount,
        tone: removedDuplicateCount > 0 ? "warning" : "default",
      },
      {
        label: t("inspector.limit", { defaultValue: "上限" }),
        value: itemLimitLabel,
      },
    ],
    [itemLimitLabel, removedDuplicateCount, removedItems, selectedItems, t],
  );

  return (
    <aside className="min-w-0 rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/55 p-3 lg:sticky lg:top-4 lg:self-start">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[var(--mc-text)]">
            {t("inspector.title", { defaultValue: "摘要" })}
          </div>
          <div className="mt-0.5 hidden text-xs leading-5 text-[var(--mc-text-muted)] sm:block">
            {t("inspector.description", {
              defaultValue: "快速確認收藏庫目前狀態。",
            })}
          </div>
        </div>

        <div
          className={[
            "shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
            visibility === "public"
              ? "border-cyan-300/25 bg-cyan-300/10 text-cyan-100"
              : "border-slate-300/20 bg-slate-300/10 text-slate-200",
          ].join(" ")}
        >
          {visibility === "public"
            ? t("publish.visibility.public", { defaultValue: "公開" })
            : t("publish.visibility.private", { defaultValue: "私人" })}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-2 sm:gap-2">
        {primaryItems.map((item) => (
          <SummaryCard key={item.label} item={item} />
        ))}
      </div>

      <div className="mt-2 hidden grid-cols-2 gap-2 sm:grid">
        {secondaryItems.map((item) => (
          <SummaryCard key={item.label} item={item} />
        ))}
      </div>

      {!isAdmin && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/30 px-3 py-2">
            <div className="truncate text-[10px] text-[var(--mc-text-muted)] sm:text-[11px]">
              {t("inspector.collectionQuota", { defaultValue: "收藏庫" })}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-[var(--mc-text)]">
              {collectionsCount}/{maxCollectionsPerUser}
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--mc-text-muted)] sm:text-[11px]">
              {t("inspector.remaining", {
                count: remainingCollectionSlots,
                defaultValue: `剩 ${remainingCollectionSlots}`,
              })}
            </div>
          </div>

          <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/30 px-3 py-2">
            <div className="truncate text-[10px] text-[var(--mc-text-muted)] sm:text-[11px]">
              {t("inspector.privateQuota", { defaultValue: "私人" })}
            </div>
            <div className="mt-0.5 text-sm font-semibold text-[var(--mc-text)]">
              {privateCollectionsCount}/{maxPrivateCollectionsPerUser}
            </div>
            <div className="mt-0.5 text-[10px] text-[var(--mc-text-muted)] sm:text-[11px]">
              {t("inspector.remaining", {
                count: remainingPrivateCollectionSlots,
                defaultValue: `剩 ${remainingPrivateCollectionSlots}`,
              })}
            </div>
          </div>
        </div>
      )}

      {isDraftOverflow && (
        <div className="mt-3 rounded-xl border border-rose-300/25 bg-rose-300/10 px-3 py-2 text-xs leading-5 text-rose-100">
          {t("inspector.overflowWarning", {
            count: draftOverflowCount,
            defaultValue: `已超過上限，還需移除 ${draftOverflowCount} 首。`,
          })}
        </div>
      )}

      {reachedCollectionLimit && (
        <div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100">
          {t("inspector.collectionLimitWarning", {
            defaultValue: "已達收藏庫建立上限。",
          })}
        </div>
      )}

      {!reachedCollectionLimit && reachedPrivateCollectionLimit && (
        <div className="mt-3 rounded-xl border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100">
          {t("inspector.privateLimitWarning", {
            defaultValue: "私人收藏已達上限，目前只能建立公開收藏。",
          })}
        </div>
      )}

      {createError && (
        <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-950/50 px-3 py-2 text-xs leading-5 text-rose-200">
          {createError}
        </div>
      )}
    </aside>
  );
}
