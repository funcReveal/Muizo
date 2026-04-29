import { useMemo, useState } from "react";
import { Drawer, IconButton } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import useMediaQuery from "@mui/material/useMediaQuery";
import { toast } from "sonner";
import { useAuth } from "@shared/auth/AuthContext";

import { CollectionReviewApiError } from "../model/collectionReviewApi";
import { useCollectionReview } from "../model/useCollectionReview";
import type {
  CollectionReviewPanelProps,
  CollectionReviewSummary,
  CollectionReviewValue,
} from "../model/types";
import { CollectionReviewForm } from "./CollectionReviewForm";

const getErrorMessage = (error: unknown): string | null => {
  if (!error) return null;

  if (error instanceof CollectionReviewApiError) {
    if (error.code === "COLLECTION_NOT_PLAYED") {
      return "需要完成一次這個題庫後，才能留下評價。";
    }

    if (error.code === "UNAUTHORIZED" || error.status === 401) {
      return "請先登入後再留下評價。";
    }

    return error.message;
  }

  if (error instanceof Error) return error.message;

  return "發生未知錯誤";
};

const formatRatingCount = (summary: CollectionReviewSummary | null) => {
  if (!summary || summary.ratingCount <= 0) return "成為第一個評價的人";
  return `${summary.ratingCount.toLocaleString("zh-TW")} 則評分`;
};

const formatInlineRating = (summary: CollectionReviewSummary | null) => {
  if (!summary || summary.ratingCount <= 0) return "尚無評分";
  return `${summary.ratingAvg.toFixed(1)} ★`;
};

const formatCommentCount = (summary: CollectionReviewSummary | null) => {
  const count = summary?.ratingCount ?? 0;
  return `${count.toLocaleString("zh-TW")} 則評分`;
};

const buildFormKey = (summary: CollectionReviewSummary | null) => {
  const review = summary?.myReview;
  if (!review) return "new-review";
  return `${review.id}:${review.updatedAt}:${review.rating}`;
};

export function CollectionReviewPanel({
  collectionId,
  title = "這個題庫好玩嗎？",
  description = "你的評價可以幫助其他玩家找到更好的題庫。",
  compact = false,
  embedded = false,
  variant = "panel",
  disabled = false,
  className,
  onSubmitted,
}: CollectionReviewPanelProps) {
  const normalizedCollectionId = collectionId?.trim() ?? "";
  const { authToken, authUser, loginWithGoogle } = useAuth();

  const {
    summary,
    myReview,
    isLoading,
    isFetching,
    isError,
    error,
    submitReview,
    isSubmitting,
    submitError,
  } = useCollectionReview({
    collectionId: normalizedCollectionId,
    enabled: normalizedCollectionId.length > 0,
  });
  const [expanded, setExpanded] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const shouldAutoFocusComment = useMediaQuery("(min-width: 768px)");

  const canReview = Boolean(authToken && authUser);
  const queryErrorMessage = isError ? getErrorMessage(error) : null;
  const submitErrorMessage = getErrorMessage(submitError);
  const isInline = variant === "inline";

  const formKey = useMemo(() => buildFormKey(summary), [summary]);

  if (!normalizedCollectionId) {
    return null;
  }

  const handleSubmit = async (value: CollectionReviewValue) => {
    const nextSummary = await submitReview(value);
    toast.success(myReview ? "評價已更新" : "感謝你的評價！");
    setExpanded(false);
    setSelectedRating(null);
    setHoverRating(null);
    onSubmitted?.(nextSummary);
  };

  const activeRating = myReview?.rating ?? 0;
  const previewRating = myReview ? activeRating : hoverRating ?? activeRating;
  const handleRatingClick = (rating: number) => {
    if (!canReview) {
      loginWithGoogle();
      return;
    }
    if (myReview) return;
    setHoverRating(null);
    setSelectedRating(rating);
    setExpanded(true);
  };
  const handleEditReview = () => {
    if (!canReview) {
      loginWithGoogle();
      return;
    }
    setSelectedRating(myReview?.rating ?? null);
    setExpanded(true);
  };
  const handleCloseDrawer = () => {
    if (isSubmitting) return;
    setExpanded(false);
    setSelectedRating(null);
    setHoverRating(null);
  };

  return (
    <>
      <section
        className={[
          isInline
            ? "overflow-hidden rounded-2xl border border-white/10 bg-black/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md"
            : embedded
              ? "overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              : "overflow-hidden rounded-2xl border border-white/10 bg-slate-950/55 shadow-[0_12px_34px_rgba(2,6,23,0.2)]",
          className ?? "",
        ].join(" ")}
      >
        <div
          className={[
            isInline
              ? "flex items-center justify-between gap-2 px-2.5 py-2"
              : "flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:justify-between",
            embedded ? "" : "sm:px-4",
          ].join(" ")}
        >
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 flex-nowrap items-center gap-1.5 whitespace-nowrap">
              {!embedded ? (
                <p className="truncate text-sm font-semibold text-slate-50">
                  {title}
                </p>
              ) : null}
              <span className="inline-flex min-w-[58px] shrink-0 justify-center rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-xs font-semibold text-amber-100">
                {isLoading ? "載入中" : formatInlineRating(summary)}
              </span>
              <span className="inline-flex min-w-0 max-w-[78px] shrink overflow-hidden rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-xs font-semibold text-slate-300">
                <span className="truncate">
                  {isLoading ? "載入中" : formatCommentCount(summary)}
                </span>
              </span>
            </div>
            {!isInline ? (
              <p className="mt-1 line-clamp-1 text-xs text-slate-400">
                {summary && summary.ratingCount > 0
                  ? `${formatRatingCount(summary)}${
                      summary.reviewCommentCount > 0
                        ? ` ・ ${summary.reviewCommentCount.toLocaleString("zh-TW")} 則評論`
                        : ""
                    }`
                  : embedded
                    ? "點星等留下你的評分"
                    : description}
              </p>
            ) : null}
          </div>

          <div
            className={[
              "flex shrink-0 flex-nowrap items-center gap-1 whitespace-nowrap",
              embedded && !isInline ? "self-start sm:self-center" : "",
            ].join(" ")}
            aria-label="評分"
          >
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => handleRatingClick(rating)}
                disabled={isLoading || Boolean(queryErrorMessage)}
                tabIndex={myReview ? -1 : undefined}
                aria-disabled={myReview ? true : undefined}
                onPointerEnter={() => {
                  if (!myReview) setHoverRating(rating);
                }}
                onPointerLeave={() => setHoverRating(null)}
                className={[
                  "rounded-lg py-0.5 leading-none transition disabled:opacity-50",
                  isInline ? "px-0.5" : "px-1",
                  myReview
                    ? "cursor-default"
                    : "cursor-pointer disabled:cursor-not-allowed",
                  isInline
                    ? "text-lg"
                    : compact || embedded
                      ? "text-xl"
                      : "text-2xl",
                  rating <= previewRating
                    ? "text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.24)]"
                    : myReview
                      ? "text-slate-600"
                      : "text-slate-600 hover:text-amber-200",
                ].join(" ")}
                aria-label={`給 ${rating} 顆星`}
                aria-pressed={activeRating === rating}
              >
                ★
              </button>
            ))}
            {myReview ? (
              <button
                type="button"
                onClick={handleEditReview}
                disabled={isLoading || Boolean(queryErrorMessage)}
                className="ml-0.5 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg bg-white/[0.03] text-slate-300 transition hover:bg-amber-300/10 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="編輯評價"
              >
                <EditRoundedIcon sx={{ fontSize: isInline ? 15 : 17 }} />
              </button>
            ) : null}
          </div>
        </div>

        {!isLoading && queryErrorMessage ? (
          <div className="border-t border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {queryErrorMessage}
          </div>
        ) : null}
      </section>

      <Drawer
        anchor="bottom"
        open={!isLoading && !queryErrorMessage && expanded && canReview}
        onClose={handleCloseDrawer}
        ModalProps={{ keepMounted: true }}
        PaperProps={{
          className:
            "!mx-auto !w-full !max-w-[520px] !rounded-t-[24px] !border-x !border-t !border-white/10 !bg-slate-950 !text-slate-100",
        }}
      >
        <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs font-black text-amber-100">
                  {formatInlineRating(summary)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-slate-300">
                  {formatCommentCount(summary)}
                </span>
              </div>
            </div>
            <IconButton
              size="small"
              onClick={handleCloseDrawer}
              disabled={isSubmitting}
              aria-label="關閉評價"
              className="!h-9 !w-9 !rounded-full !border !border-white/10 !bg-white/[0.03] !text-slate-200"
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          </div>

          <CollectionReviewForm
            key={`${formKey}:${selectedRating ?? "current"}`}
            selectedRating={selectedRating}
            compact
            autoFocusComment={shouldAutoFocusComment}
            disabled={disabled || isFetching}
            submitting={isSubmitting}
            initialRating={myReview?.rating ?? null}
            initialComment={myReview?.comment ?? null}
            submitLabel={myReview ? "更新評價" : "送出評價"}
            errorMessage={submitErrorMessage}
            onSubmit={handleSubmit}
          />
        </div>
      </Drawer>
    </>
  );
}
