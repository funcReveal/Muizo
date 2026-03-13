import { useEffect, useMemo, useRef, useState, type ReactNode, type UIEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from "@mui/material";
import { List, type RowComponentProps } from "react-window";
import {
  BookmarkBorderRounded,
  CloseRounded,
  LinkRounded,
  LockOutlined,
  PlayCircleOutlineRounded,
  PublicOutlined,
} from "@mui/icons-material";

import type { RoomSummary } from "../model/types";
import { useRoom } from "../model/useRoom";
import { apiFetchRoomById } from "../model/roomApi";
import {
  API_URL,
  PLAYER_MAX,
  PLAYER_MIN,
  PLAY_DURATION_MAX,
  PLAY_DURATION_MIN,
  REVEAL_DURATION_MAX,
  REVEAL_DURATION_MIN,
  START_OFFSET_MAX,
  START_OFFSET_MIN,
  USERNAME_MAX,
} from "../model/roomConstants";

const isRoomCurrentlyPlaying = (room: RoomSummary) => {
  const source = room as RoomSummary &
    Record<string, unknown> & {
      gameState?: { status?: unknown } | null;
    };

  const boolCandidates = [
    source.isPlaying,
    source.playing,
    source.inGame,
    source.hasActiveGame,
  ];
  if (boolCandidates.some((value) => value === true)) return true;

  const stringCandidates = [
    source.gameStatus,
    source.game_status,
    source.status,
    source.liveStatus,
    source.roomStatus,
    source.gameState?.status,
  ];
  for (const value of stringCandidates) {
    if (typeof value !== "string") continue;
    const normalized = value.trim().toLowerCase();
    if (
      normalized === "playing" ||
      normalized === "in_progress" ||
      normalized === "active" ||
      normalized === "started" ||
      normalized === "running"
    ) {
      return true;
    }
  }

  return false;
};

type PlaylistPreviewRowProps = {
  items: Array<{
    title: string;
    uploader?: string;
    duration?: string;
    thumbnail?: string;
  }>;
};

const PlaylistPreviewRow = ({
  index,
  style,
  items,
}: RowComponentProps<PlaylistPreviewRowProps>) => {
  const item = items[index];
  return (
    <div style={style} className="px-2 py-1">
      <div className="flex items-center gap-3 rounded-lg border border-[var(--mc-border)]/70 bg-slate-950/25 px-2 py-2">
        <img
          src={item.thumbnail || "https://img.youtube.com/vi/default/hqdefault.jpg"}
          alt={item.title}
          className="h-10 w-16 rounded object-cover"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--mc-text)]">
            {item.title}
          </p>
          <p className="truncate text-xs text-[var(--mc-text-muted)]">
            {item.uploader || "未知作者"}
            {item.duration ? ` · ${item.duration}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
};

const skeletonWaveClass =
  "relative overflow-hidden rounded-xl border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(8,15,28,0.94),rgba(15,23,42,0.78))] shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_30px_-24px_rgba(6,182,212,0.6)]";

const skeletonPulseClass =
  "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_18%_22%,rgba(56,189,248,0.18),transparent_30%),radial-gradient(circle_at_78%_12%,rgba(34,197,94,0.08),transparent_24%),linear-gradient(90deg,rgba(148,163,184,0.08),rgba(148,163,184,0.02))] before:animate-[skeleton-breathe_3.4s_ease-in-out_infinite]";

const skeletonShimmerClass =
  "after:pointer-events-none after:absolute after:inset-y-0 after:left-[-35%] after:w-[42%] after:-skew-x-[22deg] after:bg-[linear-gradient(90deg,transparent,rgba(125,211,252,0.18),rgba(255,255,255,0.34),rgba(125,211,252,0.18),transparent)] after:blur-[1px] after:animate-[skeleton-sheen_1.9s_cubic-bezier(0.22,1,0.36,1)_infinite]";

const buildSkeletonClassName = (shapeClassName: string) =>
  `${skeletonWaveClass} ${skeletonPulseClass} ${skeletonShimmerClass} ${shapeClassName}`;

const skeletonLineClass =
  "rounded-full bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

const renderYoutubeSkeletonCard = (
  idx: number,
  view: "grid" | "list",
) => {
  if (view === "grid") {
    return (
      <div key={`yt-skeleton-${idx}`} className={buildSkeletonClassName("p-3")}>
        <div className="mb-3 h-28 w-full rounded-md bg-white/8" />
        <div className="space-y-2">
          <div className={`${skeletonLineClass} h-4 w-[72%]`} />
          <div className={`${skeletonLineClass} h-3 w-[44%]`} />
          <div className={`${skeletonLineClass} h-3 w-[24%]`} />
        </div>
      </div>
    );
  }

  return (
    <div
      key={`yt-skeleton-${idx}`}
      className={buildSkeletonClassName("flex items-center gap-3 px-3 py-2")}
    >
      <div className="h-10 w-16 shrink-0 rounded-md bg-white/8" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className={`${skeletonLineClass} h-4 w-[68%]`} />
        <div className={`${skeletonLineClass} h-3 w-[38%]`} />
      </div>
      <div className={`${skeletonLineClass} h-3 w-10 shrink-0`} />
    </div>
  );
};

const renderCollectionSkeletonCard = (
  idx: number,
  view: "grid" | "list",
) => {
  if (view === "grid") {
    return (
      <div key={`collection-skeleton-${idx}`} className={buildSkeletonClassName("p-3")}>
        <div className="mb-3 h-28 w-full rounded-md bg-white/8" />
        <div className="space-y-2">
          <div className={`${skeletonLineClass} h-4 w-[76%]`} />
          <div className={`${skeletonLineClass} h-3 w-[52%]`} />
          <div className={`${skeletonLineClass} h-3 w-[48%]`} />
        </div>
      </div>
    );
  }

  return (
    <div
      key={`collection-skeleton-${idx}`}
      className={buildSkeletonClassName("flex items-center gap-3 px-3 py-2")}
    >
      <div className="h-11 w-16 shrink-0 rounded-md bg-white/8" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className={`${skeletonLineClass} h-4 w-[72%]`} />
        <div className={`${skeletonLineClass} h-3 w-[46%]`} />
        <div className={`${skeletonLineClass} h-3 w-[54%]`} />
      </div>
    </div>
  );
};

type VirtualLibraryListRowProps = {
  items: unknown[];
  renderItem: (item: unknown, itemIndex: number, view: "list") => ReactNode;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  renderLoader?: () => ReactNode;
};

const VirtualLibraryListRow = ({
  index,
  style,
  items,
  renderItem,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  renderLoader,
}: RowComponentProps<VirtualLibraryListRowProps>) => {
  const item = items[index];
  const isLoaderRow = typeof item === "undefined" && (hasMore || isLoadingMore);

  useEffect(() => {
    if (!isLoaderRow || !hasMore || isLoadingMore || !onLoadMore) return;
    onLoadMore();
  }, [hasMore, isLoaderRow, isLoadingMore, onLoadMore]);

  if (isLoaderRow) {
    return (
      <div style={style} className="pr-1">
        {renderLoader ? renderLoader() : null}
      </div>
    );
  }

  return (
    <div style={style} className="pr-1">
      {item ? renderItem(item, index, "list") : null}
    </div>
  );
};

const GUIDE_MODE_STORAGE_KEY = "mq_room_guide_mode";

const formatDurationLabel = (durationSec?: number | null) => {
  if (!durationSec || durationSec <= 0) return null;
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

const getRoomPlaylistLabel = (room: RoomSummary) => {
  const source = room as RoomSummary &
    Record<string, unknown> & {
      playlist?: { title?: unknown } | null;
    };

  const candidates = [
    room.playlistTitle,
    source.playlist_title,
    source.sourceTitle,
    source.source_title,
    source.collectionTitle,
    source.collection_title,
    source.playlist?.title,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const trimmed = candidate.trim();
    if (trimmed) return trimmed;
  }

  return room.playlistCount > 0 ? `共 ${room.playlistCount} 首題目` : "題庫資訊未提供";
};

const getRoomStatusLabel = (room: RoomSummary) =>
  isRoomCurrentlyPlaying(room) ? "遊玩中" : "待機中";

const RoomListPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    username,
    usernameInput,
    setUsernameInput,
    handleSetUsername,
    loginWithGoogle,
    authLoading,
    authUser,
    rooms,
    collections,
    collectionsLoading,
    collectionsLoadingMore,
    collectionsHasMore,
    collectionsError,
    fetchCollections,
    loadMoreCollections,
    loadCollectionItems,
    youtubePlaylists,
    youtubePlaylistsLoading,
    fetchYoutubePlaylists,
    importYoutubePlaylist,
    playlistItems,
    playlistLoading,
    playlistError,
    playlistPreviewMeta,
    lastFetchedPlaylistTitle,
    handleFetchPlaylistByUrl,
    handleResetPlaylist,
    currentRoom,
    roomNameInput,
    setRoomNameInput,
    roomVisibilityInput,
    setRoomVisibilityInput,
    roomPasswordInput,
    setRoomPasswordInput,
    roomMaxPlayersInput,
    setRoomMaxPlayersInput,
    questionCount,
    questionMin,
    questionMaxLimit,
    updateQuestionCount,
    playDurationSec,
    updatePlayDurationSec,
    revealDurationSec,
    updateRevealDurationSec,
    startOffsetSec,
    updateStartOffsetSec,
    allowCollectionClipTiming,
    updateAllowCollectionClipTiming,
    roomCreateSourceMode,
    setRoomCreateSourceMode,
    isCreatingRoom,
    handleCreateRoom,
    setJoinPasswordInput,
    handleJoinRoom,
  } = useRoom();
  const isLibraryGridWide = useMediaQuery("(min-width:640px)");
  const [passwordDialog, setPasswordDialog] = useState<{
    roomId: string;
    roomName: string;
  } | null>(null);
  const [joinConfirmDialog, setJoinConfirmDialog] = useState<{
    roomId: string;
    roomName: string;
    hasPassword: boolean;
    playlistTitle: string;
    playerCount: number;
    maxPlayers?: number | null;
    questionCount?: number;
    currentQuestionNo?: number | null;
    completedQuestionCount?: number;
    totalQuestionCount?: number;
  } | null>(null);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [directRoomIdInput, setDirectRoomIdInput] = useState("");
  const [directJoinLoading, setDirectJoinLoading] = useState(false);
  const [directJoinError, setDirectJoinError] = useState<string | null>(null);
  const [directJoinNeedsPassword, setDirectJoinNeedsPassword] = useState(false);
  const [guideMode, setGuideMode] = useState<"create" | "join">(() => {
    if (typeof window === "undefined") return "create";
    const stored = window.sessionStorage.getItem(GUIDE_MODE_STORAGE_KEY);
    return stored === "join" ? "join" : "create";
  });
  const [createLibraryTab, setCreateLibraryTab] = useState<
    "public" | "personal" | "youtube" | "link"
  >("public");
  const [createLibraryView, setCreateLibraryView] = useState<"grid" | "list">(
    "grid",
  );
  const [createLeftTab, setCreateLeftTab] = useState<"library" | "settings">(
    "library",
  );
  const [joinRoomsView, setJoinRoomsView] = useState<"grid" | "list">("list");
  const [selectedJoinRoomId, setSelectedJoinRoomId] = useState<string | null>(
    null,
  );
  const [playlistUrlDraft, setPlaylistUrlDraft] = useState("");
  const [playlistPreviewError, setPlaylistPreviewError] = useState<string | null>(
    null,
  );
  const [joinPasswordFilter, setJoinPasswordFilter] = useState<
    "all" | "no_password" | "password_required"
  >("all");
  const [joinSortMode, setJoinSortMode] = useState<"latest" | "players_desc">(
    "latest",
  );
  const [selectedCreateCollectionId, setSelectedCreateCollectionId] = useState<
    string | null
  >(null);
  const [selectedCreateYoutubeId, setSelectedCreateYoutubeId] = useState<
    string | null
  >(null);
  const lastAutoPreviewUrlRef = useRef("");
  const hasRequestedYoutubePlaylistsRef = useRef(false);
  const createLibraryScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (currentRoom?.id) {
      navigate(`/rooms/${currentRoom.id}`, { replace: true });
    }
  }, [currentRoom?.id, navigate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.setItem(GUIDE_MODE_STORAGE_KEY, guideMode);
  }, [guideMode]);

  const canUseGoogleLibraries = Boolean(authUser);
  const selectedJoinRoom = useMemo(
    () => rooms.find((room) => room.id === selectedJoinRoomId) ?? null,
    [rooms, selectedJoinRoomId],
  );
  const filteredJoinRooms = useMemo(() => {
    const next = [...rooms].filter((room) => {
      if (joinPasswordFilter === "no_password") return !room.hasPassword;
      if (joinPasswordFilter === "password_required") return room.hasPassword;
      return true;
    });
    if (joinSortMode === "players_desc") {
      next.sort((a, b) => b.playerCount - a.playerCount);
      return next;
    }
    next.sort((a, b) => {
      const aTs = new Date(a.createdAt).getTime();
      const bTs = new Date(b.createdAt).getTime();
      return bTs - aTs;
    });
    return next;
  }, [joinPasswordFilter, joinSortMode, rooms]);
  const joinPreviewRoom = selectedJoinRoom ?? filteredJoinRooms[0] ?? null;
  const playlistPreviewItems = useMemo(
    () =>
      playlistItems.map((item) => ({
        title: item.title,
        uploader: item.uploader,
        duration: item.duration,
        thumbnail: item.thumbnail,
        url: item.url,
        videoId: item.videoId,
      })),
    [playlistItems],
  );
  const playlistIssueSummary = useMemo(() => {
    if (playlistPreviewMeta?.skippedItems?.length) {
      const removed: string[] = [];
      const privateRestricted: string[] = [];
      const embedBlocked: string[] = [];
      const unavailable: string[] = [];
      const unknown: string[] = [];
      playlistPreviewMeta.skippedItems.forEach((item) => {
        const label = item.title?.trim() || item.videoId || "未知項目";
        if (item.status === "removed") {
          removed.push(label);
          return;
        }
        if (item.status === "private") {
          privateRestricted.push(label);
          return;
        }
        if (item.status === "blocked") {
          embedBlocked.push(label);
          return;
        }
        if (item.status === "unavailable") {
          unavailable.push(label);
          return;
        }
        unknown.push(label);
      });
      return {
        removed,
        privateRestricted,
        embedBlocked,
        unavailable,
        unknown,
        unknownCount: 0,
        exact: true,
      };
    }
    if ((playlistPreviewMeta?.skippedCount ?? 0) > 0) {
      return {
        removed: [],
        privateRestricted: [],
        embedBlocked: [],
        unavailable: [],
        unknown: [],
        unknownCount: playlistPreviewMeta?.skippedCount ?? 0,
        exact: false,
      };
    }
    return {
      removed: [],
      privateRestricted: [],
      embedBlocked: [],
      unavailable: [],
      unknown: [],
      unknownCount: 0,
      exact: false,
    };
  }, [playlistPreviewMeta]);
  const isLinkSourceActive = roomCreateSourceMode === "link";
  const linkPreviewLocked =
    isLinkSourceActive &&
    (Boolean(lastFetchedPlaylistTitle) || playlistItems.length > 0);
  const linkPlaylistTitle = isLinkSourceActive ? lastFetchedPlaylistTitle : null;
  const linkPlaylistPreviewItems = isLinkSourceActive ? playlistPreviewItems : [];
  const linkPlaylistIssueSummary = isLinkSourceActive
    ? playlistIssueSummary
    : {
        removed: [],
        privateRestricted: [],
        embedBlocked: [],
        unavailable: [],
        unknown: [],
        unknownCount: 0,
        exact: false,
      };
  const normalizedMaxPlayersInput = roomMaxPlayersInput.trim();
  const parsedMaxPlayers = normalizedMaxPlayersInput
    ? Number(normalizedMaxPlayersInput)
    : null;
  const maxPlayersInvalid =
    parsedMaxPlayers !== null &&
    (!Number.isInteger(parsedMaxPlayers) ||
      parsedMaxPlayers < PLAYER_MIN ||
      parsedMaxPlayers > PLAYER_MAX);
  const canCreateRoom =
    Boolean(roomNameInput.trim()) &&
    playlistItems.length > 0 &&
    !playlistLoading &&
    !maxPlayersInvalid &&
    !isCreatingRoom;
  const createRequirementsHint = !roomNameInput.trim()
    ? "請先填寫房間名稱。"
    : playlistItems.length === 0
      ? "請先選擇題庫來源並載入歌曲。"
      : maxPlayersInvalid
        ? `人數需介於 ${PLAYER_MIN}-${PLAYER_MAX}。`
        : null;
  const isCreateSourceReady = playlistItems.length > 0;
  const selectedYoutubePlaylist = useMemo(
    () =>
      selectedCreateYoutubeId
        ? youtubePlaylists.find((item) => item.id === selectedCreateYoutubeId) ?? null
        : null,
    [selectedCreateYoutubeId, youtubePlaylists],
  );
  const selectedCollection = useMemo(
    () =>
      selectedCreateCollectionId
        ? collections.find((item) => item.id === selectedCreateCollectionId) ?? null
        : null,
    [collections, selectedCreateCollectionId],
  );
  const selectedCollectionThumb =
    selectedCollection?.cover_thumbnail_url ||
    (selectedCollection?.cover_provider === "youtube" &&
    selectedCollection?.cover_source_id
      ? `https://i.ytimg.com/vi/${selectedCollection.cover_source_id}/hqdefault.jpg`
      : "");
  const selectedSourceSummary = useMemo(() => {
    if (!isCreateSourceReady) return null;
    if (roomCreateSourceMode === "link") {
      return {
        label: "貼上連結",
        title: lastFetchedPlaylistTitle || "YouTube 連結清單",
        detail: `已載入 ${playlistItems.length} 首`,
        thumbnail: playlistPreviewItems[0]?.thumbnail || "",
      };
    }
    if (roomCreateSourceMode === "youtube") {
      return {
        label: "YouTube 清單",
        title: selectedYoutubePlaylist?.title || "已選擇 YouTube 播放清單",
        detail: `${playlistItems.length} 首`,
        thumbnail: selectedYoutubePlaylist?.thumbnail || playlistPreviewItems[0]?.thumbnail || "",
      };
    }
    if (roomCreateSourceMode === "publicCollection") {
      return {
        label: "公開收藏庫",
        title: selectedCollection?.title || "已選擇公開收藏",
        detail: `已載入 ${playlistItems.length} 首`,
        thumbnail: selectedCollectionThumb,
      };
    }
    if (roomCreateSourceMode === "privateCollection") {
      return {
        label: "個人收藏庫",
        title: selectedCollection?.title || "已選擇個人收藏",
        detail: `已載入 ${playlistItems.length} 首`,
        thumbnail: selectedCollectionThumb,
      };
    }
    return null;
  }, [
    isCreateSourceReady,
    lastFetchedPlaylistTitle,
    playlistItems.length,
    playlistPreviewItems,
    roomCreateSourceMode,
    selectedCollection?.title,
    selectedCollectionThumb,
    selectedYoutubePlaylist?.thumbnail,
    selectedYoutubePlaylist?.title,
  ]);
  const createLibraryColumns = isLibraryGridWide ? 2 : 1;
  const youtubeListRowHeight = 80;
  const youtubeListHeight = Math.min(
    640,
    Math.max(youtubeListRowHeight, youtubePlaylists.length * youtubeListRowHeight),
  );
  const collectionListRowHeight = 92;
  const collectionListRowCount =
    collections.length + (collectionsHasMore || collectionsLoadingMore ? 1 : 0);
  const collectionListHeight = Math.min(
    640,
    Math.max(collectionListRowHeight, collectionListRowCount * collectionListRowHeight),
  );

  const renderYoutubeCard = (playlistValue: unknown, _itemIndex: number, view: "grid" | "list") => {
    const playlist = playlistValue as (typeof youtubePlaylists)[number];
    return (
      <button
        key={playlist.id}
        type="button"
        onClick={() => {
          void handlePickYoutubeSource(playlist.id);
        }}
        className={`rounded-xl border text-left transition ${
          selectedCreateYoutubeId === playlist.id
            ? "border-cyan-300/55 bg-cyan-500/10"
            : "border-cyan-300/25 bg-slate-950/25 hover:border-cyan-300/45"
        } ${
          view === "grid" ? "h-full p-3" : "flex w-full items-center gap-3 px-3 py-2"
        }`}
      >
        <div
          className={`overflow-hidden rounded-md border border-cyan-300/20 bg-slate-900/40 ${
            view === "grid" ? "mb-3 h-28 w-full" : "h-10 w-16 shrink-0"
          }`}
        >
          {playlist.thumbnail ? (
            <img
              src={playlist.thumbnail}
              alt={playlist.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--mc-text-muted)]">
              無縮圖
            </div>
          )}
        </div>
        <div className={`min-w-0 ${view === "grid" ? "space-y-1" : "flex-1"}`}>
          <span className="block truncate text-sm font-semibold text-[var(--mc-text)]">
            {playlist.title}
          </span>
          <span className="mt-1 block text-xs text-[var(--mc-text-muted)]">
            YouTube 播放清單
          </span>
          <span className="block text-xs text-[var(--mc-text-muted)]">
            {playlist.itemCount} 首
          </span>
        </div>
      </button>
    );
  };

  const renderCollectionCard = (
    collectionValue: unknown,
    _itemIndex: number,
    view: "grid" | "list",
  ) => {
    const collection = collectionValue as (typeof collections)[number];
    const previewThumbnail =
      collection.cover_thumbnail_url ||
      (collection.cover_provider === "youtube" && collection.cover_source_id
        ? `https://i.ytimg.com/vi/${collection.cover_source_id}/hqdefault.jpg`
        : "");

    return (
      <button
        key={collection.id}
        type="button"
        onClick={() => {
          const scope = createLibraryTab === "public" ? "public" : "owner";
          void handlePickCollectionSource(collection.id, scope);
        }}
        className={`rounded-xl border px-3 py-2 text-left transition ${
          selectedCreateCollectionId === collection.id
            ? "border-cyan-300/55 bg-cyan-500/10"
            : "border-cyan-300/25 bg-slate-950/25 hover:border-cyan-300/45"
        } ${view === "grid" ? "h-full p-3" : "w-full"}`}
      >
        <div className={`${view === "grid" ? "space-y-3" : "flex items-center gap-3"}`}>
          <div
            className={`overflow-hidden rounded-md border border-[var(--mc-border)]/70 bg-slate-900/40 ${
              view === "grid" ? "h-28 w-full" : "h-11 w-16 shrink-0"
            }`}
          >
            {previewThumbnail ? (
              <img
                src={previewThumbnail}
                alt={collection.cover_title ?? collection.title}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] text-[var(--mc-text-muted)]">
                無縮圖
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[var(--mc-text)]">
              {collection.title}
            </p>
            <p className="mt-1 truncate text-xs text-[var(--mc-text-muted)]">
              {collection.cover_title ||
                ((collection.visibility ?? "private") === "public"
                  ? "公開收藏庫"
                  : "私人收藏庫")}
            </p>
            <p className="mt-1 text-[11px] text-[var(--mc-text-muted)]">
              {(collection.visibility ?? "private") === "public" ? "公開" : "私人"}
              {typeof collection.favorite_count === "number"
                ? ` · 收藏 ${collection.favorite_count}`
                : ""}
              {collection.cover_duration_sec
                ? ` · ${formatDurationLabel(collection.cover_duration_sec)}`
                : ""}
            </p>
          </div>
        </div>
      </button>
    );
  };

  useEffect(() => {
    if (!canUseGoogleLibraries) return;
    if (createLibraryTab === "public") {
      void fetchCollections("public");
      return;
    }
    if (createLibraryTab === "personal") {
      void fetchCollections("owner");
      return;
    }
    if (
      createLibraryTab === "youtube" &&
      youtubePlaylists.length === 0 &&
      !youtubePlaylistsLoading &&
      !hasRequestedYoutubePlaylistsRef.current
    ) {
      hasRequestedYoutubePlaylistsRef.current = true;
      void fetchYoutubePlaylists();
    }
  }, [
    canUseGoogleLibraries,
    createLibraryTab,
    fetchCollections,
    fetchYoutubePlaylists,
    youtubePlaylists.length,
    youtubePlaylistsLoading,
  ]);

  useEffect(() => {
    if (authUser) return;
    hasRequestedYoutubePlaylistsRef.current = false;
  }, [authUser]);
  useEffect(() => {
    if (
      createLibraryView !== "grid" ||
      (createLibraryTab !== "public" && createLibraryTab !== "personal") ||
      collectionsLoading ||
      collectionsLoadingMore ||
      !collectionsHasMore
    ) {
      return;
    }
    const container = createLibraryScrollRef.current;
    if (!container) return;
    if (container.scrollHeight <= container.clientHeight + 24) {
      void loadMoreCollections();
    }
  }, [
    collections.length,
    collectionsHasMore,
    collectionsLoading,
    collectionsLoadingMore,
    createLibraryTab,
    createLibraryView,
    loadMoreCollections,
  ]);
  const handlePreviewPlaylistByUrl = async () => {
    const trimmed = playlistUrlDraft.trim();
    if (!trimmed) {
      setPlaylistPreviewError("請先貼上播放清單連結。");
      return;
    }
    setPlaylistPreviewError(null);
    try {
      await handleFetchPlaylistByUrl(trimmed);
    } catch {
      setPlaylistPreviewError("清單預覽失敗，請確認連結格式。");
    }
  };
  const handleCancelLinkPreview = () => {
    handleResetPlaylist();
    setPlaylistUrlDraft("");
    setPlaylistPreviewError(null);
    lastAutoPreviewUrlRef.current = "";
  };
  useEffect(() => {
    if (createLibraryTab !== "link" || !isLinkSourceActive) return;
    const trimmed = playlistUrlDraft.trim();
    if (!trimmed || trimmed === lastAutoPreviewUrlRef.current) return;
    const timer = window.setTimeout(() => {
      lastAutoPreviewUrlRef.current = trimmed;
      void handleFetchPlaylistByUrl(trimmed).catch(() => {
        setPlaylistPreviewError("清單預覽失敗，請確認連結格式。");
      });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [
    createLibraryTab,
    handleFetchPlaylistByUrl,
    isLinkSourceActive,
    playlistUrlDraft,
  ]);
  const handleActivateLinkSource = () => {
    setRoomCreateSourceMode("link");
    setSelectedCreateCollectionId(null);
    setSelectedCreateYoutubeId(null);
    handleResetPlaylist();
    setPlaylistPreviewError(null);
    lastAutoPreviewUrlRef.current = "";
  };
  const handlePickLinkSource = () => {
    setRoomCreateSourceMode("link");
    setSelectedCreateCollectionId(null);
    setSelectedCreateYoutubeId(null);
    setCreateLeftTab("settings");
  };
  const handlePickYoutubeSource = async (playlistId: string) => {
    setRoomCreateSourceMode("youtube");
    setSelectedCreateYoutubeId(playlistId);
    setSelectedCreateCollectionId(null);
    setCreateLeftTab("settings");
    await importYoutubePlaylist(playlistId);
  };
  const handlePickCollectionSource = async (
    collectionId: string,
    scope: "public" | "owner",
  ) => {
    setRoomCreateSourceMode(scope === "public" ? "publicCollection" : "privateCollection");
    setSelectedCreateCollectionId(collectionId);
    setSelectedCreateYoutubeId(null);
    setCreateLeftTab("settings");
    await loadCollectionItems(collectionId, { force: true });
  };
  const closePasswordDialog = () => {
    setPasswordDialog(null);
    setPasswordDraft("");
  };
  const closeJoinConfirmDialog = () => {
    setJoinConfirmDialog(null);
  };
  const openPasswordDialog = (roomId: string, roomName: string) => {
    setJoinPasswordInput("");
    setPasswordDraft("");
    setPasswordDialog({ roomId, roomName });
  };
  const proceedJoinRoom = (roomId: string, roomName: string, hasPassword: boolean) => {
    if (hasPassword) {
      openPasswordDialog(roomId, roomName);
      return;
    }
    setJoinPasswordInput("");
    handleJoinRoom(roomId, false);
  };
  const openInProgressJoinDialog = (room: RoomSummary) => {
    setJoinConfirmDialog({
      roomId: room.id,
      roomName: room.name,
      hasPassword: room.hasPassword,
      playlistTitle: getRoomPlaylistLabel(room),
      playerCount: room.playerCount,
      maxPlayers: room.maxPlayers,
      questionCount: room.gameSettings?.questionCount,
      currentQuestionNo:
        typeof room.currentQuestionNo === "number" ? room.currentQuestionNo : null,
      completedQuestionCount:
        typeof room.completedQuestionCount === "number"
          ? room.completedQuestionCount
          : undefined,
      totalQuestionCount:
        typeof room.totalQuestionCount === "number"
          ? room.totalQuestionCount
          : room.gameSettings?.questionCount,
    });
  };
  const handleConfirmJoinInProgress = () => {
    if (!joinConfirmDialog) return;
    proceedJoinRoom(
      joinConfirmDialog.roomId,
      joinConfirmDialog.roomName,
      joinConfirmDialog.hasPassword,
    );
    closeJoinConfirmDialog();
  };
  const handleConfirmJoinWithPassword = () => {
    if (!passwordDialog) return;
    const trimmed = passwordDraft.trim();
    if (!trimmed) return;
    if (!/^[a-zA-Z0-9]*$/.test(trimmed)) return;
    setJoinPasswordInput(trimmed);
    handleJoinRoom(passwordDialog.roomId, true, trimmed);
    closePasswordDialog();
  };
  const handleJoinRoomEntry = (room: RoomSummary) => {
    setSelectedJoinRoomId(room.id);
    setDirectRoomIdInput(room.id);
    setDirectJoinNeedsPassword(Boolean(room.hasPassword));
    setDirectJoinError(null);
    if (isRoomCurrentlyPlaying(room)) {
      openInProgressJoinDialog(room);
      return;
    }
    proceedJoinRoom(room.id, room.name || `房間 ${room.id.slice(0, 6)}`, room.hasPassword);
  };
  const handleDirectJoinById = async () => {
    if (directJoinLoading) return;
    const trimmed = directRoomIdInput.trim();
    if (!trimmed) {
      setDirectJoinError("請先輸入房號或房間 ID。");
      setDirectJoinNeedsPassword(false);
      return;
    }
    if (!API_URL) {
      setDirectJoinError("目前無法驗證房間，請稍後再試。");
      return;
    }
    setDirectJoinLoading(true);
    setDirectJoinError(null);
    setDirectJoinNeedsPassword(false);
    try {
      const result = await apiFetchRoomById(API_URL, trimmed);
      const fetchedRoom = (result.payload as { room?: RoomSummary } | null)?.room;
      if (!result.ok || !fetchedRoom) {
        setDirectJoinError("找不到該房間，請確認房號是否正確。");
        return;
      }
      if (isRoomCurrentlyPlaying(fetchedRoom)) {
        openInProgressJoinDialog(fetchedRoom);
        return;
      }
      setSelectedJoinRoomId(fetchedRoom.id);
      setDirectJoinNeedsPassword(Boolean(fetchedRoom.hasPassword));
      proceedJoinRoom(
        fetchedRoom.id,
        fetchedRoom.name || `房間 ${fetchedRoom.id.slice(0, 6)}`,
        fetchedRoom.hasPassword,
      );
    } catch {
      setDirectJoinError("加入失敗，請稍後再試。");
    } finally {
      setDirectJoinLoading(false);
    }
  };
  const handleCollectionGridScroll = (event: UIEvent<HTMLDivElement>) => {
    if (
      collectionsLoading ||
      collectionsLoadingMore ||
      !collectionsHasMore ||
      createLibraryView !== "grid"
    ) {
      return;
    }
    const target = event.currentTarget;
    const remaining = target.scrollHeight - target.scrollTop - target.clientHeight;
    if (remaining <= 180) {
      void loadMoreCollections();
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[84rem] flex-col gap-6 px-4 pb-6 pt-4 text-[var(--mc-text)]">
      {!currentRoom?.id && !username && (
        <section className="relative w-full overflow-hidden rounded-3xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/80 p-5 sm:p-6">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-12 top-0 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -right-14 bottom-0 h-44 w-44 rounded-full bg-amber-400/10 blur-3xl" />
          </div>

          <div className="relative">
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-300/90">
              Room Access
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[var(--mc-text)]">
              選擇進入方式，開始遊戲
            </h2>
            <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
              訪客可快速加入房間，Google 登入可保留收藏、歷史與跨裝置狀態。
            </p>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <article className="rounded-2xl border border-amber-300/30 bg-amber-400/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/90">
                  先試玩
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--mc-text)]">
                  訪客快速進入
                </h3>
                <p className="mt-1 text-xs text-[var(--mc-text-muted)]">
                  設定暱稱即可加入房間，隨時可升級為 Google 登入。
                </p>
                <div className="mt-3 space-y-3">
                  <TextField
                    fullWidth
                    size="small"
                    label="訪客暱稱"
                    value={usernameInput}
                    onChange={(e) =>
                      setUsernameInput(e.target.value.slice(0, USERNAME_MAX))
                    }
                    inputProps={{ maxLength: USERNAME_MAX }}
                  />
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleSetUsername}
                    disabled={!usernameInput.trim()}
                  >
                    以訪客身份繼續
                  </Button>
                </div>
              </article>

              <article className="rounded-2xl border border-cyan-300/35 bg-cyan-500/5 p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/90">
                  推薦登入
                </p>
                <h3 className="mt-2 text-lg font-semibold text-[var(--mc-text)]">
                  Google 登入
                </h3>
                <ul className="mt-2 space-y-1 text-xs text-[var(--mc-text-muted)]">
                  <li>同步收藏與題庫設定</li>
                  <li>保留對戰歷史與回顧</li>
                  <li>跨裝置延續狀態</li>
                </ul>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3 }}
                  onClick={loginWithGoogle}
                  disabled={authLoading}
                >
                  {authLoading ? "登入中..." : "使用 Google 登入"}
                </Button>
              </article>
            </div>

            <div className="mt-4 text-xs text-[var(--mc-text-muted)]">
              先看看玩法？可前往
              <button
                type="button"
                onClick={() => navigate("/")}
                className="ml-1 text-cyan-300 hover:text-cyan-200"
              >
                首頁導覽
              </button>
              。
            </div>
          </div>
        </section>
      )}

      {!currentRoom?.id && username && (
        <section className="w-full">
          <div className="mb-5 rounded-3xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/70 p-4 sm:p-5">
              <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-300/90">
                Quick Guide
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--mc-text)]">
                {username}，選擇你要聚焦的操作
              </h2>
              <p className="mt-1 text-sm text-[var(--mc-text-muted)]">
                先決定「創建」或「加入」，系統會切換成對應的操作面板。
              </p>

              <div className="mt-4 inline-flex w-full gap-1 rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/40 p-1">
                <button
                  type="button"
                  style={{ flexGrow: guideMode === "create" ? 7 : 3 }}
                  className={`cursor-pointer rounded-xl border px-4 py-3 text-left transition-[flex-grow,background-color,border-color,color] duration-220 ease-out ${
                    guideMode === "create"
                      ? "border-cyan-300/55 bg-cyan-500/12 text-cyan-50"
                      : "border-transparent text-[var(--mc-text-muted)] hover:border-cyan-300/45 hover:bg-cyan-500/12 hover:text-cyan-100"
                  }`}
                  onClick={() => setGuideMode("create")}
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/85">
                    Create Focus
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--mc-text)]">
                    創建房間
                  </p>
                  {guideMode === "create" && (
                    <p className="mt-1 text-xs text-[var(--mc-text-muted)]">
                      以題庫挑選為核心，快速完成開房設定。
                    </p>
                  )}
                </button>
                <button
                  type="button"
                  style={{ flexGrow: guideMode === "join" ? 7 : 3 }}
                  className={`cursor-pointer rounded-xl border px-4 py-3 text-left transition-[flex-grow,background-color,border-color,color] duration-220 ease-out ${
                    guideMode === "join"
                      ? "border-amber-300/55 bg-amber-400/12 text-amber-50"
                      : "border-transparent text-[var(--mc-text-muted)] hover:border-amber-300/45 hover:bg-amber-400/12 hover:text-amber-100"
                  }`}
                  onClick={() => setGuideMode("join")}
                >
                  <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/85">
                    Join Focus
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[var(--mc-text)]">
                    加入房間
                  </p>
                  {guideMode === "join" && (
                    <p className="mt-1 text-xs text-[var(--mc-text-muted)]">
                      先輸入房號，再由房間資訊輔助你確認加入。
                    </p>
                  )}
                </button>
              </div>

              <div
                key={guideMode}
                className="mt-4 animate-[guide-panel-enter_280ms_ease-out]"
              >
              {guideMode === "create" ? (
                <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/45 p-3 sm:p-4">
                  <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <aside className="p-2 sm:p-3">
                    <div className="inline-flex w-full gap-1 rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/50 p-1">
                      <button
                        type="button"
                        onClick={() => setCreateLeftTab("library")}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-xs transition ${
                          createLeftTab === "library"
                            ? "bg-cyan-500/20 text-cyan-100"
                            : "text-[var(--mc-text-muted)] hover:bg-cyan-500/10 hover:text-cyan-100"
                        }`}
                      >
                        題庫來源
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!isCreateSourceReady) return;
                          setCreateLeftTab("settings");
                        }}
                        className={`flex-1 rounded-lg px-2 py-1.5 text-xs transition ${
                          createLeftTab === "settings"
                            ? "bg-cyan-500/20 text-cyan-100"
                            : isCreateSourceReady
                              ? "text-[var(--mc-text-muted)] hover:bg-cyan-500/10 hover:text-cyan-100"
                              : "cursor-not-allowed text-slate-500"
                        }`}
                      >
                        房間設置
                      </button>
                    </div>

                    {createLeftTab === "library" ? (
                      <div className="mt-2 flex flex-col gap-2">
                        {[
                          { key: "public", label: "公開收藏庫", icon: <PublicOutlined fontSize="small" /> },
                          { key: "personal", label: "個人收藏庫", icon: <BookmarkBorderRounded fontSize="small" /> },
                          { key: "youtube", label: "從 YouTube 匯入", icon: <PlayCircleOutlineRounded fontSize="small" /> },
                          { key: "link", label: "貼上清單連結", icon: <LinkRounded fontSize="small" /> },
                        ].map((item) => {
                          const key = item.key as
                            | "public"
                            | "personal"
                            | "youtube"
                            | "link";
                          const isActive = createLibraryTab === key;
                          const disabled =
                            !canUseGoogleLibraries && key !== "link";
                          return (
                            <button
                              key={item.key}
                              type="button"
                              aria-disabled={disabled}
                              onClick={() => {
                                if (disabled) return;
                                setCreateLibraryTab(key);
                              }}
                              className={`rounded-xl px-3 py-2 text-left text-sm transition ${
                                disabled
                                  ? "cursor-not-allowed bg-slate-900/40 text-slate-500"
                                  : isActive
                                    ? "cursor-pointer bg-cyan-500/10 text-cyan-100 shadow-[inset_3px_0_0_0_rgba(34,211,238,0.85)]"
                                    : "cursor-pointer bg-[var(--mc-surface)]/35 text-[var(--mc-text)] hover:bg-cyan-500/10 hover:text-cyan-100"
                              }`}
                            >
                              <span className="inline-flex w-full items-center justify-between gap-2">
                                <span className="inline-flex items-center gap-2">
                                <span className="text-cyan-200/90">{item.icon}</span>
                                <span>{item.label}</span>
                                </span>
                                {disabled && (
                                  <Tooltip title="登入即可解鎖此功能" placement="top">
                                    <LockOutlined sx={{ fontSize: 14, color: "#fbbf24" }} />
                                  </Tooltip>
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-2 space-y-2">
                        {selectedSourceSummary ? (
                          <div className="rounded-xl border border-cyan-300/30 bg-cyan-500/8 p-3">
                            <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200/90">
                              {selectedSourceSummary.label}
                            </p>
                            <div className="mt-2 overflow-hidden rounded-lg">
                              {selectedSourceSummary.thumbnail ? (
                                <img
                                  src={selectedSourceSummary.thumbnail}
                                  alt={selectedSourceSummary.title}
                                  className="h-28 w-full scale-[1.08] object-cover [object-position:center_35%]"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="flex h-28 w-full items-center justify-center text-xs text-[var(--mc-text-muted)]">
                                  無縮圖
                                </div>
                              )}
                            </div>
                            <div className="mt-2 min-w-0">
                              <p className="truncate text-sm font-semibold text-[var(--mc-text)]">
                                {selectedSourceSummary.title}
                              </p>
                              <p className="mt-1 text-xs text-[var(--mc-text-muted)]">
                                {selectedSourceSummary.detail}
                              </p>
                            </div>
                            <div className="mt-3 grid gap-2">
                              <p className="text-[11px] font-semibold text-[var(--mc-text-muted)]">
                                未成功匯入原因
                              </p>
                              <div className="rounded-md border border-amber-300/35 bg-amber-300/10 px-2 py-1.5">
                                <p className="text-[11px] font-semibold text-amber-100">
                                  已移除：{playlistIssueSummary.removed.length} 首
                                </p>
                                <p className="mt-1 line-clamp-2 text-[11px] text-amber-100/90">
                                  {playlistIssueSummary.removed.length > 0
                                    ? playlistIssueSummary.removed.join("、")
                                    : "無"}
                                </p>
                              </div>
                              <div className="rounded-md border border-fuchsia-300/35 bg-fuchsia-300/10 px-2 py-1.5">
                                <p className="text-[11px] font-semibold text-fuchsia-100">
                                  隱私限制：{playlistIssueSummary.privateRestricted.length} 首
                                </p>
                                <p className="mt-1 line-clamp-2 text-[11px] text-fuchsia-100/90">
                                  {playlistIssueSummary.privateRestricted.length > 0
                                    ? playlistIssueSummary.privateRestricted.join("、")
                                    : "無"}
                                </p>
                              </div>
                              <div className="rounded-md border border-rose-300/35 bg-rose-300/10 px-2 py-1.5">
                                <p className="text-[11px] font-semibold text-rose-100">
                                  嵌入限制：{playlistIssueSummary.embedBlocked.length} 首
                                </p>
                                <p className="mt-1 line-clamp-2 text-[11px] text-rose-100/90">
                                  {playlistIssueSummary.embedBlocked.length > 0
                                    ? playlistIssueSummary.embedBlocked.join("、")
                                    : "無"}
                                </p>
                              </div>
                              <div className="rounded-md border border-red-300/35 bg-red-300/10 px-2 py-1.5">
                                <p className="text-[11px] font-semibold text-red-100">
                                  其他不可用：
                                  {playlistIssueSummary.unavailable.length +
                                    playlistIssueSummary.unknown.length +
                                    playlistIssueSummary.unknownCount} 首
                                </p>
                                <p className="mt-1 line-clamp-2 text-[11px] text-red-100/90">
                                  {playlistIssueSummary.unavailable.length > 0 ||
                                  playlistIssueSummary.unknown.length > 0
                                    ? [
                                        ...playlistIssueSummary.unavailable,
                                        ...playlistIssueSummary.unknown,
                                      ].join("、")
                                    : playlistIssueSummary.unknownCount > 0
                                      ? `共 ${playlistIssueSummary.unknownCount} 首（後端未提供明細）`
                                      : "無"}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setCreateLeftTab("library")}
                              className="mt-2 text-xs text-cyan-200/90 hover:text-cyan-100"
                            >
                              重新選擇題庫
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-cyan-300/30 bg-cyan-500/5 p-3 text-xs text-cyan-100/90">
                            先在上方選擇題庫來源，載入歌曲後即可切換到房間設置。
                          </div>
                        )}
                      </div>
                    )}
                  </aside>

                  <div className="rounded-2xl bg-[var(--mc-surface)]/25 p-4 lg:border-l lg:border-[var(--mc-border)]/45 lg:rounded-none lg:pl-5">
                    {createLeftTab === "settings" ? (
                      <div className="space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--mc-text-muted)]">
                            房間設置
                          </p>
                          <p className="text-xs text-[var(--mc-text-muted)]">
                            題庫：{playlistItems.length > 0 ? `${playlistItems.length} 首` : "尚未選擇"}
                          </p>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <TextField
                            size="small"
                            fullWidth
                            label="房間名稱"
                            value={roomNameInput}
                            onChange={(event) => setRoomNameInput(event.target.value)}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            select
                            label="可見度"
                            value={roomVisibilityInput}
                            onChange={(event) =>
                              setRoomVisibilityInput(
                                event.target.value as "public" | "private",
                              )
                            }
                          >
                            <MenuItem value="public">公開</MenuItem>
                            <MenuItem value="private">私人</MenuItem>
                          </TextField>
                          <TextField
                            size="small"
                            fullWidth
                            label="房間密碼（私人選填）"
                            value={roomPasswordInput}
                            onChange={(event) => setRoomPasswordInput(event.target.value)}
                            disabled={roomVisibilityInput !== "private"}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            label={`人數上限（${PLAYER_MIN}-${PLAYER_MAX}）`}
                            value={roomMaxPlayersInput}
                            onChange={(event) => setRoomMaxPlayersInput(event.target.value)}
                            error={Boolean(maxPlayersInvalid)}
                            helperText={maxPlayersInvalid ? "人數格式錯誤" : "留空則使用預設"}
                            slotProps={{
                              htmlInput: {
                                min: PLAYER_MIN,
                                max: PLAYER_MAX,
                                inputMode: "numeric",
                              },
                            }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            label={`題數（${questionMin}-${questionMaxLimit}）`}
                            value={questionCount}
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              if (!Number.isFinite(next)) return;
                              updateQuestionCount(next);
                            }}
                            slotProps={{
                              htmlInput: {
                                min: questionMin,
                                max: questionMaxLimit,
                                inputMode: "numeric",
                              },
                            }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            label={`播放秒數（${PLAY_DURATION_MIN}-${PLAY_DURATION_MAX}）`}
                            value={playDurationSec}
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              if (!Number.isFinite(next)) return;
                              updatePlayDurationSec(next);
                            }}
                            slotProps={{
                              htmlInput: {
                                min: PLAY_DURATION_MIN,
                                max: PLAY_DURATION_MAX,
                                inputMode: "numeric",
                              },
                            }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            label={`揭示秒數（${REVEAL_DURATION_MIN}-${REVEAL_DURATION_MAX}）`}
                            value={revealDurationSec}
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              if (!Number.isFinite(next)) return;
                              updateRevealDurationSec(next);
                            }}
                            slotProps={{
                              htmlInput: {
                                min: REVEAL_DURATION_MIN,
                                max: REVEAL_DURATION_MAX,
                                inputMode: "numeric",
                              },
                            }}
                          />
                          <TextField
                            size="small"
                            fullWidth
                            type="number"
                            label={`起始秒數（${START_OFFSET_MIN}-${START_OFFSET_MAX}）`}
                            value={startOffsetSec}
                            onChange={(event) => {
                              const next = Number(event.target.value);
                              if (!Number.isFinite(next)) return;
                              updateStartOffsetSec(next);
                            }}
                            slotProps={{
                              htmlInput: {
                                min: START_OFFSET_MIN,
                                max: START_OFFSET_MAX,
                                inputMode: "numeric",
                              },
                            }}
                          />
                        </div>
                        <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--mc-text-muted)]">
                          <input
                            type="checkbox"
                            className="h-4 w-4"
                            checked={allowCollectionClipTiming}
                            onChange={(event) =>
                              updateAllowCollectionClipTiming(event.target.checked)
                            }
                          />
                          套用收藏庫曲目剪輯時間
                        </label>

                        {createRequirementsHint && (
                          <p className="text-xs text-amber-200">{createRequirementsHint}</p>
                        )}
                        <div>
                          <Button
                            variant="contained"
                            onClick={() => {
                              void handleCreateRoom();
                            }}
                            disabled={!canCreateRoom}
                          >
                            {isCreatingRoom ? "建立中..." : "建立房間"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--mc-text-muted)]">
                              可用題庫預覽
                            </p>
                          </div>
                          <div className="inline-flex items-center gap-1 rounded-full border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/60 p-1">
                            <button
                              type="button"
                              className={`rounded-full px-3 py-1 text-xs ${
                                createLibraryView === "grid"
                                  ? "cursor-pointer bg-cyan-500/20 text-cyan-100"
                                  : "cursor-pointer text-[var(--mc-text-muted)]"
                              }`}
                              onClick={() => setCreateLibraryView("grid")}
                            >
                              圖示
                            </button>
                            <button
                              type="button"
                              className={`rounded-full px-3 py-1 text-xs ${
                                createLibraryView === "list"
                                  ? "cursor-pointer bg-cyan-500/20 text-cyan-100"
                                  : "cursor-pointer text-[var(--mc-text-muted)]"
                              }`}
                              onClick={() => setCreateLibraryView("list")}
                            >
                              清單
                            </button>
                          </div>
                        </div>

                    {!canUseGoogleLibraries && createLibraryTab !== "link" ? (
                      <div className="mt-3 rounded-xl border border-dashed border-slate-600/60 bg-slate-900/40 p-4 text-sm text-slate-300">
                        <div className="mt-1">
                          <Button
                            variant="contained"
                            onClick={loginWithGoogle}
                            disabled={authLoading}
                          >
                            {authLoading ? "登入中..." : "使用 Google 登入"}
                          </Button>
                        </div>
                      </div>
                    ) : createLibraryTab === "link" ? (
                      <div className="mt-3 space-y-3">
                        <div className="flex flex-col gap-2">
                          <TextField
                            fullWidth
                            size="small"
                            label="貼上 YouTube 播放清單連結"
                            value={playlistUrlDraft}
                            disabled={!isLinkSourceActive || linkPreviewLocked}
                            onChange={(event) => {
                              setPlaylistUrlDraft(event.target.value);
                              if (playlistPreviewError) setPlaylistPreviewError(null);
                            }}
                            onKeyDown={(event) => {
                              if (!isLinkSourceActive || linkPreviewLocked) return;
                              if (event.key === "Enter") {
                                event.preventDefault();
                                void handlePreviewPlaylistByUrl();
                              }
                            }}
                            InputProps={{
                              endAdornment: linkPreviewLocked ? (
                                <Tooltip title="取消目前預覽，才能更換連結" placement="top">
                                  <IconButton
                                    size="small"
                                    onClick={handleCancelLinkPreview}
                                    aria-label="取消目前清單預覽"
                                  >
                                    <CloseRounded fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : undefined,
                            }}
                          />
                          <p className="text-xs text-[var(--mc-text-muted)]">
                            {!isLinkSourceActive
                              ? "目前使用其他題庫來源。切換到「貼上連結模式」後，才會載入與預覽此區內容。"
                              : linkPreviewLocked
                                ? "已鎖定目前連結，請點右側取消圖示後再更換。"
                                : "連結貼上後會自動預覽完整清單。"}
                            {playlistLoading ? " 正在更新中..." : ""}
                          </p>
                        </div>
                        {(playlistPreviewError || playlistError) && (
                          <p className="text-xs text-rose-300">
                            {playlistPreviewError || playlistError}
                          </p>
                        )}
                        <div className="rounded-xl border border-cyan-300/25 bg-slate-950/25 p-3">
                          <p className="text-xs text-[var(--mc-text-muted)]">
                            {linkPlaylistTitle
                              ? `預覽清單：${linkPlaylistTitle}`
                              : "貼上連結後可即時看到曲目預覽"}
                          </p>
                          {linkPlaylistPreviewItems.length > 0 ? (
                            <>
                              <div className="mt-2 rounded-lg border border-[var(--mc-border)]/70 bg-slate-950/20">
                                <List<PlaylistPreviewRowProps>
                                  style={{ height: 320, width: "100%" }}
                                  rowCount={linkPlaylistPreviewItems.length}
                                  rowHeight={64}
                                  rowProps={{ items: linkPlaylistPreviewItems }}
                                  rowComponent={PlaylistPreviewRow}
                                />
                              </div>
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                <div className="rounded-lg border border-amber-300/30 bg-amber-300/10 p-2">
                                  <p className="text-xs font-semibold text-amber-100">
                                    已移除歌曲：{linkPlaylistIssueSummary.removed.length}
                                  </p>
                                  <div className="mt-1 max-h-20 overflow-auto text-[11px] text-amber-100/90">
                                    {linkPlaylistIssueSummary.removed.length === 0
                                      ? "無"
                                      : linkPlaylistIssueSummary.removed.join("、")}
                                  </div>
                                </div>
                                <div className="rounded-lg border border-fuchsia-300/30 bg-fuchsia-300/10 p-2">
                                  <p className="text-xs font-semibold text-fuchsia-100">
                                    隱私限制：{linkPlaylistIssueSummary.privateRestricted.length}
                                  </p>
                                  <div className="mt-1 max-h-20 overflow-auto text-[11px] text-fuchsia-100/90">
                                    {linkPlaylistIssueSummary.privateRestricted.length === 0
                                      ? "無"
                                      : linkPlaylistIssueSummary.privateRestricted.join("、")}
                                  </div>
                                </div>
                                <div className="rounded-lg border border-rose-300/30 bg-rose-300/10 p-2">
                                  <p className="text-xs font-semibold text-rose-100">
                                    嵌入限制：{linkPlaylistIssueSummary.embedBlocked.length}
                                  </p>
                                  <div className="mt-1 max-h-20 overflow-auto text-[11px] text-rose-100/90">
                                    {linkPlaylistIssueSummary.embedBlocked.length === 0
                                      ? "無"
                                      : linkPlaylistIssueSummary.embedBlocked.join("、")}
                                  </div>
                                </div>
                                <div className="rounded-lg border border-red-300/30 bg-red-300/10 p-2">
                                  <p className="text-xs font-semibold text-red-100">
                                    其他不可用：
                                    {linkPlaylistIssueSummary.unavailable.length +
                                      linkPlaylistIssueSummary.unknown.length +
                                      linkPlaylistIssueSummary.unknownCount}
                                  </p>
                                  <div className="mt-1 max-h-20 overflow-auto text-[11px] text-red-100/90">
                                    {linkPlaylistIssueSummary.unavailable.length === 0 &&
                                    linkPlaylistIssueSummary.unknown.length === 0
                                      ? linkPlaylistIssueSummary.unknownCount > 0
                                        ? `共 ${linkPlaylistIssueSummary.unknownCount} 首（後端未提供明細）`
                                        : "無"
                                      : [
                                          ...linkPlaylistIssueSummary.unavailable,
                                          ...linkPlaylistIssueSummary.unknown,
                                        ].join("、")}
                                  </div>
                                </div>
                              </div>
                              {isLinkSourceActive &&
                                playlistPreviewMeta &&
                                playlistPreviewMeta.skippedCount > 0 &&
                                !linkPlaylistIssueSummary.exact && (
                                  <p className="mt-2 text-[11px] text-amber-200/90">
                                    後端目前只回傳略過數量，尚未提供逐首明細；待
                                    `skippedItems` 上線後將顯示 100% 精準名單。
                                  </p>
                                )}
                            </>
                          ) : (
                            <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
                              {!isLinkSourceActive
                                ? "目前尚未啟用貼上連結模式。"
                                : "目前尚無可預覽的清單內容。"}
                            </p>
                          )}
                          <div className="mt-3">
                            {!isLinkSourceActive ? (
                              <Button
                                variant="outlined"
                                onClick={handleActivateLinkSource}
                              >
                                切換到貼上連結模式
                              </Button>
                            ) : (
                              <Button
                                variant="contained"
                                onClick={handlePickLinkSource}
                                disabled={playlistItems.length === 0}
                              >
                                使用這份清單做為創房題庫
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : createLibraryTab === "youtube" ? (
                        <div className="mt-3">
                          {youtubePlaylistsLoading ? (
                            <div
                              className={
                                createLibraryView === "grid"
                                  ? "grid gap-2 sm:grid-cols-2"
                                  : "space-y-2"
                              }
                            >
                              {Array.from({ length: createLibraryView === "grid" ? 6 : 4 }).map((_, idx) =>
                                renderYoutubeSkeletonCard(idx, createLibraryView),
                              )}
                            </div>
                          ) : youtubePlaylists.length === 0 ? (
                            <p className="text-sm text-[var(--mc-text-muted)]">
                            目前沒有可用清單，先到收藏建立頁匯入。
                          </p>
                        ) : (
                          <div className="rounded-xl border border-[var(--mc-border)]/70 bg-slate-950/18 p-2">
                            {createLibraryView === "grid" ? (
                              <div className="max-h-[640px] overflow-y-auto pr-1">
                                <div
                                  className="grid gap-2"
                                  style={{
                                    gridTemplateColumns: `repeat(${createLibraryColumns}, minmax(0, 1fr))`,
                                  }}
                                >
                                  {youtubePlaylists.map((playlist, index) =>
                                    renderYoutubeCard(playlist, index, "grid"),
                                  )}
                                </div>
                              </div>
                            ) : (
                              <List<VirtualLibraryListRowProps>
                                style={{ height: youtubeListHeight, width: "100%" }}
                                rowCount={youtubePlaylists.length}
                                rowHeight={youtubeListRowHeight}
                                rowProps={{
                                  items: youtubePlaylists,
                                  renderItem: renderYoutubeCard,
                                }}
                                rowComponent={VirtualLibraryListRow}
                              />
                            )}
                          </div>
                          )}
                        </div>
                    ) : (
                      <div className="mt-3">
                        {collectionsLoading ? (
                          <div
                            className={
                              createLibraryView === "grid"
                                ? "grid gap-2 sm:grid-cols-2"
                                : "space-y-2"
                            }
                          >
                            {Array.from({ length: createLibraryView === "grid" ? 6 : 4 }).map(
                              (_, idx) => renderCollectionSkeletonCard(idx, createLibraryView),
                            )}
                          </div>
                        ) : collectionsError ? (
                          <p className="text-sm text-rose-300">{collectionsError}</p>
                        ) : collections.length === 0 ? (
                          <p className="text-sm text-[var(--mc-text-muted)]">
                            目前沒有可用題庫，先使用推薦題庫快速開局。
                          </p>
                        ) : (
                          <div className="rounded-xl border border-[var(--mc-border)]/70 bg-slate-950/18 p-2">
                            {createLibraryView === "grid" ? (
                              <div
                                ref={createLibraryScrollRef}
                                className="max-h-[640px] overflow-y-auto pr-1"
                                onScroll={handleCollectionGridScroll}
                              >
                                <div
                                  className="grid gap-2"
                                  style={{
                                    gridTemplateColumns: `repeat(${createLibraryColumns}, minmax(0, 1fr))`,
                                  }}
                                >
                                  {collections.map((collection, index) =>
                                    renderCollectionCard(collection, index, "grid"),
                                  )}
                                  {collectionsLoadingMore
                                    ? Array.from({ length: createLibraryColumns }).map((_, idx) =>
                                        renderCollectionSkeletonCard(idx + 1000, "grid"),
                                      )
                                    : null}
                                </div>
                              </div>
                            ) : (
                              <List<VirtualLibraryListRowProps>
                                style={{ height: collectionListHeight, width: "100%" }}
                                rowCount={collectionListRowCount}
                                rowHeight={collectionListRowHeight}
                                rowProps={{
                                  items: collections,
                                  renderItem: renderCollectionCard,
                                  hasMore: collectionsHasMore,
                                  isLoadingMore: collectionsLoadingMore,
                                  onLoadMore: () => {
                                    void loadMoreCollections();
                                  },
                                  renderLoader: () => (
                                    <div className="space-y-2">
                                      {renderCollectionSkeletonCard(1000, "list")}
                                    </div>
                                  ),
                                }}
                                rowComponent={VirtualLibraryListRow}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                      </>
                    )}
                  </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-amber-300/30 bg-amber-400/5 p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/90">
                      Room ID
                    </p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <TextField
                        size="small"
                        fullWidth
                        label="輸入房間 ID"
                        value={directRoomIdInput}
                        onChange={(e) => {
                          const next = e.target.value;
                          setDirectRoomIdInput(next);
                          setDirectJoinError(null);
                          const matched = filteredJoinRooms.find(
                            (room) => room.id === next.trim(),
                          );
                          setDirectJoinNeedsPassword(Boolean(matched?.hasPassword));
                          if (matched) setSelectedJoinRoomId(matched.id);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            void handleDirectJoinById();
                          }
                        }}
                      />
                      <Button
                        variant="outlined"
                        onClick={handleDirectJoinById}
                        disabled={directJoinLoading}
                      >
                        {directJoinLoading ? "確認中..." : "查詢並加入"}
                      </Button>
                    </div>
                    {directJoinNeedsPassword && (
                      <p className="mt-2 text-xs text-amber-200">
                        此房間需要密碼，送出後會請你輸入密碼。
                      </p>
                    )}
                    {directJoinError && (
                      <p className="mt-2 text-xs text-rose-300">{directJoinError}</p>
                    )}
                  </div>

                  <div className="grid gap-3 lg:grid-cols-[0.92fr_1.08fr]">
                    <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/45 p-4">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--mc-text-muted)]">
                        篩選與排序
                      </p>
                      <div className="mt-3 space-y-3">
                        <div>
                          <p className="text-xs text-[var(--mc-text-muted)]">
                            密碼需求
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {[
                              { key: "all", label: "全部" },
                              { key: "no_password", label: "免密碼" },
                              { key: "password_required", label: "需密碼" },
                            ].map((item) => (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() =>
                                  setJoinPasswordFilter(
                                    item.key as
                                      | "all"
                                      | "no_password"
                                      | "password_required",
                                  )
                                }
                                className={`rounded-full border px-3 py-1 text-xs transition ${
                                  joinPasswordFilter === item.key
                                    ? "border-amber-300/60 bg-amber-300/15 text-amber-100"
                                    : "border-[var(--mc-border)] text-[var(--mc-text-muted)] hover:text-[var(--mc-text)]"
                                }`}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs text-[var(--mc-text-muted)]">房間排序</p>
                          <div className="mt-1 inline-flex overflow-hidden rounded-full border border-[var(--mc-border)]">
                            <button
                              type="button"
                              className={`px-3 py-1 text-xs transition ${
                                joinSortMode === "latest"
                                  ? "bg-amber-400/15 text-amber-100"
                                  : "text-[var(--mc-text-muted)]"
                              }`}
                              onClick={() => setJoinSortMode("latest")}
                            >
                              最新建立
                            </button>
                            <button
                              type="button"
                              className={`px-3 py-1 text-xs transition ${
                                joinSortMode === "players_desc"
                                  ? "bg-amber-400/15 text-amber-100"
                                  : "text-[var(--mc-text-muted)]"
                              }`}
                              onClick={() => setJoinSortMode("players_desc")}
                            >
                              玩家數優先
                            </button>
                          </div>
                        </div>

                        <div className="rounded-xl border border-dashed border-[var(--mc-border)] p-3 text-xs text-[var(--mc-text-muted)]">
                          題庫/題庫類型篩選（規劃中）：未來可依曲風、題庫來源快速篩選房間。
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-[var(--mc-border)] bg-slate-950/20 p-3">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--mc-text-muted)]">
                          Room Detail
                        </p>
                        {joinPreviewRoom ? (
                          <div className="mt-2 space-y-2 text-sm">
                            <p className="text-lg font-semibold text-[var(--mc-text)]">
                              {joinPreviewRoom.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-2 py-0.5 text-[11px] ${
                                  isRoomCurrentlyPlaying(joinPreviewRoom)
                                    ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
                                    : "border-slate-300/20 bg-slate-400/10 text-slate-200"
                                }`}
                              >
                                {getRoomStatusLabel(joinPreviewRoom)}
                              </span>
                              <span className="rounded-full border border-[var(--mc-border)] px-2 py-0.5 text-[11px] text-[var(--mc-text-muted)]">
                                {joinPreviewRoom.hasPassword ? "需密碼" : "免密碼"}
                              </span>
                            </div>
                            <p className="text-[var(--mc-text-muted)]">
                              ID：{joinPreviewRoom.id}
                            </p>
                            <p className="text-[var(--mc-text-muted)]">
                              玩家 {joinPreviewRoom.playerCount}
                              {joinPreviewRoom.maxPlayers
                                ? `/${joinPreviewRoom.maxPlayers}`
                                : ""}
                            </p>
                            <p className="text-[var(--mc-text-muted)]">
                              題數 {joinPreviewRoom.gameSettings?.questionCount ?? "-"} ·
                              題庫 {getRoomPlaylistLabel(joinPreviewRoom)}
                            </p>
                            <div className="pt-1">
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleJoinRoomEntry(joinPreviewRoom)}
                              >
                                直接加入
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-[var(--mc-text-muted)]">
                            尚未選擇房間，可從右側列表挑選或輸入 ID。
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/45 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--mc-text-muted)]">
                          Rooms Browser
                        </p>
                        <div className="inline-flex items-center gap-1 rounded-full border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/60 p-1">
                          <button
                            type="button"
                          className={`rounded-full px-3 py-1 text-xs ${
                            joinRoomsView === "list"
                              ? "cursor-pointer bg-amber-500/20 text-amber-100"
                              : "cursor-pointer text-[var(--mc-text-muted)]"
                          }`}
                            onClick={() => setJoinRoomsView("list")}
                          >
                            清單
                          </button>
                          <button
                            type="button"
                          className={`rounded-full px-3 py-1 text-xs ${
                            joinRoomsView === "grid"
                              ? "cursor-pointer bg-amber-500/20 text-amber-100"
                              : "cursor-pointer text-[var(--mc-text-muted)]"
                          }`}
                            onClick={() => setJoinRoomsView("grid")}
                          >
                            圖示
                          </button>
                        </div>
                      </div>

                      {filteredJoinRooms.length === 0 ? (
                        <p className="mt-3 text-sm text-[var(--mc-text-muted)]">
                          目前沒有符合條件的房間。
                        </p>
                      ) : (
                        <div
                          className={`mt-3 ${
                            joinRoomsView === "grid"
                              ? "grid gap-2 sm:grid-cols-2"
                              : "space-y-2"
                          }`}
                        >
                          {filteredJoinRooms.slice(0, 12).map((room) => (
                            <div
                              key={room.id}
                              className={`rounded-xl border px-3 py-3 transition ${
                                selectedJoinRoomId === room.id
                                  ? "border-amber-300/55 bg-amber-300/12"
                                  : "border-[var(--mc-border)] bg-slate-950/25 hover:border-amber-300/35"
                              }`}
                            >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedJoinRoomId(room.id);
                                    setDirectRoomIdInput(room.id);
                                    setDirectJoinNeedsPassword(Boolean(room.hasPassword));
                                    setDirectJoinError(null);
                                  }}
                                  className="w-full text-left"
                                >
                                {joinRoomsView === "grid" ? (
                                  <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[var(--mc-text)]">
                                          {room.name}
                                        </p>
                                        <p className="mt-1 text-xs text-[var(--mc-text-muted)]">
                                          {room.playerCount}
                                          {room.maxPlayers ? `/${room.maxPlayers}` : ""} 人
                                        </p>
                                      </div>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleJoinRoomEntry(room);
                                        }}
                                      >
                                        加入
                                      </Button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                      <span
                                        className={`rounded-full border px-2 py-0.5 ${
                                          isRoomCurrentlyPlaying(room)
                                            ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
                                            : "border-slate-300/20 bg-slate-400/10 text-slate-200"
                                        }`}
                                      >
                                        {getRoomStatusLabel(room)}
                                      </span>
                                      <span className="rounded-full border border-[var(--mc-border)] px-2 py-0.5 text-[var(--mc-text-muted)]">
                                        {room.hasPassword ? "需密碼" : "免密碼"}
                                      </span>
                                    </div>
                                    <p className="truncate text-xs text-[var(--mc-text-muted)]">
                                      題庫：{getRoomPlaylistLabel(room)}
                                    </p>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex flex-wrap items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-[var(--mc-text)]">
                                          {room.name}
                                        </p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px]">
                                          <span
                                            className={`rounded-full border px-2 py-0.5 ${
                                              isRoomCurrentlyPlaying(room)
                                                ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
                                                : "border-slate-300/20 bg-slate-400/10 text-slate-200"
                                            }`}
                                          >
                                            {getRoomStatusLabel(room)}
                                          </span>
                                          <span className="rounded-full border border-[var(--mc-border)] px-2 py-0.5 text-[var(--mc-text-muted)]">
                                            {room.hasPassword ? "需密碼" : "免密碼"}
                                          </span>
                                        </div>
                                      </div>
                                      <Button
                                        variant="contained"
                                        size="small"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleJoinRoomEntry(room);
                                        }}
                                      >
                                        加入
                                      </Button>
                                    </div>
                                    <p className="mt-2 text-xs text-[var(--mc-text-muted)]">
                                      {room.playerCount}
                                      {room.maxPlayers ? `/${room.maxPlayers}` : ""} 人 ·
                                      題數 {room.gameSettings?.questionCount ?? "-"}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-[var(--mc-text-muted)]">
                                      題庫：{getRoomPlaylistLabel(room)}
                                    </p>
                                  </>
                                )}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              </div>

            </div>

          <style>
            {`
              @keyframes guide-panel-enter {
                0% { opacity: 0; transform: translateY(8px) scale(0.995); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
              }
              @keyframes skeleton-breathe {
                0% {
                  opacity: 0.52;
                  transform: scale(1);
                  filter: saturate(0.92);
                }
                50% {
                  opacity: 0.92;
                  transform: scale(1.015);
                  filter: saturate(1.08);
                }
                100% {
                  opacity: 0.58;
                  transform: scale(1);
                  filter: saturate(0.96);
                }
              }
              @keyframes skeleton-sheen {
                0% {
                  transform: translate3d(0, 0, 0) skewX(-22deg);
                  opacity: 0;
                }
                12% {
                  opacity: 0.28;
                }
                48% {
                  opacity: 0.82;
                }
                100% {
                  transform: translate3d(320%, 0, 0) skewX(-22deg);
                  opacity: 0;
                }
              }
            `}
          </style>

          <Dialog
            open={Boolean(joinConfirmDialog)}
            onClose={closeJoinConfirmDialog}
            fullWidth
            maxWidth="xs"
          >
            <DialogTitle>此對戰已進行中</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ mb: 1.5, color: "text.secondary" }}>
                {joinConfirmDialog
                  ? `房間「${joinConfirmDialog.roomName}」目前已開始遊戲。加入後會從目前進度開始參與。`
                  : ""}
              </Typography>
              {joinConfirmDialog && (
                <div className="space-y-1">
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                    玩家 {joinConfirmDialog.playerCount}
                    {joinConfirmDialog.maxPlayers
                      ? `/${joinConfirmDialog.maxPlayers}`
                      : ""}
                    {typeof joinConfirmDialog.questionCount === "number"
                      ? ` · 本局題數 ${joinConfirmDialog.questionCount}`
                      : ""}
                  </Typography>
                  <Typography variant="caption" sx={{ display: "block", color: "text.secondary" }}>
                    題庫 {joinConfirmDialog.playlistTitle}
                  </Typography>
                  {(typeof joinConfirmDialog.currentQuestionNo === "number" ||
                    typeof joinConfirmDialog.completedQuestionCount === "number") && (
                    <Typography variant="caption" sx={{ display: "block", color: "warning.main" }}>
                      {typeof joinConfirmDialog.currentQuestionNo === "number"
                        ? `目前第 ${joinConfirmDialog.currentQuestionNo} 題`
                        : "對戰進行中"}
                      {typeof joinConfirmDialog.completedQuestionCount === "number"
                        ? `（已完成 ${joinConfirmDialog.completedQuestionCount} 題${
                          typeof joinConfirmDialog.totalQuestionCount === "number"
                            ? ` / 共 ${joinConfirmDialog.totalQuestionCount} 題`
                            : ""
                        }）`
                        : ""}
                    </Typography>
                  )}
                </div>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeJoinConfirmDialog}>取消</Button>
              <Button variant="contained" color="warning" onClick={handleConfirmJoinInProgress}>
                仍要加入
              </Button>
            </DialogActions>
          </Dialog>

          <Dialog
            open={Boolean(passwordDialog)}
            onClose={closePasswordDialog}
            fullWidth
            maxWidth="xs"
          >
            <DialogTitle>輸入房間密碼</DialogTitle>
            <DialogContent>
              <Typography
                variant="body2"
                sx={{ mb: 1.5, color: "text.secondary" }}
              >
                {passwordDialog
                  ? `房間「${passwordDialog.roomName}」需要密碼才能加入。`
                  : ""}
              </Typography>
              <TextField
                autoFocus
                fullWidth
                size="small"
                label="房間密碼"
                value={passwordDraft}
                onChange={(e) => {
                  const next = e.target.value;
                  if (!/^[a-zA-Z0-9]*$/.test(next)) return;
                  setPasswordDraft(next);
                }}
                inputProps={{
                  inputMode: "text",
                  pattern: "[A-Za-z0-9]*",
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={closePasswordDialog}>取消</Button>
              <Button
                variant="contained"
                onClick={handleConfirmJoinWithPassword}
                disabled={!passwordDraft.trim()}
              >
                進入
              </Button>
            </DialogActions>
          </Dialog>
        </section>
      )}
    </div>
  );
};

export default RoomListPage;

