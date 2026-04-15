import {
  useCallback,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { EditableItem } from "../utils/editTypes";
import {
  DEFAULT_DURATION_SEC,
  formatSeconds,
  parseDurationToSeconds,
} from "../utils/editUtils";

type UseCollectionEditSelectionArgs = {
  playlistItems: EditableItem[];
  selectedItemId: string | null;
  setSelectedItemId: Dispatch<SetStateAction<string | null>>;
  setPlaylistItems: Dispatch<SetStateAction<EditableItem[]>>;
  markDirty: () => void;
  hasUnsavedChanges: boolean;
  onAutoSaveCurrent: () => void;
  onBeforeSelect?: () => void;
  setCurrentTimeSec: Dispatch<SetStateAction<number>>;
  previewFromStart: (sec: number) => void;
  previewBeforeEnd: (rangeStartSec: number, rangeEndSec: number) => void;
};

type TimeDraftState = {
  itemId: string | null;
  startInput: string;
  endInput: string;
};

export function useCollectionEditSelection({
  playlistItems,
  selectedItemId,
  setSelectedItemId,
  setPlaylistItems,
  markDirty,
  hasUnsavedChanges,
  onAutoSaveCurrent,
  onBeforeSelect,
  setCurrentTimeSec,
  previewFromStart,
  previewBeforeEnd,
}: UseCollectionEditSelectionArgs) {
  const [timeDrafts, setTimeDrafts] = useState<TimeDraftState>({
    itemId: null,
    startInput: "",
    endInput: "",
  });

  const selectedIndex = useMemo(() => {
    if (!playlistItems.length) return 0;
    if (!selectedItemId) return 0;

    const idx = playlistItems.findIndex(
      (item) => item.localId === selectedItemId,
    );
    return idx >= 0 ? idx : 0;
  }, [playlistItems, selectedItemId]);

  const selectedItem = playlistItems[selectedIndex] ?? null;

  const durationSec = useMemo(
    () =>
      parseDurationToSeconds(selectedItem?.duration) ?? DEFAULT_DURATION_SEC,
    [selectedItem?.duration],
  );

  const maxSec = Math.max(1, durationSec);
  const startSec = selectedItem ? Math.min(selectedItem.startSec, maxSec) : 0;
  const endSec = selectedItem
    ? Math.min(Math.max(selectedItem.endSec, startSec + 1), maxSec)
    : DEFAULT_DURATION_SEC;

  const effectiveEnd = Math.max(endSec, startSec + 1);
  const clipDurationSec = Math.max(1, effectiveEnd - startSec);
  const selectedClipDurationSec = selectedItem
    ? Math.max(0, selectedItem.endSec - selectedItem.startSec)
    : 0;

  const startTimeInput =
    timeDrafts.itemId === selectedItem?.localId
      ? timeDrafts.startInput
      : formatSeconds(startSec);

  const endTimeInput =
    timeDrafts.itemId === selectedItem?.localId
      ? timeDrafts.endInput
      : formatSeconds(endSec);

  const answerText = selectedItem?.answerText ?? "";

  const updateSelectedItem = useCallback(
    (updates: Partial<EditableItem>) => {
      if (!selectedItem) return;

      const targetId = selectedItem.localId;
      setPlaylistItems((prev) =>
        prev.map((item) =>
          item.localId === targetId ? { ...item, ...updates } : item,
        ),
      );
      markDirty();
    },
    [markDirty, selectedItem, setPlaylistItems],
  );

  const updateItemAtIndex = useCallback(
    (index: number, updates: Partial<EditableItem>) => {
      setPlaylistItems((prev) =>
        prev.map((item, idx) =>
          idx === index ? { ...item, ...updates } : item,
        ),
      );
      markDirty();
    },
    [markDirty, setPlaylistItems],
  );

  const updateSelectedAnswerText = useCallback(
    (value: string) => {
      if (!selectedItem) return;

      const nextStatus =
        value === selectedItem.answerText
          ? (selectedItem.answerStatus ?? "original")
          : "manual_reviewed";

      updateSelectedItem({
        answerText: value,
        answerStatus: nextStatus,
      });
    },
    [selectedItem, updateSelectedItem],
  );

  const handleSelectIndex = useCallback(
    (nextIndex: number) => {
      if (nextIndex === selectedIndex) return;

      if (hasUnsavedChanges) {
        onAutoSaveCurrent();
      }

      onBeforeSelect?.();
      const target = playlistItems[nextIndex];
      setSelectedItemId(target ? target.localId : null);
      setTimeDrafts({
        itemId: null,
        startInput: "",
        endInput: "",
      });
    },
    [
      hasUnsavedChanges,
      onAutoSaveCurrent,
      onBeforeSelect,
      playlistItems,
      selectedIndex,
      setSelectedItemId,
    ],
  );

  const handleStartInputChange = useCallback(
    (value: string) => {
      setTimeDrafts({
        itemId: selectedItem?.localId ?? null,
        startInput: value,
        endInput: endTimeInput,
      });
    },
    [endTimeInput, selectedItem?.localId],
  );

  const handleEndInputChange = useCallback(
    (value: string) => {
      setTimeDrafts({
        itemId: selectedItem?.localId ?? null,
        startInput: startTimeInput,
        endInput: value,
      });
    },
    [selectedItem?.localId, startTimeInput],
  );

  const handleStartChange = useCallback(
    (value: number) => {
      const next = Math.min(Math.max(0, value), maxSec);
      const nextEnd = next > endSec ? next : endSec;

      setTimeDrafts({
        itemId: selectedItem?.localId ?? null,
        startInput: formatSeconds(next),
        endInput: formatSeconds(nextEnd),
      });
      setCurrentTimeSec(next);

      updateSelectedItem({ startSec: next, endSec: nextEnd });
      previewFromStart(next);
    },
    [
      endSec,
      maxSec,
      previewFromStart,
      selectedItem?.localId,
      setCurrentTimeSec,
      updateSelectedItem,
    ],
  );

  const handleEndChange = useCallback(
    (value: number) => {
      const next = Math.min(Math.max(0, value), maxSec);
      const nextStart = next < startSec ? next : startSec;

      setTimeDrafts({
        itemId: selectedItem?.localId ?? null,
        startInput: formatSeconds(nextStart),
        endInput: formatSeconds(next),
      });
      setCurrentTimeSec((prev) => Math.min(Math.max(prev, nextStart), next));

      updateSelectedItem({ startSec: nextStart, endSec: next });
    },
    [
      maxSec,
      selectedItem?.localId,
      setCurrentTimeSec,
      startSec,
      updateSelectedItem,
    ],
  );

  const handleRangeChange = useCallback(
    (value: number[], activeThumb: number) => {
      const [rawStart, rawEnd] = value;
      const nextStart = Math.min(Math.max(0, rawStart), maxSec);
      const nextEnd = Math.min(Math.max(0, rawEnd), maxSec);

      setTimeDrafts({
        itemId: selectedItem?.localId ?? null,
        startInput: formatSeconds(nextStart),
        endInput: formatSeconds(nextEnd),
      });

      if (activeThumb === 0) {
        setCurrentTimeSec(nextStart);
        previewFromStart(nextStart);
      } else {
        setCurrentTimeSec((prev) =>
          Math.min(Math.max(prev, nextStart), nextEnd),
        );
        previewBeforeEnd(nextStart, nextEnd);
      }

      updateSelectedItem({ startSec: nextStart, endSec: nextEnd });
    },
    [
      maxSec,
      previewBeforeEnd,
      previewFromStart,
      selectedItem?.localId,
      setCurrentTimeSec,
      updateSelectedItem,
    ],
  );

  const handleRangeCommit = useCallback(
    (value: number[], activeThumb: number) => {
      if (activeThumb !== 0) return;

      const [rawStart, rawEnd] = value;
      const nextStart = Math.min(Math.max(0, rawStart), maxSec);
      const nextEnd = Math.min(Math.max(0, rawEnd), maxSec);

      setTimeDrafts({
        itemId: selectedItem?.localId ?? null,
        startInput: formatSeconds(nextStart),
        endInput: formatSeconds(nextEnd),
      });
      setCurrentTimeSec(nextStart);

      updateSelectedItem({ startSec: nextStart, endSec: nextEnd });
    },
    [maxSec, selectedItem?.localId, setCurrentTimeSec, updateSelectedItem],
  );

  const handleStartThumbPress = useCallback(() => {
    previewFromStart(startSec);
  }, [previewFromStart, startSec]);

  const handleEndThumbPress = useCallback(() => {
    previewBeforeEnd(startSec, endSec);
  }, [endSec, previewBeforeEnd, startSec]);

  return {
    selectedIndex,
    selectedItem,
    answerText,
    startSec,
    endSec,
    startTimeInput,
    endTimeInput,
    durationSec,
    maxSec,
    effectiveEnd,
    clipDurationSec,
    selectedClipDurationSec,
    updateSelectedItem,
    updateItemAtIndex,
    updateSelectedAnswerText,
    handleSelectIndex,
    handleStartInputChange,
    handleEndInputChange,
    handleStartChange,
    handleEndChange,
    handleRangeChange,
    handleRangeCommit,
    handleStartThumbPress,
    handleEndThumbPress,
  };
}
