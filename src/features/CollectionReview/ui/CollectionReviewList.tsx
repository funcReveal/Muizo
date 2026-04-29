import PlayerAvatar from "@shared/ui/playerAvatar/PlayerAvatar";

import { useCollectionReviewList } from "../model/useCollectionReviewList";

type CollectionReviewListProps = {
  collectionId: string | null | undefined;
  enabled?: boolean;
  limit?: number;
  className?: string;
};

const formatUpdatedAt = (updatedAt: number) => {
  if (!Number.isFinite(updatedAt) || updatedAt <= 0) return "";

  return new Intl.DateTimeFormat("zh-TW", {
    month: "numeric",
    day: "numeric",
  }).format(new Date(updatedAt * 1000));
};

export function CollectionReviewList({
  collectionId,
  enabled = true,
  limit = 6,
  className,
}: CollectionReviewListProps) {
  const { data: reviews = [], isLoading, isError } = useCollectionReviewList({
    collectionId,
    enabled,
    limit,
  });

  return (
    <section
      className={[
        "rounded-[18px] border border-white/10 bg-slate-950/32 p-3",
        className ?? "",
      ].join(" ")}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-black text-slate-50">玩家評論</h3>
        <span className="text-xs font-semibold text-slate-500">
          {isLoading ? "載入中" : `${reviews.length} 則`}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, index) => (
            <div
              key={index}
              className="flex gap-2 rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-2"
            >
              <div className="h-8 w-8 shrink-0 rounded-full bg-white/8" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-3 w-24 rounded-full bg-white/10" />
                <div className="h-3 w-full rounded-full bg-white/6" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-300/18 bg-rose-500/8 px-3 py-3 text-sm text-rose-100">
          評論載入失敗
        </div>
      ) : reviews.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-4 text-sm text-slate-400">
          目前還沒有玩家留下文字評論。
        </div>
      ) : (
        <div className="space-y-2">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-2.5"
            >
              <div className="flex items-start gap-2.5">
                <PlayerAvatar
                  username={review.displayName}
                  clientId={review.id}
                  avatarUrl={review.avatarUrl}
                  size={32}
                  effectLevel="simple"
                  hideRankMark
                />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-100">
                      {review.displayName}
                    </p>
                    <span className="shrink-0 text-xs font-semibold text-amber-100">
                      {review.rating} ★
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-5 text-slate-300">
                    {review.comment}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatUpdatedAt(review.updatedAt)}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
