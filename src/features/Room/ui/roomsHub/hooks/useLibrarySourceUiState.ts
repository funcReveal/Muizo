import { useEffect, useRef, useState } from "react";

export type CreateLibraryTab = "public" | "personal" | "youtube" | "link";
export type CreateLeftTab = "library" | "settings";

const CREATE_VIEW_STORAGE_KEY = "rooms_hub_create_view";

export type SharedCollectionMeta = {
  id: string;
  title: string;
  scope: "public" | "private";
} | null;

export const useLibrarySourceUiState = () => {
  const [createLibraryTab, setCreateLibraryTab] =
    useState<CreateLibraryTab>("public");
  const [sharedCollectionMeta, setSharedCollectionMeta] =
    useState<SharedCollectionMeta>(null);
  const [createLibraryView, setCreateLibraryView] = useState<"grid" | "list">(() => {
    if (typeof window === "undefined") return "grid";
    const stored = window.localStorage.getItem(CREATE_VIEW_STORAGE_KEY);
    return stored === "list" ? "list" : "grid";
  });
  const [createLibrarySearch, setCreateLibrarySearch] = useState("");
  const [createLeftTab, setCreateLeftTab] = useState<CreateLeftTab>("library");
  const [playlistUrlDraft, setPlaylistUrlDraft] = useState("");
  const [playlistPreviewError, setPlaylistPreviewError] = useState<
    string | null
  >(null);
  const [isPlaylistUrlFieldFocused, setIsPlaylistUrlFieldFocused] =
    useState(false);
  const [isPublicLibrarySearchExpanded, setIsPublicLibrarySearchExpanded] =
    useState(false);
  const [selectedCreateCollectionId, setSelectedCreateCollectionId] = useState<
    string | null
  >(null);
  const [selectedCreateYoutubeId, setSelectedCreateYoutubeId] = useState<
    string | null
  >(null);
  const previousCreateLibraryTabRef = useRef<CreateLibraryTab>(createLibraryTab);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CREATE_VIEW_STORAGE_KEY, createLibraryView);
  }, [createLibraryView]);

  return {
    createLibraryTab,
    setCreateLibraryTab,
    sharedCollectionMeta,
    setSharedCollectionMeta,
    createLibraryView,
    setCreateLibraryView,
    createLibrarySearch,
    setCreateLibrarySearch,
    createLeftTab,
    setCreateLeftTab,
    playlistUrlDraft,
    setPlaylistUrlDraft,
    playlistPreviewError,
    setPlaylistPreviewError,
    isPlaylistUrlFieldFocused,
    setIsPlaylistUrlFieldFocused,
    isPublicLibrarySearchExpanded,
    setIsPublicLibrarySearchExpanded,
    selectedCreateCollectionId,
    setSelectedCreateCollectionId,
    selectedCreateYoutubeId,
    setSelectedCreateYoutubeId,
    previousCreateLibraryTabRef,
  };
};
