import PlaylistAddRounded from "@mui/icons-material/PlaylistAddRounded";
import { CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";

type CreateProgress = {
  completed: number;
  total: number;
} | null;

type Props = {
  createStageLabel: string | null;
  createProgress: CreateProgress;
};

export default function CollectionCreateProgressOverlay({
  createStageLabel,
  createProgress,
}: Props) {
  const { t } = useTranslation("collectionCreate");

  const createProgressPercent =
    createProgress && createProgress.total > 0
      ? Math.min(
          100,
          Math.round((createProgress.completed / createProgress.total) * 100),
        )
      : null;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(2,6,23,0.72)] backdrop-blur-md">
      <div className="w-full max-w-md rounded-[28px] border border-cyan-300/20 bg-[linear-gradient(180deg,rgba(8,15,28,0.96),rgba(10,18,32,0.9))] p-6 shadow-[0_32px_120px_-48px_rgba(34,211,238,0.5)]">
        <div className="flex items-center gap-4">
          <div className="relative inline-flex h-16 w-16 items-center justify-center">
            <CircularProgress
              size={56}
              thickness={4}
              variant={
                createProgressPercent === null ? "indeterminate" : "determinate"
              }
              value={createProgressPercent ?? undefined}
              sx={{ color: "#67e8f9" }}
            />

            <PlaylistAddRounded
              sx={{
                position: "absolute",
                fontSize: 24,
                color: "#cffafe",
              }}
            />
          </div>

          <div className="min-w-0">
            <div className="text-lg font-semibold text-[var(--mc-text)]">
              {createStageLabel ?? t("creatingOverlay.title")}
            </div>
            <div className="mt-1 text-sm text-[var(--mc-text-muted)]">
              {t("creatingOverlay.description")}
            </div>
          </div>
        </div>

        <div className="mt-5">
          <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#38bdf8,#67e8f9,#f59e0b)] transition-[width] duration-300 ease-out"
              style={{ width: `${createProgressPercent ?? 16}%` }}
            />
          </div>

          <div className="mt-2 flex items-center justify-between text-xs text-[var(--mc-text-muted)]">
            <span>
              {createStageLabel ?? t("creatingOverlay.fallbackStage")}
            </span>
            <span>
              {createProgress
                ? `${createProgress.completed}/${createProgress.total}`
                : t("creatingOverlay.pendingCount")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
