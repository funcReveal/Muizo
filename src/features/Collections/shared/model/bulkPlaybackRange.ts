import { DEFAULT_DURATION_SEC } from "../../edit/utils/editUtils";
import type { DraftPlaylistItem } from "../../create/utils/createCollectionImport";
import type { EditableItem } from "../../edit/utils/editTypes";

export type BulkPlaybackMode = "percent" | "fixed";

export type BulkPlaybackDraft = {
  mode: BulkPlaybackMode;
  percent: number;
  startInput: string;
  clipLengthInput: string;
};

export type BulkPlaybackSourceItem = Pick<
  DraftPlaylistItem | EditableItem,
  "title" | "answerText" | "uploader" | "duration" | "thumbnail"
> & {
  id: string;
};

export type BulkPlaybackPreviewItem = {
  id: string;
  title: string;
  uploader?: string;
  thumbnail?: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  clipLengthSec: number;
  desiredClipLengthSec: number;
  isShortened: boolean;
};

export const DEFAULT_BULK_PLAYBACK_DRAFT: BulkPlaybackDraft = {
  mode: "percent",
  percent: 20,
  startInput: "0:00",
  clipLengthInput: "0:30",
};

export function buildBulkPlaybackPreviewItems({
  items,
  draft,
  parseDurationToSeconds,
  parseTimeInput,
}: {
  items: BulkPlaybackSourceItem[];
  draft: BulkPlaybackDraft;
  parseDurationToSeconds: (duration?: string) => number | null;
  parseTimeInput: (value: string) => number | null;
}): BulkPlaybackPreviewItem[] {
  const desiredClipLength = parseTimeInput(draft.clipLengthInput) ?? 30;
  const safeDesiredClipLength = Math.max(1, Math.floor(desiredClipLength));
  const fixedStartSec =
    draft.mode === "fixed" ? (parseTimeInput(draft.startInput) ?? 0) : 0;

  return items.map((item) => {
    const durationSec = Math.max(
      1,
      parseDurationToSeconds(item.duration) ?? DEFAULT_DURATION_SEC,
    );
    const rawStart =
      draft.mode === "percent"
        ? Math.floor((durationSec * draft.percent) / 100)
        : Math.floor(fixedStartSec);
    const boundedStart = Math.min(Math.max(0, rawStart), durationSec - 1);
    const desiredEnd = boundedStart + safeDesiredClipLength;
    const endSec = Math.min(durationSec, desiredEnd);
    const startSec =
      endSec <= boundedStart ? Math.max(0, durationSec - 1) : boundedStart;
    const finalEndSec = Math.max(startSec + 1, endSec);
    const clipLengthSec = Math.max(1, finalEndSec - startSec);

    return {
      id: item.id,
      title: item.title || item.answerText || "Untitled",
      uploader: item.uploader,
      thumbnail: item.thumbnail,
      startSec,
      endSec: finalEndSec,
      durationSec,
      clipLengthSec,
      desiredClipLengthSec: safeDesiredClipLength,
      isShortened: clipLengthSec < safeDesiredClipLength,
    };
  });
}
