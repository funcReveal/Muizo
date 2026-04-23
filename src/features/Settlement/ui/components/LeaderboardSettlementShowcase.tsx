import React, { memo, useCallback, useMemo, useRef, useState, useEffect } from "react";
import useMediaQuery from "@mui/material/useMediaQuery";
import AutoAwesomeRoundedIcon from "@mui/icons-material/AutoAwesomeRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import StarRoundedIcon from "@mui/icons-material/StarRounded";
import TrackChangesRoundedIcon from "@mui/icons-material/TrackChangesRounded";
import TrendingDownRoundedIcon from "@mui/icons-material/TrendingDownRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import WorkspacePremiumRoundedIcon from "@mui/icons-material/WorkspacePremiumRounded";
import { List, type RowComponentProps } from "react-window";

import type {
  LeaderboardSettlementResponse,
  PlaylistItem,
  QuestionScoreBreakdown,
  RoomParticipant,
  RoomState,
} from "@features/RoomSession";
import type { SettlementQuestionRecap, SettlementQuestionResult } from "../../model/types";
import PlayerAvatar from "@shared/ui/playerAvatar/PlayerAvatar";

type LeaderboardSettlementShowcaseProps = {
  room: RoomState["room"];
  participants: RoomParticipant[];
  playlistItems?: PlaylistItem[];
  playedQuestionCount: number;
  meClientId?: string;
  matchId?: string | null;
  questionRecaps?: SettlementQuestionRecap[];
  rankChangeByClientId?: Record<string, number | null>;
  leaderboardSettlement?: LeaderboardSettlementResponse | null;
  leaderboardSettlementLoading?: boolean;
  leaderboardSettlementError?: string | null;
  onRefreshLeaderboardSettlement?: () => void | Promise<void>;
  isFavorited?: boolean;
  onToggleFavorite?: () => void | Promise<void>;
  onRetry?: () => void;
  onBackToLobby?: () => void;
};

type LeaderboardMetricRow = {
  clientId: string;
  rank: number;
  username: string;
  avatarUrl: string | null;
  score: number;
  correctCount: number;
  combo: number;
  avgCorrectMs: number | null;
  isMe: boolean;
  rankChange: number | null;
};

type LeaderboardQuestionRow = {
  key: string;
  title: string;
  artist: string;
  thumbnail: string | null;
  result: SettlementQuestionResult;
  badgeLabel: string;
  badgeTone: "success" | "warning" | "danger" | "neutral";
  answerTimeLabel: string;
  scoreGain: number | null;
};

type PersonalSummary = {
  me: RoomParticipant | null;
  myRank: number;
  rankPercentile: number;
  scoreGapToPrev: number | null;
  myRankChange: number | null;
  accuracy: number;
  combo: number;
  avgCorrectMs: number | null;
};

type QuestionListRowProps = {
  items: LeaderboardQuestionRow[];
};

type LeaderboardListRowProps = {
  rows: LeaderboardMetricRow[];
  playedQuestionCount: number;
};

type QuestionFilterType = "correct" | "wrong" | "unanswered" | null;

const scoreFormatter = new Intl.NumberFormat("zh-TW");

const sortParticipants = (participants: RoomParticipant[]) =>
  [...participants].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const comboA = Math.max(a.maxCombo ?? 0, a.combo ?? 0);
    const comboB = Math.max(b.maxCombo ?? 0, b.combo ?? 0);
    if (comboB !== comboA) return comboB - comboA;
    const avgA =
      typeof a.avgCorrectMs === "number" && Number.isFinite(a.avgCorrectMs)
        ? a.avgCorrectMs
        : Number.POSITIVE_INFINITY;
    const avgB =
      typeof b.avgCorrectMs === "number" && Number.isFinite(b.avgCorrectMs)
        ? b.avgCorrectMs
        : Number.POSITIVE_INFINITY;
    if (avgA !== avgB) return avgA - avgB;
    return a.joinedAt - b.joinedAt;
  });

const formatScore = (value: number) => scoreFormatter.format(Math.max(0, value));
const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const formatSeconds = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "--";
  }
  return `${(value / 1000).toFixed(2)} 秒`;
};

const formatAnswerTime = (value: number | null | undefined) => {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "--";
  }
  return `${(value / 1000).toFixed(2)}s`;
};

const formatVariantLabel = (
  room: RoomState["room"],
  playedQuestionCount: number,
) => {
  const variantKey = room.gameSettings?.leaderboardVariantKey;
  const timeLimitSec = room.gameSettings?.leaderboardTimeLimitSec ?? 0;
  const questionCount =
    room.gameSettings?.leaderboardTargetQuestionCount ??
    room.gameSettings?.questionCount ??
    playedQuestionCount;

  if (variantKey === "15m" || timeLimitSec > 0) {
    const minute = Math.max(1, Math.round(timeLimitSec / 60) || 15);
    return `${minute} 分鐘`;
  }

  return `${Math.max(1, questionCount || 30)} 題`;
};

const getScoreGain = (breakdown: QuestionScoreBreakdown | null | undefined) => {
  if (!breakdown) return null;
  return typeof breakdown.totalGainPoints === "number" &&
    Number.isFinite(breakdown.totalGainPoints)
    ? breakdown.totalGainPoints
    : null;
};

const getPercentileLabel = (
  values: number[],
  current: number | null,
  direction: "higher" | "lower",
) => {
  if (current === null || values.length <= 1) return null;
  const compareCount = values.filter((value) =>
    direction === "higher" ? current > value : current < value,
  ).length;
  return Math.round((compareCount / Math.max(1, values.length - 1)) * 100);
};

const useElementWidth = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const target = ref.current;
    if (!target || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const nextWidth = Math.round(entries[0]?.contentRect.width ?? 0);
      setWidth((prev) => (prev === nextWidth ? prev : nextWidth));
    });
    observer.observe(target);
    setWidth(Math.round(target.getBoundingClientRect().width));
    return () => observer.disconnect();
  }, []);

  return { ref, width };
};

const badgeToneClass: Record<LeaderboardQuestionRow["badgeTone"], string> = {
  success:
    "border-emerald-300/35 bg-emerald-500/14 text-emerald-100 shadow-[inset_0_0_0_1px_rgba(110,231,183,0.04)]",
  warning:
    "border-amber-300/35 bg-amber-500/14 text-amber-100 shadow-[inset_0_0_0_1px_rgba(252,211,77,0.04)]",
  danger:
    "border-rose-300/35 bg-rose-500/14 text-rose-100 shadow-[inset_0_0_0_1px_rgba(253,164,175,0.04)]",
  neutral:
    "border-slate-500/45 bg-slate-700/40 text-slate-100",
};

const SummaryMetric = memo(function SummaryMetric({
  icon,
  label,
  value,
  note,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[52px_minmax(0,1fr)] items-center gap-3 px-1 py-1.5">
      <div className="inline-flex h-11 w-11 items-center justify-center text-amber-100">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] tracking-[0.18em] text-[var(--mc-text-muted)]">
          {label}
        </div>
        <div className="mt-0.5 text-[1.85rem] font-black leading-none text-amber-50">
          {value}
        </div>
        <div className="mt-1.5 text-sm text-[var(--mc-text-muted)]">{note}</div>
      </div>
    </div>
  );
});

const RankChangeBadge = memo(function RankChangeBadge({
  value,
}: {
  value: number | null | undefined;
}) {
  if (value === null || value === undefined) {
    return (
      <span className="inline-flex min-w-[72px] items-center justify-center rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-0.5 text-xs text-[var(--mc-text-muted)]">
        --
      </span>
    );
  }

  if (value > 0) {
    return (
      <span className="inline-flex min-w-[72px] items-center justify-center gap-1 rounded-full border border-emerald-400/22 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400">
        <TrendingUpRoundedIcon sx={{ fontSize: 14 }} />
        {value}
      </span>
    );
  }

  if (value < 0) {
    return (
      <span className="inline-flex min-w-[72px] items-center justify-center gap-1 rounded-full border border-rose-400/22 bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400">
        <TrendingDownRoundedIcon sx={{ fontSize: 14 }} />
        {Math.abs(value)}
      </span>
    );
  }

  return (
    <span className="inline-flex min-w-[72px] items-center justify-center rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-0.5 text-xs text-[var(--mc-text-muted)]">
      --
    </span>
  );
});

const QuestionListRow = memo(function QuestionListRow({
  index,
  style,
  items,
}: RowComponentProps<QuestionListRowProps>) {
  const item = items[index];
  if (!item) return null;

  return (
    <div style={style} className="box-border px-0 pb-2.5">
      <div className="grid h-[88px] grid-cols-[72px_minmax(0,1fr)_112px] items-center gap-3 rounded-[20px] border border-white/6 bg-white/[0.02] px-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <div className="h-[60px] w-[60px] overflow-hidden rounded-xl border border-white/8 bg-[linear-gradient(145deg,rgba(59,130,246,0.2),rgba(147,51,234,0.14))]">
          {item.thumbnail ? (
            <img
              src={item.thumbnail}
              alt={item.title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-amber-100/80">
              <BarChartRoundedIcon sx={{ fontSize: 20 }} />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <div className="truncate text-base font-semibold text-[var(--mc-text)]">
            {item.title}
          </div>
          <div className="mt-0.5 truncate text-sm text-[var(--mc-text-muted)]">
            {item.artist}
          </div>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex min-w-[80px] items-center justify-center rounded-xl border px-2.5 py-1.5 text-xs font-bold tracking-[0.08em] ${badgeToneClass[item.badgeTone]}`}
          >
            {item.badgeLabel}
          </span>
          <div className="mt-1.5 text-sm font-semibold text-[var(--mc-text-muted)]">
            {item.answerTimeLabel}
          </div>
        </div>
      </div>
    </div>
  );
});

const LeaderboardDesktopRow = memo(function LeaderboardDesktopRow({
  index,
  style,
  rows,
  playedQuestionCount,
}: RowComponentProps<LeaderboardListRowProps>) {
  const row = rows[index];
  if (!row) return null;

  return (
    <div style={style} className="box-border pb-1.5">
      <div
        className={`grid grid-cols-[52px_minmax(180px,1.65fr)_112px_112px_112px_108px_112px] items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
          row.isMe
            ? "border-amber-300/45 bg-amber-500/10 shadow-[inset_0_0_0_1px_rgba(252,211,77,0.08)]"
            : "border-white/6 bg-white/[0.02]"
        }`}
      >
        <div className="text-base font-black text-amber-100">{row.rank}</div>
        <div className="flex min-w-0 items-center gap-2">
          <PlayerAvatar
            username={row.username}
            clientId={row.clientId}
            avatarUrl={row.avatarUrl}
            size={32}
            rank={row.rank}
            combo={row.combo}
            isMe={row.isMe}
            hideRankMark
            loading="lazy"
          />
          <div className="truncate text-sm font-semibold text-[var(--mc-text)]">
            {row.username}
            {row.isMe ? "（你）" : ""}
          </div>
        </div>
        <div className="text-center text-xs text-[var(--mc-text-muted)]">
          {row.correctCount} / {playedQuestionCount}
        </div>
        <div className="text-center text-xs font-semibold text-violet-300">
          x{row.combo}
        </div>
        <div className="text-center text-xs text-[var(--mc-text-muted)]">
          {formatSeconds(row.avgCorrectMs)}
        </div>
        <div className="text-center text-base font-black text-amber-100">
          {formatScore(row.score)}
        </div>
        <div className="flex min-w-0 items-center justify-center">
          <RankChangeBadge value={row.rankChange} />
        </div>
      </div>
    </div>
  );
});

const LeaderboardMobileRow = memo(function LeaderboardMobileRow({
  index,
  style,
  rows,
  playedQuestionCount,
}: RowComponentProps<LeaderboardListRowProps>) {
  const row = rows[index];
  if (!row) return null;

  return (
    <div style={style} className="box-border pb-2">
      <div
        className={`rounded-[18px] border px-3 py-3 ${
          row.isMe
            ? "border-amber-300/45 bg-amber-500/10 shadow-[inset_0_0_0_1px_rgba(252,211,77,0.08)]"
            : "border-white/6 bg-white/[0.02]"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="text-base font-black text-amber-100">#{row.rank}</div>
            <PlayerAvatar
              username={row.username}
              clientId={row.clientId}
              avatarUrl={row.avatarUrl}
              size={30}
              rank={row.rank}
              combo={row.combo}
              isMe={row.isMe}
              hideRankMark
              loading="lazy"
            />
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[var(--mc-text)]">
                {row.username}
                {row.isMe ? "（你）" : ""}
              </div>
              <div className="mt-0.5 text-xs text-[var(--mc-text-muted)]">
                答對 / 題數 {row.correctCount} / {playedQuestionCount}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-black text-amber-100">
              {formatScore(row.score)}
            </div>
            <div className="mt-0.5 text-xs text-violet-300">
              Combo x{row.combo}
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-[var(--mc-text-muted)]">
          平均答題 {formatSeconds(row.avgCorrectMs)}
        </div>
      </div>
    </div>
  );
});

const LeaderboardSkeleton = memo(function LeaderboardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="mt-2 space-y-1.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-xl border border-white/6 bg-white/[0.02] px-3 py-2"
        >
          <div className="flex items-center gap-3">
            <div className="h-4 w-7 rounded bg-white/10" />
            <div className="h-7 w-7 rounded-full bg-white/10" />
            <div className="h-3.5 flex-1 rounded bg-white/10" />
            <div className="h-3.5 w-14 rounded bg-white/10" />
            <div className="h-3.5 w-14 rounded bg-white/10" />
            <div className="h-4 w-16 rounded bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  );
});

const LeaderboardSettlementShowcase: React.FC<
  LeaderboardSettlementShowcaseProps
> = ({
  room,
  participants,
  playlistItems = [],
  playedQuestionCount,
  meClientId,
  matchId = null,
  questionRecaps = [],
  rankChangeByClientId,
  leaderboardSettlement = null,
  leaderboardSettlementLoading = false,
  leaderboardSettlementError = null,
  onRefreshLeaderboardSettlement,
  isFavorited,
  onToggleFavorite,
  onRetry,
  onBackToLobby,
}) => {
  const isDesktopLayout = useMediaQuery("(min-width: 1280px)");
  const listRowHeight = 100;
  const { ref: questionListRef, width: questionListWidth } = useElementWidth();
  const [questionFilter, setQuestionFilter] = useState<QuestionFilterType>(null);

  const challengeVariantLabel = useMemo(
    () => formatVariantLabel(room, playedQuestionCount),
    [playedQuestionCount, room],
  );

  const sortedParticipants = useMemo(
    () => sortParticipants(participants),
    [participants],
  );
  const backendCurrentRun = leaderboardSettlement?.currentRun ?? null;
  const personalBestComparison =
    leaderboardSettlement?.personalBestComparison ?? null;
  const backendTopEntries = leaderboardSettlement?.leaderboardTop ?? [];
  const backendAroundMeEntries =
    leaderboardSettlement?.leaderboardAroundMe ?? [];
  const localMyIndex = sortedParticipants.findIndex(
    (participant) => participant.clientId === meClientId,
  );
  const localMe =
    localMyIndex >= 0 ? sortedParticipants[localMyIndex] : sortedParticipants[0] ?? null;

  const meSummary = useMemo<PersonalSummary>(() => {
    if (!localMe && !backendCurrentRun) {
      return {
        me: null,
        myRank: 0,
        rankPercentile: 0,
        scoreGapToPrev: null,
        myRankChange: null,
        accuracy: 0,
        combo: 0,
        avgCorrectMs: null,
      };
    }

    const total = sortedParticipants.length;
    const rank = localMyIndex >= 0 ? localMyIndex + 1 : 1;
    const previous = localMyIndex > 0 ? sortedParticipants[localMyIndex - 1] : null;
    const fallbackQuestionCount = Math.max(playedQuestionCount, 1);
    const localAccuracy =
      localMe && fallbackQuestionCount > 0
        ? (((localMe.correctCount ?? 0) / fallbackQuestionCount) * 100)
        : 0;

    return {
      me: localMe,
      myRank: backendCurrentRun?.rank ?? rank,
      rankPercentile:
        backendCurrentRun?.percentile ??
        (total <= 1 ? 100 : Math.round(((total - rank) / (total - 1)) * 100)),
      scoreGapToPrev:
        backendCurrentRun?.gapToPrevious ?? (previous && localMe ? previous.score - localMe.score : null),
      myRankChange:
        backendCurrentRun?.rankChange ??
        (localMe && rankChangeByClientId
          ? (rankChangeByClientId[localMe.clientId] ?? null)
          : null),
      accuracy:
        backendCurrentRun && backendCurrentRun.questionCount > 0
          ? (backendCurrentRun.correctCount / backendCurrentRun.questionCount) * 100
          : localAccuracy,
      combo:
        backendCurrentRun?.maxCombo ??
        Math.max(localMe?.maxCombo ?? 0, localMe?.combo ?? 0),
      avgCorrectMs:
        backendCurrentRun?.avgCorrectMs ??
        (typeof localMe?.avgCorrectMs === "number" &&
        Number.isFinite(localMe.avgCorrectMs)
          ? localMe.avgCorrectMs
          : null),
    };
  }, [
    backendCurrentRun,
    localMe,
    localMyIndex,
    playedQuestionCount,
    rankChangeByClientId,
    sortedParticipants,
  ]);

  const percentileMetrics = useMemo(() => {
    const accuracyValues = sortedParticipants.map((participant) =>
      playedQuestionCount > 0
        ? ((participant.correctCount ?? 0) / playedQuestionCount) * 100
        : 0,
    );
    const comboValues = sortedParticipants.map((participant) =>
      Math.max(participant.maxCombo ?? 0, participant.combo ?? 0),
    );
    const speedValues = sortedParticipants
      .map((participant) =>
        typeof participant.avgCorrectMs === "number" &&
        Number.isFinite(participant.avgCorrectMs)
          ? participant.avgCorrectMs
          : null,
      )
      .filter((value): value is number => value !== null);

    return {
      accuracyPercentile: getPercentileLabel(
        accuracyValues,
        meSummary.me ? meSummary.accuracy : null,
        "higher",
      ),
      comboPercentile: getPercentileLabel(
        comboValues,
        meSummary.me ? meSummary.combo : null,
        "higher",
      ),
      speedPercentile: getPercentileLabel(
        speedValues,
        meSummary.avgCorrectMs,
        "lower",
      ),
    };
  }, [meSummary, playedQuestionCount, sortedParticipants]);

  const effectiveLeaderboardRows = useMemo<LeaderboardMetricRow[]>(() => {
    if (backendTopEntries.length > 0) {
      return backendTopEntries.map((entry) => ({
        clientId: entry.userId ?? `ranked-${entry.rank}-${entry.displayName}`,
        rank: entry.rank,
        username: entry.displayName,
        avatarUrl: entry.avatarUrl ?? null,
        score: entry.score,
        correctCount: entry.correctCount,
        combo: entry.maxCombo,
        avgCorrectMs: entry.avgCorrectMs,
        isMe: Boolean(entry.isMe),
        rankChange:
          entry.isMe && backendCurrentRun
            ? backendCurrentRun.rankChange
            : null,
      }));
    }

    return sortedParticipants.map((participant, index) => ({
      clientId: participant.clientId,
      rank: index + 1,
      username: participant.username,
      avatarUrl: participant.avatarUrl ?? participant.avatar_url ?? null,
      score: participant.score,
      correctCount: participant.correctCount ?? 0,
      combo: Math.max(participant.maxCombo ?? 0, participant.combo ?? 0),
      avgCorrectMs:
        typeof participant.avgCorrectMs === "number" &&
        Number.isFinite(participant.avgCorrectMs)
          ? participant.avgCorrectMs
          : null,
      isMe: participant.clientId === meClientId,
      rankChange:
        rankChangeByClientId?.[participant.clientId] ?? null,
    }));
  }, [
    backendCurrentRun,
    backendTopEntries,
    meClientId,
    rankChangeByClientId,
    sortedParticipants,
  ]);

  const aroundMeRows = useMemo<LeaderboardMetricRow[]>(() => {
    if (backendAroundMeEntries.length === 0) return [];
    return backendAroundMeEntries.map((entry) => ({
      clientId: entry.userId ?? `around-${entry.rank}-${entry.displayName}`,
      rank: entry.rank,
      username: entry.displayName,
      avatarUrl: entry.avatarUrl ?? null,
      score: entry.score,
      correctCount: entry.correctCount,
      combo: entry.maxCombo,
      avgCorrectMs: entry.avgCorrectMs,
      isMe: Boolean(entry.isMe),
      rankChange:
        entry.isMe && backendCurrentRun ? backendCurrentRun.rankChange : null,
    }));
  }, [backendAroundMeEntries, backendCurrentRun]);

  const shouldShowAroundMe = useMemo(() => {
    if (aroundMeRows.length === 0) return false;
    const hasMeInTop = effectiveLeaderboardRows.some((row) => row.isMe);
    return !hasMeInTop || (backendCurrentRun?.rank ?? 0) > effectiveLeaderboardRows.length;
  }, [aroundMeRows.length, backendCurrentRun?.rank, effectiveLeaderboardRows]);

  const coverThumbnail =
    leaderboardSettlement?.collection?.coverThumbnailUrl ??
    questionRecaps.find((item) => item.thumbnail)?.thumbnail ??
    playlistItems.find((item) => item.thumbnail)?.thumbnail ??
    null;

  const playlistSummary = useMemo(() => {
    return {
      title: room.playlist.title?.trim() || room.name || "排行榜歌單",
      count:
        room.gameSettings?.leaderboardTargetQuestionCount ??
        room.gameSettings?.questionCount ??
        playedQuestionCount,
    };
  }, [playedQuestionCount, room]);

  const questionRows = useMemo<LeaderboardQuestionRow[]>(() => {
    if (questionRecaps.length === 0) {
      return playlistItems.slice(0, playedQuestionCount).map((item, index) => ({
        key: item.sourceId ?? item.videoId ?? item.url ?? `fallback-${index}`,
        title: item.answerText?.trim() || item.title?.trim() || `第 ${index + 1} 題`,
        artist: item.uploader?.trim() || "未知歌手",
        thumbnail: item.thumbnail ?? null,
        result: "unanswered",
        badgeLabel: "未作答",
        badgeTone: "neutral" as const,
        answerTimeLabel: "--",
        scoreGain: null,
      }));
    }

    return questionRecaps.map((recap) => {
      const answer = meClientId ? recap.answersByClientId?.[meClientId] : null;
      const result = answer?.result ?? recap.myResult ?? "unanswered";
      const answerTime =
        typeof answer?.answeredAtMs === "number" &&
        Number.isFinite(answer.answeredAtMs)
          ? answer.answeredAtMs
          : result === "correct"
            ? recap.fastestCorrectMs ?? null
            : null;
      const scoreGain = getScoreGain(answer?.scoreBreakdown);

      if (result === "correct" && typeof answerTime === "number" && answerTime < 2000) {
        return {
          key: recap.key,
          title: recap.title,
          artist: recap.uploader,
          thumbnail: recap.thumbnail ?? null,
          result,
          badgeLabel: "PERFECT!",
          badgeTone: "warning" as const,
          answerTimeLabel: formatAnswerTime(answerTime),
          scoreGain,
        };
      }

      if (result === "correct") {
        return {
          key: recap.key,
          title: recap.title,
          artist: recap.uploader,
          thumbnail: recap.thumbnail ?? null,
          result,
          badgeLabel: "答對",
          badgeTone: "success" as const,
          answerTimeLabel: formatAnswerTime(answerTime),
          scoreGain,
        };
      }

      if (result === "wrong") {
        return {
          key: recap.key,
          title: recap.title,
          artist: recap.uploader,
          thumbnail: recap.thumbnail ?? null,
          result,
          badgeLabel: "答錯",
          badgeTone: "danger" as const,
          answerTimeLabel: formatAnswerTime(answerTime),
          scoreGain,
        };
      }

      return {
        key: recap.key,
        title: recap.title,
        artist: recap.uploader,
        thumbnail: recap.thumbnail ?? null,
        result,
        badgeLabel: "未作答",
        badgeTone: "neutral" as const,
        answerTimeLabel: "--",
        scoreGain,
      };
    });
  }, [meClientId, playedQuestionCount, playlistItems, questionRecaps]);

  const answerOverview = useMemo(
    () =>
      questionRows.reduce(
        (acc, item) => {
          if (item.result === "correct") acc.correct += 1;
          else if (item.result === "wrong") acc.wrong += 1;
          else acc.unanswered += 1;
          return acc;
        },
        { correct: 0, wrong: 0, unanswered: 0 },
      ),
    [questionRows],
  );

  const filteredQuestionRows = useMemo(
    () =>
      questionFilter !== null
        ? questionRows.filter((item) => item.result === questionFilter)
        : questionRows,
    [questionRows, questionFilter],
  );

  const rankingSummaryLabel = useMemo(() => {
    if (backendCurrentRun?.rank && backendCurrentRun.rank > 1) {
      if (backendCurrentRun.gapToPrevious !== null) {
        return `距離前一名還差 ${formatScore(backendCurrentRun.gapToPrevious)} 分`;
      }
      return `目前全球排名第 ${backendCurrentRun.rank} 名`;
    }
    if (backendCurrentRun?.rank === 1) {
      return "目前位居榜首";
    }
    if (effectiveLeaderboardRows.length === 0) {
      return leaderboardSettlementLoading
        ? "正在載入全球排行榜..."
        : "顯示本場即時結算";
    }
    if (meSummary.myRank > 1 && meSummary.scoreGapToPrev !== null) {
      return `距離前一名還差 ${formatScore(meSummary.scoreGapToPrev)} 分`;
    }
    if (meSummary.myRank === 1) {
      return "目前位居榜首";
    }
    return `顯示前 ${Math.min(10, effectiveLeaderboardRows.length || 10)} 名`;
  }, [
    backendCurrentRun?.gapToPrevious,
    backendCurrentRun?.rank,
    effectiveLeaderboardRows.length,
    leaderboardSettlementLoading,
    meSummary.myRank,
    meSummary.scoreGapToPrev,
  ]);

  const leaderboardDesktopHeight = Math.min(
    340,
    Math.max(60, effectiveLeaderboardRows.length * 60),
  );
  const leaderboardMobileHeight = Math.min(
    400,
    Math.max(96, effectiveLeaderboardRows.length * 96),
  );
  const handleLeaderboardRowsRendered = useCallback(
    (_payload: { startIndex: number; stopIndex: number }) => {},
    [],
  );

  const scoreSummaryLabel = useMemo(() => {
    if (backendCurrentRun?.rank === 1) return "已經位居榜首";
    if (backendCurrentRun != null && backendCurrentRun.gapToPrevious !== null) {
      return `距離前一名 ${formatScore(backendCurrentRun.gapToPrevious)} 分`;
    }
    if (backendCurrentRun != null && backendCurrentRun.gapToFirst !== null) {
      return `距離第一名 ${formatScore(backendCurrentRun.gapToFirst)} 分`;
    }
    if (!meSummary.me) return "顯示本場分數";
    if (meSummary.scoreGapToPrev === null) return "顯示本場分數";
    return `距離前一名 ${formatScore(meSummary.scoreGapToPrev)} 分`;
  }, [backendCurrentRun, meSummary]);

  const questionListHeight = useMemo(() => {
    const target = filteredQuestionRows.length * listRowHeight;
    if (filteredQuestionRows.length <= 0) return 220;
    return Math.max(
      Math.min(target, isDesktopLayout ? 620 : 480),
      Math.min(filteredQuestionRows.length, 4) * listRowHeight,
    );
  }, [filteredQuestionRows.length, isDesktopLayout, listRowHeight]);

  const currentScore = backendCurrentRun?.score ?? meSummary.me?.score ?? 0;
  const prevBestScore = personalBestComparison?.previousBestScore ?? null;
  const scoreDelta =
    prevBestScore !== null ? currentScore - prevBestScore : null;

  const filterLabels: Record<Exclude<QuestionFilterType, null>, string> = {
    correct: "答對",
    wrong: "答錯",
    unanswered: "未作答",
  };
  const filterEmptyMessages: Record<Exclude<QuestionFilterType, null>, string> = {
    correct: "沒有答對的題目",
    wrong: "沒有答錯的題目",
    unanswered: "沒有未作答的題目",
  };

  return (
    <div className="mx-auto w-full max-w-[1820px] min-w-0 px-3 pb-6 pt-2 sm:px-4 xl:px-5">
      <section className="relative overflow-hidden rounded-[28px] border border-amber-300/14 bg-[radial-gradient(circle_at_8%_0%,rgba(245,158,11,0.16),transparent_24%),radial-gradient(circle_at_100%_20%,rgba(8,145,178,0.08),transparent_28%),linear-gradient(180deg,rgba(7,8,10,0.98),rgba(8,10,14,0.98))] px-4 py-4 text-[var(--mc-text)] shadow-[0_38px_100px_-68px_rgba(245,158,11,0.56)] sm:px-5 sm:py-5">
        <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] [background-size:22px_22px]" />
        <div className="relative">
          <div className="flex flex-col gap-3 border-b border-amber-300/14 pb-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(180deg,rgba(245,158,11,0.12),rgba(120,53,15,0.1))] text-amber-100">
                  <BarChartRoundedIcon sx={{ fontSize: 26 }} />
                </div>
                <div className="min-w-0">
                  <h1 className="mt-1 text-[1.5rem] font-black tracking-[0.07em] text-amber-50 sm:text-[1.9rem]">
                    排行挑戰（{challengeVariantLabel}）
                  </h1>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                type="button"
                onClick={onRetry}
                disabled={!onRetry}
                className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-xl border border-amber-300/45 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-amber-500/18 disabled:cursor-not-allowed disabled:border-amber-300/15 disabled:bg-white/[0.02] disabled:text-amber-100/35"
              >
                <RefreshRoundedIcon sx={{ fontSize: 16 }} />
                再挑戰一次
              </button>
              <button
                type="button"
                onClick={onBackToLobby}
                className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-2 text-sm font-semibold text-[var(--mc-text)] transition hover:border-white/20 hover:bg-white/[0.04]"
              >
                <HomeRoundedIcon sx={{ fontSize: 16 }} />
                返回大廳
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,0.7fr)]">
            <div className="min-w-0 space-y-4">
              <article className="rounded-[24px] border border-amber-300/16 bg-[radial-gradient(circle_at_12%_8%,rgba(245,158,11,0.08),transparent_28%),linear-gradient(180deg,rgba(28,20,10,0.78),rgba(8,10,14,0.92))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="grid gap-4 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.1fr)]">
                  <div className="border-b border-amber-300/14 pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
                    <div className="text-center text-lg font-semibold text-amber-50/92">
                      全球名次
                    </div>
                    <div className="mt-4 flex items-center justify-center gap-5">
                      <AutoAwesomeRoundedIcon className="hidden text-amber-300/65 sm:block" sx={{ fontSize: 30 }} />
                      <div className="text-[4rem] font-black leading-none text-amber-200 drop-shadow-[0_14px_32px_rgba(245,158,11,0.3)] sm:text-[5rem]">
                        #{meSummary.myRank || "--"}
                      </div>
                      <AutoAwesomeRoundedIcon className="hidden rotate-180 text-amber-300/65 sm:block" sx={{ fontSize: 30 }} />
                    </div>
                    <div className="mt-3 flex justify-center">
                      <span className="inline-flex items-center rounded-full border border-amber-300/30 bg-amber-500/10 px-3 py-1.5 text-sm font-bold text-amber-100">
                        勝過 {meSummary.rankPercentile}% 的玩家
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="text-center text-lg font-semibold text-amber-50/92">
                      本場得分
                    </div>
                    <div className="mt-3 text-center text-[3rem] font-black leading-none tracking-tight text-amber-200 drop-shadow-[0_14px_32px_rgba(245,158,11,0.28)] sm:text-[4rem]">
                      {formatScore(currentScore)}
                    </div>
                    {scoreDelta !== null && scoreDelta !== 0 && (
                      <div className="mt-1.5 flex items-center justify-center gap-1">
                        {scoreDelta > 0 ? (
                          <span className="inline-flex items-center gap-0.5 text-base font-semibold text-emerald-400">
                            <TrendingUpRoundedIcon sx={{ fontSize: 16 }} />
                            {formatScore(scoreDelta)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-base font-semibold text-rose-400">
                            <TrendingDownRoundedIcon sx={{ fontSize: 16 }} />
                            {formatScore(Math.abs(scoreDelta))}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-[var(--mc-text-muted)]">
                      {meSummary.myRankChange !== null && (
                        <>
                          {meSummary.myRankChange > 0 ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
                              <TrendingUpRoundedIcon sx={{ fontSize: 16 }} />
                              升了 {meSummary.myRankChange}
                            </span>
                          ) : meSummary.myRankChange < 0 ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-400">
                              <TrendingDownRoundedIcon sx={{ fontSize: 16 }} />
                              降了 {Math.abs(meSummary.myRankChange)}
                            </span>
                          ) : (
                            <span className="text-[var(--mc-text-muted)]">持平</span>
                          )}
                          <span className="hidden h-4 w-px bg-white/10 sm:block" />
                        </>
                      )}
                      <span>{scoreSummaryLabel}</span>
                      {backendCurrentRun?.isPersonalBest && (
                        <>
                          <span className="hidden h-4 w-px bg-white/10 sm:block" />
                          <span className="font-semibold text-emerald-400">
                            新個人最佳
                          </span>
                        </>
                      )}
                      {personalBestComparison &&
                        !personalBestComparison.hasPreviousBest && (
                        <>
                          <span className="hidden h-4 w-px bg-white/10 sm:block" />
                          <span className="font-semibold text-sky-300">
                            首次紀錄
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <SummaryMetric
                    icon={<TrackChangesRoundedIcon sx={{ fontSize: 28 }} />}
                    label="答對率"
                    value={formatPercent(meSummary.accuracy)}
                    note={
                      percentileMetrics.accuracyPercentile === null
                        ? "等待更多玩家資料"
                        : `高於 ${percentileMetrics.accuracyPercentile}% 的玩家`
                    }
                  />
                  <SummaryMetric
                    icon={<WorkspacePremiumRoundedIcon sx={{ fontSize: 30 }} />}
                    label="最大 Combo"
                    value={`x${meSummary.combo}`}
                    note={
                      percentileMetrics.comboPercentile === null
                        ? "等待更多玩家資料"
                        : `超越 ${percentileMetrics.comboPercentile}% 的玩家`
                    }
                  />
                  <SummaryMetric
                    icon={<BoltRoundedIcon sx={{ fontSize: 28 }} />}
                    label="平均答題"
                    value={formatSeconds(meSummary.avgCorrectMs)}
                    note={
                      percentileMetrics.speedPercentile === null
                        ? "等待更多玩家資料"
                        : `快於 ${percentileMetrics.speedPercentile}% 的玩家`
                    }
                  />
                </div>
              </article>

              <article className="rounded-[24px] border border-amber-300/16 bg-[linear-gradient(180deg,rgba(17,18,20,0.94),rgba(11,12,16,0.96))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-300/12 pb-3">
                  <h2 className="text-[1.5rem] font-black tracking-[0.06em] text-amber-100">
                    排行榜
                  </h2>
                  <div className="rounded-full border border-amber-300/18 bg-amber-500/8 px-3 py-1.5 text-xs font-semibold text-amber-100/88">
                    {rankingSummaryLabel}
                  </div>
                </div>

                <div className="mt-3 hidden grid-cols-[52px_minmax(180px,1.65fr)_112px_112px_112px_108px_112px] gap-2 px-3 text-xs font-semibold text-amber-100/78 xl:grid">
                  <div>名次</div>
                  <div>玩家</div>
                  <div className="text-center">答對 / 題數</div>
                  <div className="text-center">最大 Combo</div>
                  <div className="text-center">平均答題</div>
                  <div className="text-center">分數</div>
                  <div className="text-center">排名變化</div>
                </div>

                {leaderboardSettlementLoading && effectiveLeaderboardRows.length === 0 ? (
                  <>
                    <div className="mt-2 hidden xl:block">
                      <LeaderboardSkeleton count={6} />
                    </div>
                    <div className="mt-2 xl:hidden">
                      <LeaderboardSkeleton count={4} />
                    </div>
                  </>
                ) : effectiveLeaderboardRows.length > 0 ? (
                  <>
                    <div className="mt-2 hidden xl:block">
                      <List
                        rowComponent={LeaderboardDesktopRow}
                        rowCount={effectiveLeaderboardRows.length}
                        rowHeight={60}
                        rowProps={{
                          rows: effectiveLeaderboardRows,
                          playedQuestionCount,
                        }}
                        overscanCount={5}
                        defaultHeight={leaderboardDesktopHeight}
                        onRowsRendered={handleLeaderboardRowsRendered}
                        style={{ height: leaderboardDesktopHeight, width: "100%" }}
                      />
                    </div>

                    <div className="mt-2 xl:hidden">
                      <List
                        rowComponent={LeaderboardMobileRow}
                        rowCount={effectiveLeaderboardRows.length}
                        rowHeight={96}
                        rowProps={{
                          rows: effectiveLeaderboardRows,
                          playedQuestionCount,
                        }}
                        overscanCount={5}
                        defaultHeight={leaderboardMobileHeight}
                        onRowsRendered={handleLeaderboardRowsRendered}
                        style={{ height: leaderboardMobileHeight, width: "100%" }}
                      />
                    </div>
                  </>
                ) : (
                  <div className="mt-3 rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-[var(--mc-text-muted)]">
                    {leaderboardSettlementError
                      ? "全球排行榜載入失敗，先顯示本場即時結果。"
                      : "目前僅顯示本場即時結果。"}
                  </div>
                )}
                {leaderboardSettlementError && onRefreshLeaderboardSettlement && (
                  <div className="mt-2.5 flex justify-center">
                    <button
                      type="button"
                      onClick={onRefreshLeaderboardSettlement}
                      className="inline-flex items-center gap-2 rounded-full border border-amber-300/18 bg-amber-500/8 px-3 py-1.5 text-xs font-semibold text-amber-100/88 transition hover:bg-amber-500/14"
                    >
                      <RefreshRoundedIcon sx={{ fontSize: 14 }} />
                      重新載入全球排行榜
                    </button>
                  </div>
                )}
              </article>

              {shouldShowAroundMe && (
                <article className="rounded-[24px] border border-amber-300/16 bg-[linear-gradient(180deg,rgba(17,18,20,0.94),rgba(11,12,16,0.96))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] sm:p-4">
                  <div className="flex items-center justify-between gap-2 border-b border-amber-300/12 pb-3">
                    <h2 className="text-lg font-black tracking-[0.04em] text-amber-100">
                      你的附近名次
                    </h2>
                    <div className="text-xs text-[var(--mc-text-muted)]">
                      顯示你的前後名次區間
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {aroundMeRows.map((row) => (
                      <div
                        key={row.clientId}
                        className={`grid grid-cols-[44px_minmax(0,1fr)_80px] items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                          row.isMe
                            ? "border-amber-300/45 bg-amber-500/10 shadow-[inset_0_0_0_1px_rgba(252,211,77,0.08)]"
                            : "border-white/6 bg-white/[0.02]"
                        }`}
                      >
                        <div className="text-base font-black text-amber-100">
                          #{row.rank}
                        </div>
                        <div className="flex min-w-0 items-center gap-2">
                          <PlayerAvatar
                            username={row.username}
                            clientId={row.clientId}
                            avatarUrl={row.avatarUrl}
                            size={28}
                            rank={row.rank}
                            combo={row.combo}
                            isMe={row.isMe}
                            hideRankMark
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-[var(--mc-text)]">
                              {row.username}
                            </div>
                            <div className="mt-0.5 text-xs text-[var(--mc-text-muted)]">
                              {row.correctCount} / {playedQuestionCount}
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-base font-black text-amber-100">
                          {formatScore(row.score)}
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              )}
            </div>

            <aside className="min-w-0">
              <article className="rounded-[24px] bg-transparent p-0 shadow-none">
                <div className="overflow-hidden rounded-[20px] bg-[linear-gradient(180deg,rgba(24,20,14,0.96),rgba(12,12,14,0.96))]">
                  <div className="relative h-[140px] w-full overflow-hidden bg-[linear-gradient(145deg,rgba(59,130,246,0.25),rgba(147,51,234,0.18))]">
                    {coverThumbnail ? (
                      <img
                        src={coverThumbnail}
                        alt={playlistSummary.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-amber-100/80">
                        <BarChartRoundedIcon sx={{ fontSize: 30 }} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3 pb-3">
                      <div className="min-w-0">
                        <div className="truncate text-[1.1rem] font-black tracking-[0.04em] text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.9)]">
                          {playlistSummary.title}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={onToggleFavorite}
                        disabled={!onToggleFavorite}
                        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          isFavorited
                            ? "border-amber-300/60 bg-amber-500/22 text-amber-300 hover:bg-amber-500/16"
                            : "border-white/30 bg-black/40 text-white hover:bg-black/60"
                        }`}
                        aria-label={isFavorited ? "取消收藏" : "加入收藏"}
                        aria-pressed={isFavorited ?? false}
                      >
                        {isFavorited ? <StarRoundedIcon sx={{ fontSize: 18 }} /> : <StarBorderRoundedIcon sx={{ fontSize: 18 }} />}
                      </button>
                    </div>
                  </div>

                  <div className="p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[18px] bg-white/[0.02] px-3 py-3">
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setQuestionFilter(
                            questionFilter === "correct" ? null : "correct",
                          )}
                          className={`rounded-full border px-2.5 py-1 font-semibold transition ${
                            questionFilter === "correct"
                              ? "border-emerald-300/55 bg-emerald-500/18 text-emerald-100"
                              : "border-emerald-300/30 bg-emerald-500/10 text-emerald-100/70 hover:bg-emerald-500/14"
                          }`}
                          aria-pressed={questionFilter === "correct"}
                        >
                          答對 {answerOverview.correct}
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuestionFilter(
                            questionFilter === "wrong" ? null : "wrong",
                          )}
                          className={`rounded-full border px-2.5 py-1 font-semibold transition ${
                            questionFilter === "wrong"
                              ? "border-rose-300/55 bg-rose-500/18 text-rose-100"
                              : "border-rose-300/30 bg-rose-500/10 text-rose-100/70 hover:bg-rose-500/14"
                          }`}
                          aria-pressed={questionFilter === "wrong"}
                        >
                          答錯 {answerOverview.wrong}
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuestionFilter(
                            questionFilter === "unanswered" ? null : "unanswered",
                          )}
                          className={`rounded-full border px-2.5 py-1 font-semibold transition ${
                            questionFilter === "unanswered"
                              ? "border-slate-500/55 bg-slate-700/50 text-slate-100"
                              : "border-slate-500/35 bg-slate-700/25 text-slate-100/70 hover:bg-slate-700/35"
                          }`}
                          aria-pressed={questionFilter === "unanswered"}
                        >
                          未作答 {answerOverview.unanswered}
                        </button>
                      </div>
                      <div className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-xs text-[var(--mc-text-muted)]">
                        共 {questionRows.length} 題
                      </div>
                    </div>
                  </div>
                </div>

                <div ref={questionListRef} className="mt-3 min-h-0">
                  {filteredQuestionRows.length > 0 && questionListWidth > 0 ? (
                    <List
                      rowComponent={QuestionListRow}
                      rowCount={filteredQuestionRows.length}
                      rowHeight={listRowHeight}
                      rowProps={{ items: filteredQuestionRows }}
                      overscanCount={5}
                      defaultHeight={questionListHeight}
                      style={{ height: questionListHeight, width: "100%" }}
                    />
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-[var(--mc-text-muted)]">
                      {questionFilter !== null
                        ? filterEmptyMessages[questionFilter]
                        : "目前沒有任何題目資訊"}
                    </div>
                  )}
                </div>
              </article>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
};

export default memo(LeaderboardSettlementShowcase);
