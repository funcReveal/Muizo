import { useCallback, useMemo, useState } from "react";

export type CollectionCreateImportSourceType =
  | "youtube_url"
  | "youtube_account_playlist";

export type CollectionCreateSourcePlaylistItem = {
  title?: string;
  answerText?: string;
  uploader?: string;
  duration?: string;
  thumbnail?: string;
  url?: string;
  channelId?: string | null;
  videoId?: string;
  provider?: string;
  sourceId?: string | null;
};

export type CollectionCreateImportItem = CollectionCreateSourcePlaylistItem & {
  sourceImportId: string;
  sourceTitle: string;
  sourceType: CollectionCreateImportSourceType;
  sourceItemIndex: number;
};

export type CollectionCreateImportSource = {
  id: string;
  type: CollectionCreateImportSourceType;
  title: string;
  sourceId: string;
  url?: string;
  expectedCount: number | null;
  itemCount: number;
  skippedCount: number;
  duplicateCount: number;
  createdAt: number;
  items: CollectionCreateImportItem[];
};

type AddImportSourceInput = {
  type: CollectionCreateImportSourceType;
  title: string;
  sourceId: string;
  url?: string;
  expectedCount?: number | null;
  skippedCount?: number;
  duplicateCount?: number;
  items: CollectionCreateSourcePlaylistItem[];
};

const buildImportSourceId = (
  type: CollectionCreateImportSourceType,
  sourceId: string,
) => `${type}:${sourceId}`;

export function useCollectionCreateImportSources() {
  const [importSources, setImportSources] = useState<
    CollectionCreateImportSource[]
  >([]);

  const addImportSource = useCallback((input: AddImportSourceInput) => {
    const title = input.title.trim() || "Untitled source";
    const sourceId = input.sourceId.trim();

    if (!sourceId || input.items.length === 0) {
      return null;
    }

    const id = buildImportSourceId(input.type, sourceId);

    const nextSource: CollectionCreateImportSource = {
      id,
      type: input.type,
      title,
      sourceId,
      url: input.url,
      expectedCount: input.expectedCount ?? input.items.length,
      itemCount: input.items.length,
      skippedCount: input.skippedCount ?? 0,
      duplicateCount: input.duplicateCount ?? 0,
      createdAt: Date.now(),
      items: input.items.map((item, index) => ({
        ...item,
        sourceImportId: id,
        sourceTitle: title,
        sourceType: input.type,
        sourceItemIndex: index,
      })),
    };

    setImportSources((prev) => [
      ...prev.filter((source) => source.id !== id),
      nextSource,
    ]);

    return id;
  }, []);

  const removeImportSource = useCallback((sourceId: string) => {
    setImportSources((prev) => prev.filter((source) => source.id !== sourceId));
  }, []);

  const resetImportSources = useCallback(() => {
    setImportSources([]);
  }, []);

  const importedPlaylistItems = useMemo(
    () => importSources.flatMap((source) => source.items),
    [importSources],
  );

  const totalImportedItemCount = importedPlaylistItems.length;

  const totalSkippedItemCount = useMemo(
    () => importSources.reduce((sum, source) => sum + source.skippedCount, 0),
    [importSources],
  );

  const totalDuplicateItemCount = useMemo(
    () => importSources.reduce((sum, source) => sum + source.duplicateCount, 0),
    [importSources],
  );

  return {
    importSources,
    importedPlaylistItems,
    totalImportedItemCount,
    totalSkippedItemCount,
    totalDuplicateItemCount,
    addImportSource,
    removeImportSource,
    resetImportSources,
  };
}
