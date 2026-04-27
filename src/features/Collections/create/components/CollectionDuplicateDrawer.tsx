import CloseRounded from "@mui/icons-material/CloseRounded";
import LibraryMusicRounded from "@mui/icons-material/LibraryMusicRounded";
import { Drawer, IconButton } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { RemovedDuplicateGroup } from "../utils/createCollectionImport";

type Props = {
  open: boolean;
  onClose: () => void;
  removedDuplicateCount: number;
  removedDuplicateGroups: RemovedDuplicateGroup[];
};

export default function CollectionDuplicateDrawer({
  open,
  onClose,
  removedDuplicateCount,
  removedDuplicateGroups,
}: Props) {
  const { t } = useTranslation("collectionCreate");

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: {
            xs: "100%",
            sm: 520,
          },
          borderLeft: "1px solid rgba(148, 163, 184, 0.22)",
          background:
            "linear-gradient(180deg, rgba(8,13,24,0.98), rgba(2,6,23,0.98))",
          color: "var(--mc-text)",
        },
      }}
    >
      <div className="flex h-full flex-col">
        <div className="border-b border-[var(--mc-border)] px-4 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-base font-semibold text-[var(--mc-text)]">
                <LibraryMusicRounded sx={{ fontSize: 20 }} />
                {t("duplicateDrawer.title")}
              </div>

              <div className="mt-1 text-sm leading-6 text-[var(--mc-text-muted)]">
                {t("duplicateDrawer.description", {
                  count: removedDuplicateCount,
                })}
              </div>
            </div>

            <IconButton
              size="small"
              onClick={onClose}
              aria-label={t("duplicateDrawer.close")}
              sx={{ color: "var(--mc-text-muted)" }}
            >
              <CloseRounded fontSize="small" />
            </IconButton>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {removedDuplicateGroups.length > 0 ? (
            <div className="space-y-3">
              {removedDuplicateGroups.map((group) => (
                <div
                  key={group.key}
                  className="rounded-2xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-3"
                >
                  <div className="text-sm font-semibold text-[var(--mc-text)]">
                    {group.title}
                  </div>

                  <div className="mt-1 text-xs text-[var(--mc-text-muted)]">
                    {group.uploader || t("duplicateDrawer.unknownUploader")}
                  </div>

                  <div className="mt-2 rounded-xl border border-emerald-300/20 bg-emerald-950/20 px-3 py-2 text-xs leading-5 text-emerald-100">
                    {t("duplicateDrawer.occurrenceSummary", {
                      totalCount: group.totalCount,
                      keptIndex: group.keptIndex + 1,
                      removedCount: group.removedCount,
                    })}
                  </div>

                  <div className="mt-2 text-[11px] leading-5 text-emerald-200">
                    {t("duplicateDrawer.removedPositions", {
                      positions: group.removedIndexes
                        .map((index) => index + 1)
                        .join(t("duplicateDrawer.positionSeparator")),
                    })}
                  </div>

                  {group.url && (
                    <a
                      href={group.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 block break-all text-[11px] text-cyan-200 underline decoration-cyan-300/40 underline-offset-4 transition hover:text-cyan-100"
                    >
                      {group.url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/25 px-4 py-8 text-sm text-[var(--mc-text-muted)]">
              {t("duplicateDrawer.empty")}
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
