import { useEffect, useRef } from "react";

import type { CollectionEntry } from "@features/CollectionContent";

type UseSharedCollectionEntryArgs = {
  sharedCollectionId: string | null;
  roomCreateSourceMode: string;
  selectedCreateCollectionId: string | null;
  playlistItemsLength: number;
  playlistLoading: boolean;
  collectionItemsError: string | null;
  setGuideMode: (value: "create" | "join") => void;
  setCreateLibraryTab: (
    value: "public" | "personal" | "youtube" | "link",
  ) => void;
  setCreateLeftTab: (value: "library" | "settings") => void;
  setRoomCreateSourceMode: (
    value: "publicCollection" | "privateCollection" | "youtube" | "link",
  ) => void;
  updateAllowCollectionClipTiming: (value: boolean) => boolean;
  setSelectedCreateYoutubeId: (value: string | null) => void;
  setSelectedCreateCollectionId: (value: string | null) => void;
  setSharedCollectionMeta: (
    value: {
      id: string;
      title: string;
      scope: "public" | "private";
    } | null,
  ) => void;
  handleResetPlaylist: () => void;
  fetchCollectionById: (
    collectionId: string,
    options?: { readToken?: string | null },
  ) => Promise<CollectionEntry | null>;
  loadCollectionItems: (
    collectionId: string,
    options?: { force?: boolean; readToken?: string | null },
  ) => Promise<unknown>;
  openCollectionDrawer: (collection: CollectionEntry) => void;
};

export const useSharedCollectionEntry = ({
  sharedCollectionId,
  roomCreateSourceMode,
  selectedCreateCollectionId,
  playlistItemsLength,
  playlistLoading,
  collectionItemsError,
  setGuideMode,
  setCreateLibraryTab,
  setCreateLeftTab,
  setRoomCreateSourceMode,
  updateAllowCollectionClipTiming,
  setSelectedCreateYoutubeId,
  setSelectedCreateCollectionId,
  setSharedCollectionMeta,
  handleResetPlaylist,
  fetchCollectionById,
  loadCollectionItems,
  openCollectionDrawer,
}: UseSharedCollectionEntryArgs) => {
  const handledSharedCollectionRef = useRef<string | null>(null);

  useEffect(() => {
    if (!sharedCollectionId) return;

    const signature = sharedCollectionId;

    if (handledSharedCollectionRef.current === signature) return;

    handledSharedCollectionRef.current = signature;

    let cancelled = false;

    const placeholderCollection: CollectionEntry = {
      id: sharedCollectionId,
      title: "分享收藏庫",
      visibility: "public",
      item_count: 0,
      use_count: 0,
      favorite_count: 0,
      rating_count: 0,
      rating_avg: 0,
      is_favorited: false,
    };

    setGuideMode("create");
    setCreateLibraryTab("public");
    setCreateLeftTab("library");
    updateAllowCollectionClipTiming(true);
    setRoomCreateSourceMode("publicCollection");
    setSelectedCreateYoutubeId(null);
    setSelectedCreateCollectionId(sharedCollectionId);
    setSharedCollectionMeta({
      id: sharedCollectionId,
      title: "分享收藏庫",
      scope: "public",
    });
    handleResetPlaylist();

    /**
     * 先開 drawer。
     * 不要等 fetchCollectionById 成功，否則 API 慢、失敗、或狀態 race 時，
     * 使用者只會看到卡片被選取，但 drawer 不會開。
     */
    openCollectionDrawer(placeholderCollection);

    void (async () => {
      const collection = await fetchCollectionById(sharedCollectionId);

      if (cancelled) return;

      if (collection) {
        const scope =
          collection.visibility === "private" ? "private" : "public";

        setSharedCollectionMeta({
          id: collection.id,
          title: collection.title,
          scope,
        });

        /**
         * API 成功後，用真正的 collection 覆蓋 placeholder。
         */
        openCollectionDrawer(collection);

        void loadCollectionItems(collection.id, { force: true });
        return;
      }

      /**
       * 即使 collection summary API 失敗，也至少嘗試載入 items。
       * 這可以幫你判斷問題是單筆 collection API，還是 drawer 本身。
       */
      void loadCollectionItems(sharedCollectionId, { force: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [
    fetchCollectionById,
    handleResetPlaylist,
    loadCollectionItems,
    openCollectionDrawer,
    setCreateLeftTab,
    setCreateLibraryTab,
    setGuideMode,
    setRoomCreateSourceMode,
    setSelectedCreateCollectionId,
    setSelectedCreateYoutubeId,
    setSharedCollectionMeta,
    sharedCollectionId,
    updateAllowCollectionClipTiming,
  ]);

  useEffect(() => {
    if (!sharedCollectionId) return;
    if (roomCreateSourceMode !== "publicCollection") return;
    if (selectedCreateCollectionId !== sharedCollectionId) return;
    if (playlistItemsLength > 0 || playlistLoading) return;
    if (collectionItemsError) return;

    void loadCollectionItems(sharedCollectionId, { force: true });
  }, [
    collectionItemsError,
    loadCollectionItems,
    playlistItemsLength,
    playlistLoading,
    roomCreateSourceMode,
    selectedCreateCollectionId,
    sharedCollectionId,
  ]);

  return {
    handledSharedCollectionRef,
  };
};
