import { useEffect, useRef, useState, type FormEvent } from "react";

import type { CollectionReviewValue } from "../model/types";

type CollectionReviewFormProps = {
  selectedRating?: number | null;
  initialRating?: number | null;
  initialComment?: string | null;
  submitLabel?: string;
  disabled?: boolean;
  submitting?: boolean;
  compact?: boolean;
  autoFocusComment?: boolean;
  errorMessage?: string | null;
  onSubmit: (value: CollectionReviewValue) => Promise<void> | void;
};

const STAR_VALUES = [1, 2, 3, 4, 5] as const;

const clampInitialRating = (value: number | null | undefined) => {
  if (!value || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(5, Math.trunc(value)));
};

export function CollectionReviewForm({
  selectedRating,
  initialRating,
  initialComment,
  submitLabel = "送出評價",
  disabled = false,
  submitting = false,
  compact = false,
  autoFocusComment = false,
  errorMessage,
  onSubmit,
}: CollectionReviewFormProps) {
  const [rating, setRating] = useState(() =>
    clampInitialRating(selectedRating ?? initialRating),
  );
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState(() => initialComment ?? "");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!autoFocusComment || disabled || submitting) return;
    const timer = window.setTimeout(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      const cursorPosition = textarea.value.length;
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    }, 220);
    return () => window.clearTimeout(timer);
  }, [autoFocusComment, disabled, submitting]);

  const canSubmit = rating >= 1 && rating <= 5 && !disabled && !submitting;
  const previewRating = hoverRating ?? rating;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    const trimmedComment = comment.trim();

    await onSubmit({
      rating,
      comment: trimmedComment.length > 0 ? trimmedComment : null,
    });
  };

  return (
    <form className={compact ? "space-y-3" : "space-y-4"} onSubmit={handleSubmit}>
      <div>
        <div className="mb-2 text-sm font-medium text-slate-100">評分</div>
        <div className="flex items-center gap-1" aria-label="調整評分">
          {STAR_VALUES.map((value) => (
            <button
              key={value}
              type="button"
              disabled={disabled || submitting}
              onClick={() => setRating(value)}
              onPointerEnter={() => setHoverRating(value)}
              onPointerLeave={() => setHoverRating(null)}
              onFocus={() => setHoverRating(value)}
              onBlur={() => setHoverRating(null)}
              className={[
                "cursor-pointer rounded-lg px-1.5 py-1 text-2xl leading-none transition disabled:cursor-not-allowed disabled:opacity-50",
                value <= previewRating
                  ? "text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.24)]"
                  : "text-slate-600 hover:text-amber-200",
              ].join(" ")}
              aria-label={`調整為 ${value} 顆星`}
              aria-pressed={rating === value}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-100">
          <span>留言</span>
          <span className="text-xs font-normal text-slate-500">
            可留空
          </span>
        </span>
        <textarea
          ref={textareaRef}
          value={comment}
          disabled={disabled || submitting}
          maxLength={500}
          rows={compact ? 2 : 3}
          placeholder="例如：歌曲選得很好、難度剛好，或有幾題答案可以再整理。"
          onChange={(event) => setComment(event.target.value)}
          className={[
            "w-full resize-none rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-amber-300/50 focus:ring-2 focus:ring-amber-300/10 disabled:cursor-not-allowed disabled:opacity-60",
            compact ? "min-h-[74px]" : "min-h-[96px]",
          ].join(" ")}
        />
        <span className="mt-1 block text-right text-xs text-slate-500">
          {comment.length}/500
        </span>
      </label>

      {errorMessage ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {errorMessage}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full rounded-2xl bg-amber-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {submitting ? "儲存中..." : submitLabel}
      </button>
    </form>
  );
}
