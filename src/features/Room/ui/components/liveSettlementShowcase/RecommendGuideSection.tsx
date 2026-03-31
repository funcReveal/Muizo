import React from "react";
import { IconButton, Popover, Tooltip } from "@mui/material";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import ShuffleRoundedIcon from "@mui/icons-material/ShuffleRounded";
import LocalFireDepartmentRoundedIcon from "@mui/icons-material/LocalFireDepartmentRounded";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";
import GraphicEqRoundedIcon from "@mui/icons-material/GraphicEqRounded";
import SmartDisplayRoundedIcon from "@mui/icons-material/SmartDisplayRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import YouTubeIcon from "@mui/icons-material/YouTube";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import QueueMusicRoundedIcon from "@mui/icons-material/QueueMusicRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";

import type { RecommendCategory } from "../liveSettlementUtils";

type RecommendationCardItem = {
  recap: {
    key: string;
    order: number;
    title: string;
    uploader?: string | null;
    thumbnail?: string | null;
  };
  hint: string;
  emphasis: string;
  providerLabel: string;
  link?: { href?: string | null } | null;
  previewUrl: string | null;
};

interface RecommendTheme {
  shellClass: string;
  sectionClass: string;
  asideClass: string;
  controlGroupClass: string;
  listActiveClass: string;
  badgeClass: string;
}

interface RecommendGuideSectionProps {
  isMobileView?: boolean;
  recommendSectionRef: React.RefObject<HTMLElement | null>;
  activeCategoryTheme: RecommendTheme;
  activeRecommendCategory: RecommendCategory;
  recommendCategoryLabels: Record<RecommendCategory, string>;
  recommendCategoryShortHints: Record<RecommendCategory, string>;
  recommendationCardsByCategory: Record<RecommendCategory, RecommendationCardItem[]>;
  onActivateCategory: (category: RecommendCategory) => void;
  autoPreviewEnabled: boolean;
  onToggleAutoPreview: () => void;
  currentRecommendation: RecommendationCardItem | null;
  hasCurrentRecommendationLink: boolean;
  recommendationTransitionKey: string;
  onOpenRecommendationTitle: () => void;
  isCurrentRecommendationFastest: boolean;
  reviewStatusBadgeBaseClass: string;
  currentRecommendationResultTone: { badgeClass: string; label: string };
  showCurrentRecommendationRankBadge: boolean;
  currentRecommendationCorrectRank: number | null;
  isCurrentRecommendationFirstCorrect: boolean;
  isCurrentRecommendationGlobalFastest: boolean;
  currentRecommendationGradeBadgeClass: string | null;
  currentRecommendationGradeLabel: string | null;
  hasCurrentRecommendationSpeedDelta: boolean;
  currentRecommendationSpeedValue: string;
  currentRecommendationSpeedNote: string;
  currentRecommendationAverageCorrectMs: number | null;
  formatMs: (value: number | null | undefined) => string;
  currentRecommendationFastestBadgeText: string;
  currentRecommendationFastestCorrectMeta: {
    clientId: string;
    username: string;
    answeredAtMs: number;
  } | null;
  canAutoGuideLoop: boolean;
  previewCountdownSec: number;
  previewSwitchNotice: string | null;
  effectivePreviewVolume: number;
  onPreviewVolumeChange: (next: number) => void;
  recommendPreviewStageRef: React.RefObject<HTMLDivElement | null>;
  isCurrentRecommendationPreviewOpen: boolean;
  previewPlayerState: "idle" | "playing" | "paused";
  currentRecommendationPreviewUrl: string | null;
  previewIframeRef: React.RefObject<HTMLIFrameElement | null>;
  onPreviewIframeLoad: () => void;
  shouldShowPreviewOverlay: boolean;
  onPreviewSurfaceClick: () => void;
  recommendationCards: RecommendationCardItem[];
  selectedReviewParticipantLabel: string;
  canCycleReviewParticipants: boolean;
  onGoPrevReviewParticipant: () => void;
  onGoNextReviewParticipant: () => void;
  safeRecommendIndex: number;
  onSelectRecommendation: (index: number) => void;
  onOpenCardLink: (card: RecommendationCardItem) => void;
  canNavigateRecommendations: boolean;
  recommendNavLabels: { prev: string; next: string };
  onGoPrevRecommendation: () => void;
  onGoNextRecommendation: () => void;
}

const CATEGORY_META: Array<{ key: RecommendCategory; icon: React.ElementType }> = [
  { key: "quick", icon: BoltRoundedIcon },
  { key: "confuse", icon: ShuffleRoundedIcon },
  { key: "hard", icon: LocalFireDepartmentRoundedIcon },
  { key: "other", icon: LibraryMusicRoundedIcon },
];

const AutoMarqueeTitle: React.FC<{
  text: string;
  className?: string;
}> = ({ text, className = "" }) => {
  const wrapRef = React.useRef<HTMLSpanElement | null>(null);
  const trackRef = React.useRef<HTMLSpanElement | null>(null);
  const [canMarquee, setCanMarquee] = React.useState(false);
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  React.useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    const measure = () => {
      const overflow = track.scrollWidth - wrap.clientWidth;
      if (overflow > 10) {
        setCanMarquee(true);
        setStyle({
          ["--settlement-title-shift" as const]: `${-(overflow + 22)}px`,
          ["--settlement-title-duration" as const]: `${Math.min(
            11.5,
            Math.max(5.4, overflow / 44),
          ).toFixed(2)}s`,
        } as React.CSSProperties);
      } else {
        setCanMarquee(false);
        setStyle({});
      }
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wrap);
    observer.observe(track);
    return () => observer.disconnect();
  }, [text]);

  return (
    <span ref={wrapRef} className={`game-settlement-title-marquee block overflow-hidden ${className}`}>
      <span
        ref={trackRef}
        className={`game-settlement-title-marquee-track ${
          canMarquee ? "game-settlement-title-marquee-track--run" : ""
        }`}
        style={style}
      >
        {text}
      </span>
    </span>
  );
};

const RecommendGuideSection: React.FC<RecommendGuideSectionProps> = ({
  recommendSectionRef,
  activeCategoryTheme,
  activeRecommendCategory,
  recommendCategoryLabels,
  recommendCategoryShortHints,
  recommendationCardsByCategory,
  onActivateCategory,
  autoPreviewEnabled,
  onToggleAutoPreview,
  currentRecommendation,
  hasCurrentRecommendationLink,
  recommendationTransitionKey,
  onOpenRecommendationTitle,
  isCurrentRecommendationFastest,
  reviewStatusBadgeBaseClass,
  currentRecommendationResultTone,
  showCurrentRecommendationRankBadge,
  currentRecommendationCorrectRank,
  isCurrentRecommendationFirstCorrect,
  isCurrentRecommendationGlobalFastest,
  currentRecommendationGradeBadgeClass,
  currentRecommendationGradeLabel,
  hasCurrentRecommendationSpeedDelta,
  currentRecommendationSpeedValue,
  currentRecommendationSpeedNote,
  currentRecommendationAverageCorrectMs,
  formatMs,
  currentRecommendationFastestBadgeText,
  currentRecommendationFastestCorrectMeta,
  canAutoGuideLoop,
  previewCountdownSec,
  previewSwitchNotice,
  effectivePreviewVolume,
  onPreviewVolumeChange,
  recommendPreviewStageRef,
  isCurrentRecommendationPreviewOpen,
  previewPlayerState,
  currentRecommendationPreviewUrl,
  previewIframeRef,
  onPreviewIframeLoad,
  shouldShowPreviewOverlay,
  onPreviewSurfaceClick,
  recommendationCards,
  selectedReviewParticipantLabel,
  canCycleReviewParticipants,
  onGoPrevReviewParticipant,
  onGoNextReviewParticipant,
  safeRecommendIndex,
  onSelectRecommendation,
  onOpenCardLink,
  canNavigateRecommendations,
  recommendNavLabels,
  onGoPrevRecommendation,
  onGoNextRecommendation,
}) => {
  const [autoPreviewHelpAnchor, setAutoPreviewHelpAnchor] =
    React.useState<HTMLElement | null>(null);
  const youtubeOverlayTitle = "如果喜歡這首音樂，別忘了到 YouTube 支持創作者喲！";
  const currentCard = currentRecommendation;
  const shouldKeepLivePreviewVisible = currentRecommendationPreviewUrl !== null;
  const showPreviewCover =
    previewPlayerState !== "playing" &&
    (previewPlayerState === "paused" ||
      shouldShowPreviewOverlay ||
      !shouldKeepLivePreviewVisible);

  return (
    <section
      ref={recommendSectionRef}
      className={`rounded-[22px] border p-3 transition-colors duration-300 lg:p-3.5 ${activeCategoryTheme.shellClass}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <AutoAwesomeRoundedIcon className="text-[1.35rem] text-cyan-200" />
            <h3 className="text-[2rem] font-black tracking-tight text-white">推薦導覽</h3>
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-300">
            {recommendCategoryShortHints[activeRecommendCategory]}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition ${
              autoPreviewEnabled
                ? "border-cyan-300/45 bg-cyan-400/12 text-cyan-50"
                : "border-slate-600/70 bg-slate-900/68 text-slate-300 hover:border-slate-400"
            } cursor-pointer`}
            onClick={onToggleAutoPreview}
          >
            <GraphicEqRoundedIcon className="text-[1rem]" />
            自動導覽 {autoPreviewEnabled ? "ON" : "OFF"}
          </button>
          <IconButton
            size="small"
            onClick={(event) =>
              setAutoPreviewHelpAnchor((current) =>
                current === event.currentTarget ? null : event.currentTarget,
              )
            }
            className="!h-9 !w-9 !cursor-pointer !border !border-cyan-300/35 !bg-cyan-500/10 !text-cyan-100"
            aria-label="查看自動導覽說明"
          >
            <HelpOutlineRoundedIcon fontSize="inherit" />
          </IconButton>
        </div>
      </div>
      <Popover
        open={Boolean(autoPreviewHelpAnchor)}
        anchorEl={autoPreviewHelpAnchor}
        onClose={() => setAutoPreviewHelpAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          className:
            "!mt-2 !max-w-[280px] !rounded-[18px] !border !border-cyan-300/24 !bg-[linear-gradient(180deg,rgba(7,24,34,0.96),rgba(4,13,24,0.98))] !px-4 !py-3 !text-sm !text-cyan-50/92 !shadow-[0_22px_44px_-24px_rgba(34,211,238,0.55)]",
        }}
      >
        自動播放預覽，並在倒數結束後切換到下一首推薦歌曲。
      </Popover>

      <div className="mt-4 flex flex-wrap gap-2">
        {CATEGORY_META.map((item) => {
          const Icon = item.icon;
          const active = activeRecommendCategory === item.key;
          const count = recommendationCardsByCategory[item.key].length;

          return (
            <button
              key={item.key}
              type="button"
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                active
                  ? activeCategoryTheme.badgeClass
                  : "border-slate-600/70 bg-slate-900/68 text-slate-300 hover:border-slate-400"
              } ${count <= 0 ? "cursor-not-allowed opacity-45" : "cursor-pointer"}`}
              onClick={() => onActivateCategory(item.key)}
              disabled={count <= 0}
            >
              <Icon className="text-[1rem]" />
              <span>{recommendCategoryLabels[item.key]}</span>
              <span className="rounded-full border border-current/30 px-2 py-0.5 text-[10px] leading-none">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {!currentCard ? (
        <div className="mt-4 rounded-[26px] border border-dashed border-slate-700/70 bg-slate-950/55 px-5 py-8 text-sm text-slate-400">
          目前沒有可顯示的推薦題目。
        </div>
      ) : (
        <div className="mt-4 grid items-stretch gap-4 xl:grid-cols-[minmax(0,1.72fr)_minmax(380px,0.92fr)]">
          <article
            key={recommendationTransitionKey}
            className={`flex h-[820px] min-w-0 flex-col rounded-[28px] border p-5 transition-colors duration-300 ${activeCategoryTheme.sectionClass}`}
            style={{ animation: "settlementSwapIn 220ms ease-out both" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {recommendCategoryLabels[activeRecommendCategory]}
                </p>
                <button
                  type="button"
                  onClick={onOpenRecommendationTitle}
                  disabled={!hasCurrentRecommendationLink}
                  className={`mt-2 inline-flex max-w-full text-left text-[2rem] font-black leading-tight text-white transition ${
                    hasCurrentRecommendationLink
                      ? "cursor-pointer underline-offset-4 hover:text-cyan-200 hover:underline"
                      : "cursor-default"
                  }`}
                >
                  <AutoMarqueeTitle text={currentCard.recap.title} className="min-w-0 max-w-full" />
                </button>
                <p className="mt-2 text-lg font-semibold text-slate-200">
                  {currentCard.recap.uploader || "未知作者"}
                </p>
              </div>

              <div className="shrink-0">
                <YouTubeIcon className="text-[2rem] text-[#ff0033]" />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span
                className={`${reviewStatusBadgeBaseClass} h-7 px-3 text-xs ${currentRecommendationResultTone.badgeClass}`}
              >
                {currentRecommendationResultTone.label}
              </span>
              {currentRecommendationGradeLabel && currentRecommendationGradeBadgeClass && (
                <span
                  className={`inline-flex h-7 items-center justify-center rounded-full border px-3 text-xs font-semibold ${currentRecommendationGradeBadgeClass}`}
                >
                  評分 {currentRecommendationGradeLabel}
                </span>
              )}
              {isCurrentRecommendationFirstCorrect && (
                <span className="inline-flex h-7 items-center justify-center rounded-full border border-violet-300/45 bg-violet-500/16 px-3 text-xs font-semibold text-violet-50">
                  首答
                </span>
              )}
              {showCurrentRecommendationRankBadge && currentRecommendationCorrectRank !== null && (
                <span className="inline-flex h-7 items-center justify-center rounded-full border border-sky-300/45 bg-sky-500/16 px-3 text-xs font-semibold text-sky-100">
                  第 {currentRecommendationCorrectRank} 位答對
                </span>
              )}
              {isCurrentRecommendationFastest && (
                <Tooltip
                  title={isCurrentRecommendationGlobalFastest ? "全場最快答對" : "速度表現亮眼"}
                  arrow
                >
                  <span
                    className={`inline-flex h-7 items-center justify-center gap-1 rounded-full border px-3 text-xs font-semibold ${
                      isCurrentRecommendationGlobalFastest
                        ? "border-orange-300/45 bg-orange-500/18 text-orange-100"
                        : "border-amber-300/40 bg-amber-500/14 text-amber-100"
                    }`}
                  >
                    <LocalFireDepartmentRoundedIcon className="text-[0.95rem]" />
                    {currentRecommendationFastestBadgeText}
                  </span>
                </Tooltip>
              )}
            </div>

            <div className="mt-4 w-full rounded-[22px] border border-cyan-300/18 bg-[linear-gradient(180deg,rgba(10,20,36,0.9),rgba(3,7,18,0.94))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-[16px] bg-black/18 px-3 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <BoltRoundedIcon className="text-[1rem]" />
                    <p className="text-[11px]">題目亮點</p>
                  </div>
                  <p className="mt-2 text-sm font-black text-white">{currentCard.hint}</p>
                </div>
                <div className="rounded-[16px] bg-black/18 px-3 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <LocalFireDepartmentRoundedIcon className="text-[1rem]" />
                    <p className="text-[11px]">表現重點</p>
                  </div>
                  <p className="mt-2 text-sm font-black text-white">{currentCard.emphasis}</p>
                </div>
                <div className="rounded-[16px] bg-black/18 px-3 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <GraphicEqRoundedIcon className="text-[1rem]" />
                    <p className="text-[11px]">平均作答</p>
                  </div>
                  <p className="mt-2 text-sm font-black text-white">
                    {typeof currentRecommendationAverageCorrectMs === "number"
                      ? formatMs(currentRecommendationAverageCorrectMs)
                      : "--"}
                  </p>
                </div>
                <div className="rounded-[16px] bg-black/18 px-3 py-3">
                  <div className="flex items-center gap-2 text-slate-400">
                    <SmartDisplayRoundedIcon className="text-[1rem]" />
                    <p className="text-[11px]">速度差</p>
                  </div>
                  <Tooltip title={currentRecommendationSpeedNote} arrow>
                    <p className="mt-2 text-sm font-black text-white">
                      {hasCurrentRecommendationSpeedDelta ? currentRecommendationSpeedValue : "--"}
                    </p>
                  </Tooltip>
                </div>
              </div>
              {currentRecommendationFastestCorrectMeta && (
                <p className="mt-2 inline-flex items-center gap-2 text-xs text-slate-400">
                  <GraphicEqRoundedIcon className="text-[0.95rem]" />
                  最快 {currentRecommendationFastestCorrectMeta.username} ・{" "}
                  {formatMs(currentRecommendationFastestCorrectMeta.answeredAtMs)}
                </p>
              )}
            </div>

            <div
              ref={recommendPreviewStageRef}
              className="mt-4 flex min-h-0 flex-1 overflow-hidden rounded-[24px] border border-slate-700/80 bg-black/40"
            >
              <div className="relative h-full min-h-[420px] w-full self-stretch">
                {currentCard.recap.thumbnail && !isCurrentRecommendationPreviewOpen && (
                  <img
                    src={currentCard.recap.thumbnail}
                    alt={currentCard.recap.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-72"
                  />
                )}

                {shouldKeepLivePreviewVisible && currentRecommendationPreviewUrl && (
                  <iframe
                    ref={previewIframeRef}
                    src={currentRecommendationPreviewUrl}
                    className="absolute inset-0 h-full w-full cursor-pointer"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                    title={`settlement-preview-${currentCard.recap.key}`}
                    onLoad={onPreviewIframeLoad}
                  />
                )}

                {currentRecommendationPreviewUrl && showPreviewCover && (
                  <button
                    type="button"
                    className="absolute inset-0 z-20 block h-full w-full cursor-pointer bg-[linear-gradient(180deg,rgba(2,6,23,0.18),rgba(2,6,23,0.72))]"
                    onClick={onPreviewSurfaceClick}
                    aria-label="切換推薦影片播放狀態"
                  >
                    <span className="mx-auto flex h-full max-w-[30rem] items-center justify-center px-6 text-center text-base font-semibold text-white">
                      {youtubeOverlayTitle}
                    </span>
                  </button>
                )}

                {!currentRecommendationPreviewUrl && (
                  <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
                    <div>
                      <p className="text-base font-semibold text-slate-200">無法播放預覽</p>
                      <p className="mt-2 text-sm text-slate-400">
                        這題沒有可用的預覽來源，請直接前往 YouTube 支持作者。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2.5">
                {hasCurrentRecommendationLink && (
                  <button
                    type="button"
                    onClick={onOpenRecommendationTitle}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-rose-300/35 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-50 transition hover:border-rose-200/55 hover:bg-rose-500/16"
                  >
                    <OpenInNewRoundedIcon className="text-[0.9rem]" />
                    前往 YouTube 支持作者
                  </button>
                )}
                {canAutoGuideLoop && (
                  <span
                    className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${activeCategoryTheme.badgeClass}`}
                  >
                    AUTO {previewCountdownSec}s
                  </span>
                )}
                {previewSwitchNotice && (
                  <span className="rounded-full border border-cyan-300/40 bg-cyan-500/12 px-3 py-1.5 text-xs font-semibold text-cyan-100">
                    {previewSwitchNotice}
                  </span>
                )}
              </div>
              <div className="flex min-w-[220px] items-center justify-end gap-3">
                <GraphicEqRoundedIcon className="text-[0.95rem]" />
                <div className="relative h-2 w-[180px] overflow-hidden rounded-full bg-slate-800/80">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-[linear-gradient(90deg,rgba(34,211,238,0.95),rgba(96,165,250,0.95))]"
                    style={{ width: `${Math.max(0, Math.min(100, effectivePreviewVolume))}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={effectivePreviewVolume}
                  onChange={(event) => onPreviewVolumeChange(Number(event.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="調整試聽音量"
                />
                </div>
                <span className="rounded-full border border-cyan-300/25 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-semibold text-cyan-100">
                  {effectivePreviewVolume}%
                </span>
              </div>
            </div>
          </article>

          <aside
            className={`flex h-[820px] min-w-0 flex-col overflow-hidden rounded-[28px] border bg-[linear-gradient(180deg,rgba(7,15,28,0.96),rgba(5,10,18,0.99))] p-4 transition-colors duration-300 ${activeCategoryTheme.asideClass}`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="shrink-0">
                  <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    <QueueMusicRoundedIcon className="text-[1rem] text-cyan-200" />
                    題目清單
                  </p>
                  <p className="mt-1 whitespace-nowrap text-[1.95rem] font-black leading-none text-white">
                    {recommendationCards.length === 0
                      ? "0 / 0"
                      : `${safeRecommendIndex + 1} / ${recommendationCards.length}`}
                  </p>
                </div>
                <div className="grid min-w-0 w-full flex-1 grid-cols-[80px_minmax(0,1fr)_80px] items-center rounded-full border border-sky-300/35 bg-sky-500/10 px-1 py-1 sm:max-w-[340px]">
                  <button
                    type="button"
                    className="rounded-full border border-slate-600/70 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold text-slate-100 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    onClick={onGoPrevReviewParticipant}
                    disabled={!canCycleReviewParticipants}
                  >
                    上一位
                  </button>
                  <span className="truncate px-2 text-center text-[11px] font-semibold text-sky-100">
                    <span className="mr-1 inline-flex align-middle text-cyan-200">
                      <GroupsRoundedIcon className="text-[0.95rem]" />
                    </span>
                    {selectedReviewParticipantLabel}
                  </span>
                  <button
                    type="button"
                    className="rounded-full border border-slate-600/70 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold text-slate-100 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                    onClick={onGoNextReviewParticipant}
                    disabled={!canCycleReviewParticipants}
                  >
                    下一位
                  </button>
                </div>
              </div>
            </div>

            <div className="game-settlement-recommend-list-viewport mt-4 min-h-0 flex-1 overflow-y-auto pr-1.5">
              <div className="space-y-3">
                {recommendationCards.length === 0 ? (
                  <div className="flex h-full min-h-[240px] items-center justify-center rounded-[22px] border border-dashed border-slate-700/70 bg-slate-950/55 px-4 text-sm text-slate-400">
                    目前沒有可顯示的題目清單。
                  </div>
                ) : (
                  recommendationCards.map((card, index) => {
                    const isActive = index === safeRecommendIndex;

                    return (
                      <div
                        key={card.recap.key}
                        role="button"
                        tabIndex={0}
                        className={`block w-full cursor-pointer rounded-[22px] border px-4 py-4 text-left transition ${
                          isActive
                            ? `${activeCategoryTheme.listActiveClass} shadow-[0_18px_34px_-28px_rgba(16,185,129,0.48)]`
                            : "border-slate-700/75 bg-slate-950/58 hover:border-slate-500/75"
                        }`}
                        onClick={() => onSelectRecommendation(index)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            onSelectRecommendation(index);
                          }
                        }}
                      >
                        <div className="min-w-0">
                          {card.link?.href ? (
                            <button
                              type="button"
                              className="inline-block max-w-full cursor-pointer truncate text-left text-lg font-black leading-snug text-white underline-offset-4 transition hover:text-cyan-200 hover:underline"
                              onClick={(event) => {
                                event.stopPropagation();
                                onSelectRecommendation(index);
                                onOpenCardLink(card);
                              }}
                            >
                              <span className="block truncate">{card.recap.title}</span>
                            </button>
                          ) : (
                            <p className="truncate text-lg font-black leading-snug text-white">
                              {card.recap.title}
                            </p>
                          )}
                          <p className="mt-2 truncate text-sm text-slate-300">
                            {card.recap.uploader || "未知作者"}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            <span className="rounded-full border border-emerald-300/35 bg-emerald-500/12 px-2.5 py-1 text-[10.5px] font-semibold text-emerald-100">
                              {card.hint}
                            </span>
                            <span className="rounded-full border border-slate-500/55 bg-slate-800/70 px-2.5 py-1 text-[10.5px] font-semibold text-slate-100">
                              {card.emphasis}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="mt-4 border-t border-white/6 pt-4">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="rounded-full border border-slate-600/70 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  onClick={onGoPrevRecommendation}
                  disabled={!canNavigateRecommendations}
                >
                  {recommendNavLabels.prev}
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-600/70 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                  onClick={onGoNextRecommendation}
                  disabled={!canNavigateRecommendations}
                >
                  {recommendNavLabels.next}
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

export default RecommendGuideSection;
