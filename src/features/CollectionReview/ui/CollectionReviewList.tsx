import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { Drawer, IconButton, useMediaQuery } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { List, type RowComponentProps } from "react-window";

import PlayerAvatar from "@shared/ui/playerAvatar/PlayerAvatar";

import { useCollectionReviewList } from "../model/useCollectionReviewList";
import type { CollectionReviewListItem } from "../model/types";

type CollectionReviewListProps = {
  collectionId: string | null | undefined;
  enabled?: boolean;
  limit?: number;
  className?: string;
};

type ReviewListRowProps = {
  items: CollectionReviewListItem[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  onOpenReview: (review: CollectionReviewListItem) => void;
};

const REVIEW_ROW_HEIGHT = 104;

const formatUpdatedAt = (updatedAt: number) => {
  if (!Number.isFinite(updatedAt) || updatedAt <= 0) return "";

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).format(new Date(updatedAt * 1000));
};

const shouldShowMore = (comment: string | null) => {
  if (!comment) return false;
  return comment.length > 54 || comment.includes("\n");
};

const ReviewSkeleton = () => (
  <div className="mx-2 flex gap-2 rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-2">
    <div className="h-8 w-8 shrink-0 rounded-full bg-white/8" />
    <div className="min-w-0 flex-1 space-y-2">
      <div className="h-3 w-24 rounded-full bg-white/10" />
      <div className="h-3 w-full rounded-full bg-white/6" />
      <div className="h-3 w-[62%] rounded-full bg-white/6" />
    </div>
  </div>
);

const ReviewCard = ({
  review,
  onOpenReview,
}: {
  review: CollectionReviewListItem;
  onOpenReview: (review: CollectionReviewListItem) => void;
}) => {
  const commentRef = useRef<HTMLParagraphElement | null>(null);
  const [isCommentClamped, setIsCommentClamped] = useState(false);
  const canExpand = isCommentClamped || shouldShowMore(review.comment);

  useLayoutEffect(() => {
    const node = commentRef.current;
    if (!node) return;

    const measure = () => {
      setIsCommentClamped(node.scrollHeight > node.clientHeight + 1);
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      const frame = window.requestAnimationFrame(measure);
      return () => window.cancelAnimationFrame(frame);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [review.comment]);

  return (
  <article className="relative mx-2 h-24 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-2">
    <div className="flex h-full items-start gap-2.5">
      <PlayerAvatar
        username={review.displayName}
        clientId={review.id}
        avatarUrl={review.avatarUrl}
        size={32}
        effectLevel="simple"
        hideRankMark
      />
      <div className="min-w-0 flex-1 pb-5">
        <div className="flex min-w-0 items-center justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-100">
            {review.displayName}
          </p>
          <span className="shrink-0 text-xs font-semibold text-amber-100">
            {review.rating} ★
          </span>
        </div>
        <p
          ref={commentRef}
          className="mt-1 line-clamp-2 whitespace-pre-wrap break-words text-[13px] leading-4 text-slate-300"
        >
          {review.comment}
        </p>
        <div className="absolute bottom-2 left-[54px] right-3 flex items-center justify-between gap-2">
          <p className="truncate text-xs text-slate-500">
            {formatUpdatedAt(review.updatedAt)}
          </p>
          {canExpand ? (
            <button
              type="button"
              className="shrink-0 text-xs font-semibold text-cyan-100/90 hover:text-cyan-50"
              onClick={() => onOpenReview(review)}
            >
              顯示更多
            </button>
          ) : null}
        </div>
      </div>
    </div>
  </article>
  );
};

const ReviewListRow = ({
  index,
  style,
  items,
  hasMore,
  isLoadingMore,
  onLoadMore,
  onOpenReview,
}: RowComponentProps<ReviewListRowProps>): ReactElement => {
  const review = items[index];
  const isLoaderRow = typeof review === "undefined" && (hasMore || isLoadingMore);

  useEffect(() => {
    if (!isLoaderRow || !hasMore || isLoadingMore) return;
    onLoadMore();
  }, [hasMore, isLoaderRow, isLoadingMore, onLoadMore]);

  return (
    <div style={style} className="py-1">
      {isLoaderRow ? (
        <ReviewSkeleton />
      ) : review ? (
        <ReviewCard review={review} onOpenReview={onOpenReview} />
      ) : null}
    </div>
  );
};

export function CollectionReviewList({
  collectionId,
  enabled = true,
  limit = 10,
  className,
}: CollectionReviewListProps) {
  const isCompact = useMediaQuery("(max-width:767px)");
  const [expandedReview, setExpandedReview] =
    useState<CollectionReviewListItem | null>(null);
  const {
    data,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useCollectionReviewList({
    collectionId,
    enabled,
    limit,
  });
  const reviews = data?.pages.flatMap((page) => page.items) ?? [];
  const rowCount = reviews.length + (hasNextPage || isFetchingNextPage ? 1 : 0);
  const closeExpandedReview = useCallback(() => setExpandedReview(null), []);
  const expandedPaperProps = useMemo(
    () => ({
      sx: {
        maxHeight: isCompact ? "76dvh" : "min(560px, 80dvh)",
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        border: "1px solid rgba(148, 163, 184, 0.18)",
        borderBottom: 0,
        background:
          "linear-gradient(180deg, rgba(8,15,28,0.98), rgba(2,6,23,0.99))",
        color: "var(--mc-text)",
      },
    }),
    [isCompact],
  );

  if (isLoading) {
    return (
      <div className={["h-full space-y-2 overflow-hidden py-2", className ?? ""].join(" ")}>
        {Array.from({ length: 4 }).map((_, index) => (
          <ReviewSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className={["h-full p-2", className ?? ""].join(" ")}>
        <div className="rounded-2xl border border-rose-300/18 bg-rose-500/8 px-3 py-3 text-sm text-rose-100">
          評論載入失敗
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className={["h-full p-2", className ?? ""].join(" ")}>
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-sm text-slate-400">
          目前還沒有玩家留下文字評論。
        </div>
      </div>
    );
  }

  return (
    <div className={["h-full min-h-0 overflow-hidden", className ?? ""].join(" ")}>
      <List<ReviewListRowProps>
        className="transient-scrollbar h-full"
        style={{
          height: "100%",
          minHeight: 0,
          width: "100%",
        }}
        rowCount={rowCount}
        rowHeight={REVIEW_ROW_HEIGHT}
        rowProps={{
          items: reviews,
          hasMore: Boolean(hasNextPage),
          isLoadingMore: isFetchingNextPage,
          onOpenReview: setExpandedReview,
          onLoadMore: () => {
            void fetchNextPage();
          },
        }}
        rowComponent={ReviewListRow}
      />
      <Drawer
        anchor="bottom"
        open={Boolean(expandedReview)}
        onClose={closeExpandedReview}
        PaperProps={expandedPaperProps}
      >
        {expandedReview ? (
          <div className="flex max-h-[inherit] min-h-0 flex-col overflow-hidden">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <PlayerAvatar
                  username={expandedReview.displayName}
                  clientId={expandedReview.id}
                  avatarUrl={expandedReview.avatarUrl}
                  size={34}
                  effectLevel="simple"
                  hideRankMark
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">
                    {expandedReview.displayName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatUpdatedAt(expandedReview.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-semibold text-amber-100">
                  {expandedReview.rating} ★
                </span>
                <IconButton
                  size="small"
                  onClick={closeExpandedReview}
                  aria-label="關閉完整評論"
                  sx={{ color: "rgba(226, 232, 240, 0.86)" }}
                >
                  <CloseRoundedIcon fontSize="small" />
                </IconButton>
              </div>
            </div>
            <div className="min-h-0 overflow-y-auto px-4 py-4">
              <p className="whitespace-pre-wrap break-words text-sm leading-6 text-slate-200">
                {expandedReview.comment}
              </p>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
