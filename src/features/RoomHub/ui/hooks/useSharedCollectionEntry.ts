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
  loadCollectionItems: (
    collectionId: string,
    options?: { force?: boolean; readToken?: string | null },
  ) => Promise<unknown>;
  fetchCollectionById: (
    collectionId: string,
    options?: { readToken?: string | null },
  ) => Promise<CollectionEntry | null>;
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

    void (async () => {
      const collection = await fetchCollectionById(sharedCollectionId);

      if (cancelled || !collection) return;

      const scope = collection.visibility === "private" ? "private" : "public";

      setSharedCollectionMeta({
        id: collection.id,
        title: collection.title,
        scope,
      });

      openCollectionDrawer(collection);

      void loadCollectionItems(collection.id, { force: true });
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
