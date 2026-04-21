import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BarChartRounded,
  CloseRounded,
  EmojiEventsRounded,
  LockOutlined,
  PlayArrowRounded,
  PublicOutlined,
  QuizRounded,
  StarBorderRounded,
  StarRounded,
  // TimelineRounded,
} from "@mui/icons-material";
import { Button, Drawer, IconButton, useMediaQuery } from "@mui/material";
import { List, type RowComponentProps } from "react-window";

import { API_URL } from "@domain/room/constants";
import {
  apiFetchCollectionItemPreview,
  type CollectionItemPreviewRecord,
} from "@features/CollectionContent/model/collectionContentApi";
import { useAuth } from "@shared/auth/AuthContext";
import { ensureFreshAuthToken } from "@shared/auth/token";
import { useTransientScrollbar } from "@shared/hooks/useTransientScrollbar";

type CollectionDetail = {
  id: string;
  title: string;
  description?: string | null;
  visibility?: "private" | "public" | string | null;
  cover_title?: string | null;
  cover_channel_title?: string | null;
  cover_thumbnail_url?: string | null;
  cover_duration_sec?: number | null;
  cover_source_id?: string | null;
  cover_provider?: string | null;
  item_count?: number | null;
  use_count?: number | null;
  favorite_count?: number | null;
  is_favorited?: boolean | null;
  ai_edited_count?: number | null;
  has_ai_edited?: boolean | null;
};

type CollectionDetailDrawerProps = {
  open: boolean;
  collection: CollectionDetail | null;
  isPublicLibraryTab: boolean;
  isApplying?: boolean;
  isFavoriteUpdating?: boolean;
  onClose: () => void;
  onUseCollection: (collectionId: string) => void | Promise<void>;
  onToggleFavorite?: () => void | Promise<void | boolean>;
  formatDurationLabel: (value: number) => string | null;
};

const leaderboardPreview = [
  {
    rank: 1,
    name: "Mika",
    score: "98,420",
    accuracy: "97%",
    rounds: "42 局",
    tone: "text-amber-200",
    badgeClassName: "bg-amber-300/16 border-amber-200/28",
  },
  {
    rank: 2,
    name: "Rin",
    score: "91,880",
    accuracy: "94%",
    rounds: "36 局",
    tone: "text-slate-100",
    badgeClassName: "bg-slate-200/12 border-slate-100/20",
  },
  {
    rank: 3,
    name: "Yuki",
    score: "87,120",
    accuracy: "91%",
    rounds: "31 局",
    tone: "text-orange-200",
    badgeClassName: "bg-orange-300/14 border-orange-200/24",
  },
  {
    rank: 4,
    name: "Nana",
    score: "79,540",
    accuracy: "88%",
    rounds: "28 局",
    tone: "text-cyan-100",
    badgeClassName: "bg-cyan-300/10 border-cyan-100/16",
  },
  {
    rank: 5,
    name: "Kai",
    score: "74,310",
    accuracy: "86%",
    rounds: "25 局",
    tone: "text-cyan-100",
    badgeClassName: "bg-cyan-300/10 border-cyan-100/16",
  },
];

const COLLECTION_PREVIEW_PAGE_SIZE = 12;
const COLLECTION_PREVIEW_ROW_HEIGHT = 73;

type CollectionPreviewListRowProps = {
  items: CollectionItemPreviewRecord[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  formatDurationLabel: (value: number) => string | null;
};

const CollectionPreviewLoadingRow = ({ index }: { index: number }) => (
  <div className="flex h-full items-center gap-3 border-b border-white/8 px-2 py-3 last:border-b-0 sm:px-3">
    <div className="h-10 w-16 shrink-0 rounded-lg bg-white/8" />
    <div className="min-w-0 flex-1 space-y-2">
      <div
        className="h-3 rounded-full bg-white/10"
        style={{ width: `${72 - (index % 5) * 7}%` }}
      />
      <div
        className="h-2.5 rounded-full bg-white/6"
        style={{ width: `${40 + (index % 5) * 5}%` }}
      />
    </div>
    <span className="shrink-0 text-xs font-medium text-slate-500">
      #{index + 1}
    </span>
  </div>
);

const CollectionPreviewListRow = ({
  index,
  style,
  items,
  hasMore,
  isLoadingMore,
  onLoadMore,
  formatDurationLabel,
}: RowComponentProps<CollectionPreviewListRowProps>) => {
  const item = items[index];
  const isLoaderRow = !item && (hasMore || isLoadingMore);

  useEffect(() => {
    if (!isLoaderRow || !hasMore || isLoadingMore) return;
    onLoadMore();
  }, [hasMore, isLoaderRow, isLoadingMore, onLoadMore]);

  if (isLoaderRow) {
    return (
      <div style={style}>
        <CollectionPreviewLoadingRow index={index} />
      </div>
    );
  }

  if (!item) return <div style={style} />;

  const thumbnail =
    item.thumbnail_url ||
    (item.provider === "youtube" && item.source_id
      ? `https://i.ytimg.com/vi/${item.source_id}/hqdefault.jpg`
      : "");
  const duration =
    typeof item.duration_sec === "number"
      ? formatDurationLabel(item.duration_sec)
      : null;

  return (
    <div style={style}>
      <div className="flex h-full items-center gap-3 border-b border-white/8 px-2 py-3 last:border-b-0 sm:px-3">
        <div className="h-12 w-[72px] shrink-0 overflow-hidden rounded-lg bg-slate-900/80">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={item.title || `題目 ${index + 1}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">
              無封面
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-100">
            {item.title || `題目 ${index + 1}`}
          </p>
          <p className="mt-1 truncate text-xs text-slate-400">
            {item.channel_title || "未知上傳者"}
            {duration ? ` · ${duration}` : ""}
          </p>
        </div>
        <span className="hidden shrink-0 text-xs font-medium text-cyan-100/70 sm:inline">
          #{index + 1}
        </span>
      </div>
    </div>
  );
};

const CollectionDetailDrawer = ({
  open,
  collection,
  isPublicLibraryTab,
  isApplying = false,
  isFavoriteUpdating = false,
  onClose,
  onUseCollection,
  onToggleFavorite,
  formatDurationLabel,
}: CollectionDetailDrawerProps) => {
  const { authToken, refreshAuthToken } = useAuth();
  const isCompact = useMediaQuery("(max-width:767px)");
  const [previewItems, setPreviewItems] = useState<
    CollectionItemPreviewRecord[]
  >([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewLoadingMore, setPreviewLoadingMore] = useState(false);
  const [previewPage, setPreviewPage] = useState(1);
  const [previewHasMore, setPreviewHasMore] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const previewRequestIdRef = useRef(0);
  const { transientScrollbarClassName, revealScrollbar } =
    useTransientScrollbar();
  const previewThumbnail =
    collection?.cover_thumbnail_url ||
    (collection?.cover_provider === "youtube" && collection.cover_source_id
      ? `https://i.ytimg.com/vi/${collection.cover_source_id}/hqdefault.jpg`
      : "");
  const isPublic = (collection?.visibility ?? "private") === "public";
  const isFavorited = Boolean(collection?.is_favorited);
  const stats: Array<{
    key: string;
    label: string;
    value: string;
    icon: ReactNode;
  }> = [
    {
      key: "questions",
      label: "題數",
      value:
        typeof collection?.item_count === "number"
          ? `${Math.max(0, collection.item_count)} 題`
          : "未提供",
      icon: <QuizRounded sx={{ fontSize: 19 }} />,
    },
    {
      key: "plays",
      label: "使用",
      value:
        typeof collection?.use_count === "number"
          ? `${Math.max(0, collection.use_count)} 次`
          : "尚無資料",
      icon: <BarChartRounded sx={{ fontSize: 20 }} />,
    },
    {
      key: "favorites",
      label: "收藏",
      value:
        typeof collection?.favorite_count === "number"
          ? `${Math.max(0, collection.favorite_count)}`
          : "尚無資料",
      icon: isFavorited ? (
        <StarRounded sx={{ fontSize: 19 }} />
      ) : (
        <StarBorderRounded sx={{ fontSize: 19 }} />
      ),
    },
  ];

  const handleUseCollection = () => {
    if (!collection) return;
    void onUseCollection(collection.id);
  };

  const fetchPreviewPage = useCallback(
    async (page: number, mode: "replace" | "append") => {
      if (!collection?.id || !API_URL) return;

      const requestId = previewRequestIdRef.current + 1;
      previewRequestIdRef.current = requestId;
      if (mode === "append") {
        setPreviewLoadingMore(true);
      } else {
        setPreviewLoading(true);
        setPreviewItems([]);
      }
      setPreviewError(null);

      try {
        const token = await ensureFreshAuthToken({
          token: authToken,
          refreshAuthToken,
          leewayMs: 60_000,
        });
        const result = await apiFetchCollectionItemPreview(
          API_URL,
          token,
          collection.id,
          {
            page,
            pageSize: COLLECTION_PREVIEW_PAGE_SIZE,
          },
        );
        if (requestId !== previewRequestIdRef.current) return;
        if (!result.ok) {
          const message =
            typeof result.payload?.error === "string"
              ? result.payload.error
              : "題庫內容預覽載入失敗";
          setPreviewError(message);
          if (mode === "replace") {
            setPreviewItems([]);
          }
          return;
        }

        const data = result.payload?.data;
        const nextItems = data?.items ?? [];
        setPreviewItems((currentItems) => {
          if (mode === "replace") return nextItems;
          const existingIds = new Set(currentItems.map((item) => item.id));
          return [
            ...currentItems,
            ...nextItems.filter((item) => !existingIds.has(item.id)),
          ];
        });
        setPreviewPage(data?.page ?? page);
        setPreviewHasMore(Boolean(data?.hasMore));
      } catch (error) {
        if (requestId !== previewRequestIdRef.current) return;
        setPreviewError(
          error instanceof Error ? error.message : "題庫內容預覽載入失敗",
        );
        if (mode === "replace") {
          setPreviewItems([]);
        }
      } finally {
        if (requestId === previewRequestIdRef.current) {
          setPreviewLoading(false);
          setPreviewLoadingMore(false);
        }
      }
    },
    [authToken, collection?.id, refreshAuthToken],
  );

  const handleLoadMorePreviewItems = useCallback(() => {
    if (previewLoading || previewLoadingMore || !previewHasMore) return;
    void fetchPreviewPage(previewPage + 1, "append");
  }, [
    fetchPreviewPage,
    previewHasMore,
    previewLoading,
    previewLoadingMore,
    previewPage,
  ]);

  const previewRowCount =
    previewItems.length + (previewHasMore || previewLoadingMore ? 1 : 0);
  const previewListHeight = Math.min(
    430,
    Math.max(180, previewRowCount * COLLECTION_PREVIEW_ROW_HEIGHT),
  );
  const previewListRowProps = useMemo<CollectionPreviewListRowProps>(
    () => ({
      items: previewItems,
      hasMore: previewHasMore,
      isLoadingMore: previewLoadingMore,
      onLoadMore: handleLoadMorePreviewItems,
      formatDurationLabel,
    }),
    [
      formatDurationLabel,
      handleLoadMorePreviewItems,
      previewHasMore,
      previewItems,
      previewLoadingMore,
    ],
  );

  const handlePreviewListScroll = useCallback(() => {
    revealScrollbar();
  }, [revealScrollbar]);

  useEffect(() => {
    if (!open || !collection?.id || !API_URL) {
      setPreviewItems([]);
      setPreviewError(null);
      setPreviewLoading(false);
      setPreviewLoadingMore(false);
      setPreviewPage(1);
      setPreviewHasMore(false);
      return;
    }

    setPreviewPage(1);
    setPreviewHasMore(false);
    void fetchPreviewPage(1, "replace");

    return () => {
      previewRequestIdRef.current += 1;
    };
  }, [collection?.id, fetchPreviewPage, open]);

  return (
    <Drawer
      anchor={isCompact ? "bottom" : "right"}
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            width: isCompact ? "100%" : "min(1180px, 94vw)",
            height: isCompact ? "100dvh" : "100%",
            maxHeight: "100dvh",
            borderTopLeftRadius: isCompact ? 0 : 24,
            borderBottomLeftRadius: isCompact ? 0 : 24,
            background:
              "linear-gradient(180deg, rgba(8,15,28,0.98), rgba(2,6,23,0.98))",
            borderLeft: isCompact ? 0 : "1px solid rgba(103,232,249,0.18)",
            color: "var(--mc-text)",
            boxShadow: "0 24px 70px rgba(2,6,23,0.72)",
            overflow: "hidden",
          },
        },
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-cyan-300/12 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 className="mt-1 truncate text-lg font-semibold text-slate-50 sm:text-xl">
              {collection?.title ?? "收藏庫"}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-xs font-medium text-slate-400 sm:inline">
              Esc 關閉
            </span>
            <IconButton
              aria-label="關閉題庫詳情，或按 Esc"
              onClick={onClose}
              className="!text-slate-100 hover:!bg-white/8"
            >
              <CloseRounded />
            </IconButton>
          </div>
        </header>

        {collection ? (
          <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden md:grid-cols-[minmax(360px,0.8fr)_minmax(460px,1.2fr)] md:grid-rows-none">
            <main className="min-h-0 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <section className="overflow-hidden rounded-[20px] border border-cyan-300/14 bg-slate-950/44 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="relative aspect-[16/5] min-h-28 overflow-hidden bg-slate-900/80 sm:min-h-32">
                  {previewThumbnail ? (
                    <img
                      src={previewThumbnail}
                      alt={collection.cover_title ?? collection.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                      無封面
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.08)_0%,rgba(2,6,23,0.18)_42%,rgba(2,6,23,0.88)_100%)]" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <div className="mb-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-slate-950/56 px-2.5 py-1 text-xs font-medium text-slate-100 backdrop-blur">
                        {isPublic ? (
                          <PublicOutlined sx={{ fontSize: 14 }} />
                        ) : (
                          <LockOutlined sx={{ fontSize: 14 }} />
                        )}
                        {isPublic ? "公開收藏庫" : "私人收藏庫"}
                      </span>
                      {/* {collection.has_ai_edited ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/16 bg-teal-400/10 px-2.5 py-1 text-xs font-medium text-teal-100">
                          <TimelineRounded sx={{ fontSize: 14 }} />
                          已調整片段
                        </span>
                      ) : null} */}
                    </div>
                    <p className="line-clamp-2 text-xl font-semibold leading-tight text-white sm:text-2xl">
                      {collection.title}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-2 border-b border-white/8 px-4 py-2.5">
                  {stats.map((item) => (
                    <div
                      key={item.key}
                      className="inline-flex min-w-0 items-center gap-2 text-sm"
                    >
                      <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-300/8 text-cyan-100">
                        {item.icon}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">
                        {item.label}
                      </span>
                      <span className="truncate font-semibold text-slate-50">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="px-4 py-3">
                  <p className="text-xs font-semibold tracking-[0.16em] text-cyan-100/60">
                    DESCRIPTION
                  </p>
                  <p
                    className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${
                      collection.description
                        ? "text-slate-300"
                        : "text-slate-500"
                    }`}
                  >
                    {collection.description || "這個題庫尚未提供描述。"}
                  </p>
                </div>
              </section>

              <section className="mt-1 px-1">
                <div className="overflow-hidden rounded-xl bg-slate-950/22">
                  {previewLoading ? (
                    <div>
                      {Array.from({ length: 5 }).map((_, index) => (
                        <CollectionPreviewLoadingRow
                          key={`collection-preview-loading-${index}`}
                          index={index}
                        />
                      ))}
                    </div>
                  ) : previewError ? (
                    <div className="px-2 py-6 text-sm text-rose-200 sm:px-3">
                      {previewError}
                    </div>
                  ) : previewItems.length === 0 ? (
                    <div className="px-2 py-6 text-sm text-slate-400 sm:px-3">
                      這個題庫目前沒有可預覽的題目。
                    </div>
                  ) : (
                    <List<CollectionPreviewListRowProps>
                      className={`transient-scrollbar ${transientScrollbarClassName}`}
                      style={{
                        height: previewListHeight,
                        width: "100%",
                      }}
                      rowCount={previewRowCount}
                      rowHeight={COLLECTION_PREVIEW_ROW_HEIGHT}
                      rowProps={previewListRowProps}
                      rowComponent={CollectionPreviewListRow}
                      onScroll={handlePreviewListScroll}
                    />
                  )}
                </div>
              </section>
            </main>

            <aside className="min-h-0 border-t border-cyan-300/12 bg-slate-950/36 p-4 md:border-l md:border-t-0 md:p-5">
              <div className="flex h-full min-h-0 flex-col rounded-2xl border border-amber-200/12 bg-[linear-gradient(180deg,rgba(251,191,36,0.08),rgba(15,23,42,0.2))] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="mt-1 text-lg font-semibold text-slate-50">
                      全球排行榜
                    </h3>
                  </div>
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200/16 bg-amber-300/10 text-amber-100">
                    <EmojiEventsRounded />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-amber-100/14 bg-slate-950/30 px-3 py-2">
                    <p className="text-[11px] text-slate-400">最高分</p>
                    <p className="mt-1 text-base font-semibold text-amber-50">
                      98,420
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-100/14 bg-slate-950/30 px-3 py-2">
                    <p className="text-[11px] text-slate-400">平均命中</p>
                    <p className="mt-1 text-base font-semibold text-slate-50">
                      91%
                    </p>
                  </div>
                  <div className="rounded-xl border border-amber-100/14 bg-slate-950/30 px-3 py-2">
                    <p className="text-[11px] text-slate-400">挑戰局數</p>
                    <p className="mt-1 text-base font-semibold text-slate-50">
                      162
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  {leaderboardPreview.map((player) => (
                    <div
                      key={player.rank}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${player.badgeClassName}`}
                    >
                      <span
                        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-slate-950/34 text-sm font-bold ${player.tone}`}
                      >
                        {player.rank}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-100">
                          {player.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          命中 {player.accuracy} · {player.rounds}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-slate-50">
                          {player.score}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">pts</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-5">
                  <div className="rounded-2xl border border-cyan-100/14 bg-[linear-gradient(180deg,rgba(34,211,238,0.08),rgba(15,23,42,0.24))] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold tracking-[0.16em] text-cyan-100/70">
                          YOUR STATS
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-50">
                          你的數據
                        </p>
                      </div>
                      <span className="rounded-full border border-cyan-100/14 bg-cyan-300/10 px-2.5 py-1 text-xs font-medium text-cyan-100">
                        #--
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <div>
                        <p className="text-[11px] text-slate-400">最高分</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          --
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">命中率</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          --
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-slate-400">挑戰</p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          --
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-slate-400">
                      後續會顯示你在這份題庫的排名、最高分與近期挑戰紀錄。
                    </p>
                  </div>
                  <p className="mt-3 hidden text-xs leading-5 text-slate-400 md:block">
                    目前為前端假資料，後續接上 API 後會替換為真實排行榜。
                  </p>
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        {isPublicLibraryTab && collection ? (
          <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-cyan-300/12 px-4 py-3 sm:px-6">
            <Button
              variant="text"
              startIcon={isFavorited ? <StarRounded /> : <StarBorderRounded />}
              disabled={isFavoriteUpdating || !onToggleFavorite}
              onClick={() => {
                void onToggleFavorite?.();
              }}
            >
              {isFavorited ? "取消收藏" : "加入收藏"}
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayArrowRounded />}
              disabled={isApplying}
              onClick={handleUseCollection}
            >
              {isApplying ? "載入中..." : "使用此題庫"}
            </Button>
          </footer>
        ) : null}
      </div>
    </Drawer>
  );
};

export default CollectionDetailDrawer;
