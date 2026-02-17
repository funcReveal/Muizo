import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Chip } from "@mui/material";
import { List as VirtualList, type RowComponentProps } from "react-window";

import type {
  ChatMessage,
  PlaylistItem,
  RoomParticipant,
  RoomState,
} from "../../model/types";

const SETTLEMENT_DURATION_PREFIXES = [
  "作答時間設定",
  "作答時間",
  "遊玩時間",
] as const;

interface GameSettlementPanelProps {
  room: RoomState["room"];
  participants: RoomParticipant[];
  messages: ChatMessage[];
  playlistItems: PlaylistItem[];
  trackOrder?: number[];
  playedQuestionCount: number;
  meClientId?: string;
  questionRecaps?: SettlementQuestionRecap[];
  onBackToLobby?: () => void;
  onRequestExit: () => void;
}

export type SettlementQuestionResult = "correct" | "wrong" | "unanswered";

export type SettlementQuestionChoice = {
  index: number;
  title: string;
  isCorrect: boolean;
  isSelectedByMe: boolean;
};

export type SettlementQuestionRecap = {
  key: string;
  order: number;
  trackIndex: number;
  title: string;
  uploader: string;
  duration: string | null;
  thumbnail: string | null;
  myResult: SettlementQuestionResult;
  myChoiceIndex: number | null;
  correctChoiceIndex: number;
  choices: SettlementQuestionChoice[];
};

type RecapRowProps = {
  items: SettlementQuestionRecap[];
  expandedKey: string | null;
  onToggle: (key: string) => void;
};

const RECAP_RESULT_META: Record<
  SettlementQuestionResult,
  { label: string; toneClass: string }
> = {
  correct: {
    label: "答對",
    toneClass: "border-emerald-300/45 bg-emerald-400/15 text-emerald-100",
  },
  wrong: {
    label: "答錯",
    toneClass: "border-rose-300/45 bg-rose-400/15 text-rose-100",
  },
  unanswered: {
    label: "未作答",
    toneClass: "border-slate-500/70 bg-slate-800/70 text-slate-200",
  },
};

const RecapRow: React.FC<RowComponentProps<RecapRowProps>> = ({
  index,
  style,
  items,
  expandedKey,
  onToggle,
}) => {
  const item = items[index];
  const resultMeta = RECAP_RESULT_META[item.myResult];
  const isExpanded = expandedKey === item.key;
  return (
    <div style={style} className="px-1 pb-2">
      <button
        type="button"
        className={`game-settlement-track-card w-full rounded-xl border px-3 py-2 text-left transition ${isExpanded
          ? "border-amber-300/60 bg-amber-400/12"
          : "border-slate-700/80 bg-slate-950/55 hover:border-slate-600"
          }`}
        onClick={() => onToggle(item.key)}
      >
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 flex-none items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/10 text-xs font-semibold text-amber-100">
            {item.order}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-100">
              {item.title}
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {item.uploader}
              {item.duration ? ` · ${item.duration}` : ""}
            </p>
          </div>
          <span
            className={`inline-flex flex-none items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${resultMeta.toneClass}`}
          >
            {resultMeta.label}
          </span>
        </div>
      </button>
    </div>
  );
};

const WINNER_CONFETTI = [
  {
    left: "6%",
    top: "20%",
    color: "bg-amber-300/90",
    size: "h-1.5 w-1.5",
    delayMs: 0,
    durationMs: 1700,
  },
  {
    left: "16%",
    top: "12%",
    color: "bg-sky-300/90",
    size: "h-2 w-2",
    delayMs: 140,
    durationMs: 2100,
  },
  {
    left: "28%",
    top: "26%",
    color: "bg-emerald-300/90",
    size: "h-1.5 w-1.5",
    delayMs: 280,
    durationMs: 1900,
  },
  {
    left: "72%",
    top: "14%",
    color: "bg-amber-200/90",
    size: "h-2 w-2",
    delayMs: 380,
    durationMs: 2200,
  },
  {
    left: "88%",
    top: "22%",
    color: "bg-rose-300/80",
    size: "h-1.5 w-1.5",
    delayMs: 540,
    durationMs: 2000,
  },
  {
    left: "84%",
    top: "70%",
    color: "bg-sky-300/85",
    size: "h-2 w-2",
    delayMs: 120,
    durationMs: 2300,
  },
  {
    left: "68%",
    top: "82%",
    color: "bg-emerald-300/90",
    size: "h-1.5 w-1.5",
    delayMs: 620,
    durationMs: 1750,
  },
  {
    left: "34%",
    top: "78%",
    color: "bg-amber-300/85",
    size: "h-2 w-2",
    delayMs: 320,
    durationMs: 2400,
  },
  {
    left: "14%",
    top: "74%",
    color: "bg-fuchsia-300/80",
    size: "h-1.5 w-1.5",
    delayMs: 480,
    durationMs: 1900,
  },
] as const;

const resolveTrackTitle = (item?: PlaylistItem) =>
  item?.answerText?.trim() || item?.title?.trim() || "（未提供名稱）";

const clampPercent = (value: number) =>
  Math.max(0, Math.min(100, Math.round(value)));

const revealStyle = (delayMs: number) =>
  ({ "--gs-reveal-delay": `${delayMs}ms` } as React.CSSProperties &
    Record<string, string>);

const GameSettlementPanel: React.FC<GameSettlementPanelProps> = ({
  room,
  participants,
  messages,
  playlistItems,
  trackOrder,
  playedQuestionCount,
  meClientId,
  questionRecaps = [],
  onBackToLobby,
  onRequestExit,
}) => {
  const sortedParticipants = useMemo(
    () => participants.slice().sort((a, b) => b.score - a.score),
    [participants],
  );
  const winner = sortedParticipants[0] ?? null;
  const runnerUp = sortedParticipants[1] ?? null;
  const comboKing =
    sortedParticipants.length > 0
      ? sortedParticipants.reduce((best, current) =>
          current.combo > best.combo ? current : best,
        )
      : null;
  const totalScore = sortedParticipants.reduce(
    (sum, participant) => sum + participant.score,
    0,
  );
  const averageScore =
    sortedParticipants.length > 0
      ? Math.round(totalScore / sortedParticipants.length)
      : 0;
  const medianScore = useMemo(() => {
    if (sortedParticipants.length === 0) return 0;
    const asc = sortedParticipants
      .map((participant) => participant.score)
      .sort((a, b) => a - b);
    const mid = Math.floor(asc.length / 2);
    if (asc.length % 2 === 0) {
      return Math.round((asc[mid - 1] + asc[mid]) / 2);
    }
    return asc[mid];
  }, [sortedParticipants]);
  const scoreSpread =
    sortedParticipants.length > 1
      ? sortedParticipants[0].score -
        sortedParticipants[sortedParticipants.length - 1].score
      : 0;
  const topGap =
    winner && runnerUp ? Math.max(0, winner.score - runnerUp.score) : 0;

  const myRank =
    meClientId != null
      ? sortedParticipants.findIndex(
          (participant) => participant.clientId === meClientId,
        ) + 1
      : 0;
  const myParticipant =
    meClientId != null
      ? sortedParticipants.find(
          (participant) => participant.clientId === meClientId,
        ) ?? null
      : null;
  const myGapToWinner =
    myParticipant && winner
      ? Math.max(0, winner.score - myParticipant.score)
      : null;
  const myPercentile =
    myRank > 0 && sortedParticipants.length > 1
      ? Math.round(
          ((sortedParticipants.length - myRank) /
            (sortedParticipants.length - 1)) *
            100,
        )
      : myRank === 1
        ? 100
        : 0;
  const myScoreShare =
    myParticipant && totalScore > 0
      ? Math.round((myParticipant.score / totalScore) * 100)
      : 0;
  const maxScore = winner?.score ?? 0;
  const stablePerformer = useMemo(() => {
    if (sortedParticipants.length === 0) return null;
    return sortedParticipants.reduce((best, current) => {
      const bestGap = Math.abs(best.score - medianScore);
      const currentGap = Math.abs(current.score - medianScore);
      if (currentGap === bestGap) {
        return current.score > best.score ? current : best;
      }
      return currentGap < bestGap ? current : best;
    });
  }, [medianScore, sortedParticipants]);
  const darkHorse = useMemo(() => {
    if (sortedParticipants.length <= 3) return null;
    return sortedParticipants.slice(3).reduce((best, current) => {
      if (current.combo === best.combo) {
        return current.score > best.score ? current : best;
      }
      return current.combo > best.combo ? current : best;
    });
  }, [sortedParticipants]);
  const totalTrackCount =
    room.playlist.totalCount || playlistItems.length || playedQuestionCount;
  const playedRate =
    totalTrackCount > 0
      ? clampPercent((playedQuestionCount / totalTrackCount) * 100)
      : 0;
  const competitionTension =
    winner && runnerUp && winner.score > 0
      ? clampPercent(((winner.score - topGap) / winner.score) * 100)
      : 0;
  const comboIntensity = comboKing
    ? clampPercent(
        (Math.max(1, comboKing.combo) / Math.max(playedQuestionCount, 1)) * 100,
      )
    : 0;
  const battleMood =
    topGap <= 40 ? "緊張" : topGap <= 100 ? "激戰" : "拉開";
  const pulseMetrics = [
    {
      label: "競爭強度",
      value: competitionTension,
      mood: battleMood,
      barClass: "from-amber-300 via-orange-300 to-rose-300",
    },
    {
      label: "連擊火力",
      value: comboIntensity,
      mood: comboKing ? `x${Math.max(1, comboKing.combo)}` : "--",
      barClass: "from-sky-300 via-cyan-300 to-emerald-300",
    },
    {
      label: "進度完成",
      value: playedRate,
      mood: `${playedQuestionCount}/${totalTrackCount}`,
      barClass: "from-fuchsia-300 via-violet-300 to-indigo-300",
    },
  ] as const;
  const highlightCards = [
    {
      key: "mvp",
      title: "MVP",
      name: winner?.username ?? "--",
      detail: winner ? `${winner.score} 分` : "--",
      toneClass: "border-amber-300/45 bg-amber-400/10 text-amber-100",
    },
    {
      key: "combo",
      title: "連擊王",
      name: comboKing?.username ?? "--",
      detail: comboKing ? `最高連擊 x${Math.max(1, comboKing.combo)}` : "--",
      toneClass: "border-cyan-300/45 bg-cyan-400/10 text-cyan-100",
    },
    {
      key: "stable",
      title: "穩定發揮",
      name: stablePerformer?.username ?? "--",
      detail: stablePerformer ? `最接近中位數 ${medianScore}` : "--",
      toneClass: "border-emerald-300/40 bg-emerald-400/10 text-emerald-100",
    },
    {
      key: "darkhorse",
      title: "黑馬",
      name: darkHorse?.username ?? "--",
      detail: darkHorse
        ? `後段爆發，最高連擊 x${Math.max(1, darkHorse.combo)}`
        : "本輪無明顯黑馬",
      toneClass: "border-fuchsia-300/45 bg-fuchsia-400/10 text-fuchsia-100",
    },
  ] as const;
  const nextRoundTips = useMemo(() => {
    const tips: Array<{
      key: string;
      title: string;
      action: string;
      detail: string;
      toneClass: string;
    }> = [];
    if (topGap >= 120) {
      tips.push({
        key: "gap",
        title: "差距偏大",
        action: "調整節奏",
        detail: "建議縮短作答時間或調整起始秒數，讓追分空間更大。",
        toneClass: "border-amber-300/40 bg-amber-400/10 text-amber-100",
      });
    } else if (topGap <= 40) {
      tips.push({
        key: "close",
        title: "比分接近",
        action: "維持配置",
        detail: "下一輪維持目前節奏，勝負會集中在答題速度與穩定度。",
        toneClass: "border-sky-300/40 bg-sky-400/10 text-sky-100",
      });
    }
    if (playedRate < 70) {
      tips.push({
        key: "progress",
        title: "曲目偏少",
        action: "增加題數",
        detail: "本輪題數偏少，建議提高題數讓排名更有代表性。",
        toneClass: "border-fuchsia-300/40 bg-fuchsia-400/10 text-fuchsia-100",
      });
    }
    if (comboIntensity < 35) {
      tips.push({
        key: "combo",
        title: "連擊偏低",
        action: "提早搶答",
        detail: "建議玩家在熟悉題型後更快作答，提升連擊與得分上限。",
        toneClass: "border-emerald-300/40 bg-emerald-400/10 text-emerald-100",
      });
    }
    if (myParticipant && myRank > 1 && myGapToWinner !== null) {
      tips.push({
        key: "me",
        title: "我的追分",
        action: `差 ${myGapToWinner} 分`,
        detail: `距離第一名還有 ${myGapToWinner} 分，下一輪可優先拼速度題。`,
        toneClass: "border-cyan-300/40 bg-cyan-400/10 text-cyan-100",
      });
    } else if (myParticipant && myRank === 1) {
      tips.push({
        key: "defend",
        title: "守住優勢",
        action: "保持穩定",
        detail: "你目前領先，下一輪可維持穩定作答策略，避免失誤。",
        toneClass: "border-amber-300/45 bg-amber-400/12 text-amber-100",
      });
    }
    if (tips.length === 0) {
      tips.push({
        key: "default",
        title: "保持節奏",
        action: "直接下一輪",
        detail: "本輪整體表現均衡，直接開始下一輪通常是最佳選擇。",
        toneClass: "border-slate-500/60 bg-slate-800/60 text-slate-100",
      });
    }
    return tips.slice(0, 3);
  }, [
    comboIntensity,
    myGapToWinner,
    myParticipant,
    myRank,
    playedRate,
    topGap,
  ]);

  const settlementDurationLabel = useMemo(() => {
    for (let idx = messages.length - 1; idx >= 0; idx -= 1) {
      const message = messages[idx];
      const line = message.content
        .split("\n")
        .find((item) => {
          const trimmed = item.trim();
          return SETTLEMENT_DURATION_PREFIXES.some((prefix) =>
            trimmed.startsWith(prefix),
          );
        });
      if (!line) continue;
      const trimmedLine = line.trim();
      for (const prefix of SETTLEMENT_DURATION_PREFIXES) {
        if (!trimmedLine.startsWith(prefix)) continue;
        const durationText = trimmedLine.replace(prefix, "").trim();
        if (durationText) return durationText;
      }
    }
    return null;
  }, [messages]);

  const effectiveTrackOrder = useMemo(() => {
    if (trackOrder && trackOrder.length > 0) return trackOrder;
    return playlistItems.map((_, idx) => idx);
  }, [playlistItems, trackOrder]);
  const recapTracks = useMemo(
    () =>
      effectiveTrackOrder
        .slice(0, playedQuestionCount)
        .map((trackIndex, idx) => {
          const item = playlistItems[trackIndex];
          return {
            key: `${trackIndex}-${idx}`,
            order: idx + 1,
            trackIndex,
            title: resolveTrackTitle(item),
            uploader: item?.uploader?.trim() || "Unknown",
            duration: item?.duration?.trim() || null,
            thumbnail: item?.thumbnail || null,
          };
        }),
    [effectiveTrackOrder, playedQuestionCount, playlistItems],
  );
  const normalizedQuestionRecaps = useMemo(() => {
    if (questionRecaps.length > 0) {
      return questionRecaps
        .slice()
        .sort((a, b) => a.order - b.order || a.trackIndex - b.trackIndex);
    }
    return recapTracks.map((item) => ({
      key: item.key,
      order: item.order,
      trackIndex: item.trackIndex,
      title: item.title,
      uploader: item.uploader,
      duration: item.duration,
      thumbnail: item.thumbnail,
      myResult: "unanswered" as const,
      myChoiceIndex: null,
      correctChoiceIndex: item.trackIndex,
      choices: [],
    }));
  }, [questionRecaps, recapTracks]);
  const recapSummary = useMemo(
    () =>
      normalizedQuestionRecaps.reduce(
        (acc, item) => {
          if (item.myResult === "correct") {
            acc.correct += 1;
          } else if (item.myResult === "wrong") {
            acc.wrong += 1;
          } else {
            acc.unanswered += 1;
          }
          return acc;
        },
        { correct: 0, wrong: 0, unanswered: 0 },
      ),
    [normalizedQuestionRecaps],
  );
  const [expandedRecapKey, setExpandedRecapKey] = useState<string | null>(null);
  const handleToggleRecap = useCallback((key: string) => {
    setExpandedRecapKey((prev) => (prev === key ? null : key));
  }, []);
  useEffect(() => {
    if (!expandedRecapKey) return;
    if (normalizedQuestionRecaps.some((item) => item.key === expandedRecapKey)) {
      return;
    }
    setExpandedRecapKey(null);
  }, [expandedRecapKey, normalizedQuestionRecaps]);
  const expandedRecap = useMemo(
    () =>
      normalizedQuestionRecaps.find((item) => item.key === expandedRecapKey) ??
      null,
    [expandedRecapKey, normalizedQuestionRecaps],
  );
  const selectedChoiceTitle = useMemo(() => {
    if (!expandedRecap) return null;
    if (expandedRecap.myChoiceIndex === null) return null;
    const selectedChoice = expandedRecap.choices.find(
      (choice) => choice.index === expandedRecap.myChoiceIndex,
    );
    return selectedChoice?.title ?? null;
  }, [expandedRecap]);
  const correctChoiceTitle = useMemo(() => {
    if (!expandedRecap) return null;
    const correctChoice = expandedRecap.choices.find(
      (choice) => choice.index === expandedRecap.correctChoiceIndex,
    );
    return correctChoice?.title ?? null;
  }, [expandedRecap]);
  const recapListHeight = Math.min(
    360,
    Math.max(96, normalizedQuestionRecaps.length * 74),
  );
  const recapRowProps = useMemo(
    () => ({
      items: normalizedQuestionRecaps,
      expandedKey: expandedRecapKey,
      onToggle: handleToggleRecap,
    }),
    [expandedRecapKey, handleToggleRecap, normalizedQuestionRecaps],
  );
  const podiumPlayers = sortedParticipants.slice(0, 3);
  const quickStats = [
    {
      key: "rank",
      label: "我的排名",
      value: myRank > 0 ? `No.${myRank}` : "--",
      progress: myRank > 0 ? myPercentile : 0,
    },
    {
      key: "share",
      label: "得分佔比",
      value: myParticipant ? `${myScoreShare}%` : "--",
      progress: myParticipant ? myScoreShare : 0,
    },
    {
      key: "gap",
      label: "與第一差距",
      value: myGapToWinner !== null ? `${myGapToWinner}` : "--",
      progress:
        myGapToWinner !== null && winner
          ? clampPercent((1 - myGapToWinner / Math.max(1, winner.score)) * 100)
          : 0,
    },
    {
      key: "avg",
      label: "平均分",
      value: `${averageScore}`,
      progress:
        maxScore > 0 ? clampPercent((averageScore / Math.max(1, maxScore)) * 100) : 0,
    },
    {
      key: "median",
      label: "中位數",
      value: `${medianScore}`,
      progress:
        maxScore > 0 ? clampPercent((medianScore / Math.max(1, maxScore)) * 100) : 0,
    },
    {
      key: "spread",
      label: "總分差距",
      value: `${scoreSpread}`,
      progress:
        maxScore > 0 ? clampPercent((scoreSpread / Math.max(1, maxScore)) * 100) : 0,
    },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-6xl px-2 pb-4 sm:px-4">
      <section className="game-settlement-stage relative overflow-hidden rounded-[30px] border border-amber-400/35 bg-slate-950/95 px-4 py-6 shadow-[0_30px_120px_-60px_rgba(245,158,11,0.6)] sm:px-6 sm:py-7">
        <div className="pointer-events-none absolute -left-20 -top-20 h-52 w-52 rounded-full bg-amber-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
        <div className="relative space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-200">
                Match Report
              </div>
              <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-100 sm:text-3xl">
                結算總覽
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                {room.name}
                {room.playlist.title ? ` · ${room.playlist.title}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Chip
                size="small"
                label={`題數 ${playedQuestionCount}`}
                variant="outlined"
                className="border-amber-300/40 text-amber-100"
              />
              <Chip
                size="small"
                label={`玩家 ${participants.length}`}
                variant="outlined"
                className="border-sky-400/45 text-sky-100"
              />
              {settlementDurationLabel && (
                <Chip
                  size="small"
                  label={`作答時間 ${settlementDurationLabel}`}
                  variant="outlined"
                  className="border-emerald-300/45 text-emerald-100"
                />
              )}
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.2fr_2fr]">
            <div
              className="game-settlement-reveal rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4"
              style={revealStyle(30)}
            >
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Champion
              </p>
              {winner ? (
                <div className="relative mt-3 overflow-hidden rounded-xl border border-amber-300/45 bg-amber-500/10 px-4 py-3 shadow-[0_16px_36px_-18px_rgba(251,191,36,0.65)]">
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.24),transparent_72%)] animate-pulse" />
                  <div className="pointer-events-none absolute -left-8 top-1/2 h-16 w-16 -translate-y-1/2 rounded-full bg-amber-300/30 blur-2xl animate-pulse" />
                  <div className="pointer-events-none absolute -right-10 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full bg-sky-300/20 blur-2xl animate-pulse" />
                  <div className="pointer-events-none absolute inset-0">
                    {WINNER_CONFETTI.map((piece, idx) => (
                      <span
                        key={`${winner.clientId}-confetti-${idx}`}
                        className={`absolute rounded-full ${piece.color} ${piece.size} game-settlement-confetti`}
                        style={{
                          left: piece.left,
                          top: piece.top,
                          animationDelay: `${piece.delayMs}ms`,
                          animationDuration: `${piece.durationMs}ms`,
                          "--mq-confetti-drift": idx % 2 === 0 ? "24px" : "-20px",
                          "--mq-confetti-spin": idx % 2 === 0 ? "240deg" : "-240deg",
                        } as React.CSSProperties & Record<string, string>}
                      />
                    ))}
                  </div>
                  <div className="relative z-10">
                    <p className="inline-flex items-center rounded-full border border-amber-200/50 bg-amber-300/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-100 animate-pulse">
                      Victory Burst
                    </p>
                    <p className="mt-2 text-lg font-bold text-amber-100">
                      No.1 {winner.username}
                    </p>
                    <p className="mt-1 text-sm text-slate-200">
                      分數 {winner.score}
                      {winner.combo > 1 ? ` · COMBO x${winner.combo}` : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  本輪暫無玩家資料
                </p>
              )}

              <p className="mt-4 text-xs uppercase tracking-[0.25em] text-slate-400">
                My Result
              </p>
              {myParticipant && myRank > 0 ? (
                <div className="mt-3 rounded-xl border border-sky-400/35 bg-sky-500/10 px-4 py-3">
                  <p className="text-lg font-bold text-sky-100">
                    No.{myRank} {myParticipant.username}
                  </p>
                  <p className="mt-1 text-sm text-slate-200">
                    分數 {myParticipant.score}
                    {winner
                      ? ` · 與第一差 ${Math.max(0, winner.score - myParticipant.score)}`
                      : ""}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">
                  尚未取得你的回顧資料
                </p>
              )}
            </div>

            <div
              className="game-settlement-reveal rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4"
              style={revealStyle(90)}
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-300">
                  Leaderboard
                </p>
                <p className="text-xs text-slate-500">
                  {sortedParticipants.length} 位玩家
                </p>
              </div>
              {sortedParticipants.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-6 text-center text-sm text-slate-500">
                  目前沒有玩家資料
                </div>
              ) : (
                <div className="space-y-2">
                  {sortedParticipants.map((participant, idx) => {
                    const isMe = participant.clientId === meClientId;
                    const scoreProgress =
                      maxScore > 0
                        ? clampPercent((participant.score / maxScore) * 100)
                        : 0;
                    return (
                      <div
                        key={participant.clientId}
                        className={`relative flex items-center justify-between overflow-hidden rounded-xl border px-3 py-2 text-sm ${
                          idx === 0
                            ? "border-amber-300/45 bg-amber-500/15 shadow-[0_14px_28px_-20px_rgba(251,191,36,0.85)]"
                            : isMe
                              ? "border-sky-400/40 bg-sky-500/10"
                              : "border-slate-700/80 bg-slate-950/60"
                        }`}
                      >
                        {idx === 0 && (
                          <>
                            <div className="pointer-events-none absolute inset-0 game-settlement-leader-glint" />
                            <div className="pointer-events-none absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-amber-300 shadow-[0_0_18px_rgba(251,191,36,0.95)] game-settlement-leader-beacon" />
                          </>
                        )}
                        <div className="relative z-10 min-w-0">
                          <p className="truncate font-semibold text-slate-100">
                            No.{idx + 1} {participant.username}
                            {isMe ? "（我）" : ""}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400">
                            {participant.isOnline ? "在線" : "離線"}
                          </p>
                          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800/90">
                            <span
                              className={`block h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-sky-300 game-settlement-scorebar ${
                                idx === 0
                                  ? "game-settlement-scorebar--winner"
                                  : ""
                              }`}
                              style={{ width: `${scoreProgress}%` }}
                            />
                          </div>
                        </div>
                        <div className="relative z-10 text-right">
                          {idx === 0 && (
                            <p className="mb-1 inline-flex items-center rounded-full border border-amber-200/55 bg-amber-300/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100 game-settlement-mvp-badge">
                              MVP
                            </p>
                          )}
                          <p className="font-bold tabular-nums text-emerald-300">
                            {participant.score}
                          </p>
                          <p className="text-xs text-amber-200">
                            {participant.combo > 1
                              ? `COMBO x${participant.combo}`
                              : "COMBO x1"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            進度 {scoreProgress}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div
            className="game-settlement-reveal grid gap-3 xl:grid-cols-[1.3fr_1fr]"
            style={revealStyle(150)}
          >
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/68 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-300">
                  對戰脈動
                </p>
                <p className="text-xs text-slate-500">Match Pulse</p>
              </div>
              <div className="mt-3 space-y-2.5">
                {pulseMetrics.map((metric) => (
                  <div key={metric.label} className="rounded-xl border border-slate-700/70 bg-slate-950/60 px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-100">
                        {metric.label}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-slate-500/70 bg-slate-800/70 px-2 py-0.5 text-[10px] font-semibold text-slate-200">
                          {metric.mood}
                        </span>
                        <p className="text-xs tabular-nums text-slate-300">
                          {metric.value}%
                        </p>
                      </div>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-800/90">
                      <span
                        className={`block h-full rounded-full bg-gradient-to-r game-settlement-metric-fill ${metric.barClass}`}
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {Array.from({ length: 10 }).map((_, dotIdx) => {
                        const active = metric.value >= (dotIdx + 1) * 10;
                        return (
                          <span
                            key={`${metric.label}-dot-${dotIdx}`}
                            className={`h-1.5 w-1.5 rounded-full ${
                              active ? "bg-slate-200/85" : "bg-slate-700/90"
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {highlightCards.map((card) => (
                <div
                  key={card.key}
                  className={`rounded-xl border px-3 py-2.5 ${card.toneClass}`}
                >
                  <p className="text-[10px] uppercase tracking-[0.24em] opacity-80">
                    {card.title}
                  </p>
                  <p className="mt-1 truncate text-sm font-semibold">
                    {card.name}
                  </p>
                  <p className="mt-0.5 text-xs opacity-85">{card.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div
            className="game-settlement-reveal grid gap-2 sm:grid-cols-3"
            style={revealStyle(210)}
          >
            {Array.from({ length: 3 }, (_, idx) => {
              const player = podiumPlayers[idx];
              const label = `Top ${idx + 1}`;
              return (
                <div
                  key={label}
                  className="rounded-xl border border-slate-700/70 bg-slate-900/55 px-3 py-2"
                >
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                    {label}
                  </p>
                  {player ? (
                    <>
                      <p className="mt-1 truncate text-sm font-semibold text-slate-100">
                        {player.username}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-300">
                        {player.score} pts
                      </p>
                    </>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">--</p>
                  )}
                </div>
              );
            })}
          </div>

          <div
            className="game-settlement-reveal rounded-2xl border border-slate-700/80 bg-slate-900/68 p-4"
            style={revealStyle(250)}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-300">
                我的關鍵數據
              </p>
              <p className="text-xs text-slate-500">Compact Metrics</p>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {quickStats.map((stat, idx) => (
                <div
                  key={stat.key}
                  className="game-settlement-stat-card rounded-xl border border-slate-700/80 bg-slate-950/65 p-2.5"
                  style={revealStyle(260 + idx * 20)}
                >
                  <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-slate-100">
                    {stat.value}
                  </p>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-slate-800/90">
                    <span
                      className="game-settlement-stat-fill block h-full rounded-full bg-gradient-to-r from-amber-300 via-sky-300 to-emerald-300"
                      style={{ width: `${stat.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="game-settlement-reveal rounded-2xl border border-slate-700/80 bg-slate-900/68 p-4"
            style={revealStyle(290)}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-300">
                下一輪建議
              </p>
              <p className="text-xs text-slate-500">Next Round Coach</p>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
              {nextRoundTips.map((tip, idx) => (
                <div
                  key={tip.key}
                  className={`game-settlement-reveal game-settlement-tip-pill rounded-xl border px-3 py-2 ${tip.toneClass}`}
                  style={revealStyle(340 + idx * 40)}
                  title={tip.detail}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] uppercase tracking-[0.24em] opacity-80">
                      {tip.title}
                    </p>
                    <span className="rounded-full border border-current/35 px-1.5 py-0.5 text-[10px] font-semibold">
                      {tip.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className="game-settlement-reveal rounded-2xl border border-slate-700/80 bg-slate-900/68 p-4"
            style={revealStyle(330)}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-300">
                題目回顧
              </p>
              <p className="text-xs text-slate-500">
                共 {normalizedQuestionRecaps.length} 題
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full border border-emerald-300/45 bg-emerald-400/10 px-2 py-0.5 font-semibold text-emerald-100">
                答對 {recapSummary.correct} 題
              </span>
              <span className="rounded-full border border-rose-300/45 bg-rose-400/10 px-2 py-0.5 font-semibold text-rose-100">
                答錯 {recapSummary.wrong} 題
              </span>
              {recapSummary.unanswered > 0 && (
                <span className="rounded-full border border-slate-500/70 bg-slate-800/70 px-2 py-0.5 font-semibold text-slate-200">
                  未作答 {recapSummary.unanswered} 題
                </span>
              )}
            </div>
            {normalizedQuestionRecaps.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-6 text-center text-sm text-slate-500">
                尚未產生可回顧的題目資料
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <VirtualList
                  style={{ height: recapListHeight, width: "100%" }}
                  rowCount={normalizedQuestionRecaps.length}
                  rowHeight={74}
                  rowProps={recapRowProps}
                  rowComponent={RecapRow}
                />

                {expandedRecap && (
                  <div className="rounded-xl border border-slate-700/80 bg-slate-950/60 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          題目 {expandedRecap.order}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-100">
                          {expandedRecap.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {expandedRecap.uploader}
                          {expandedRecap.duration
                            ? ` · ${expandedRecap.duration}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${RECAP_RESULT_META[expandedRecap.myResult].toneClass}`}
                      >
                        {RECAP_RESULT_META[expandedRecap.myResult].label}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full border border-slate-600 bg-slate-800/70 px-2 py-0.5 text-slate-200">
                        你的答案：
                        {selectedChoiceTitle ??
                          (expandedRecap.myChoiceIndex === null ? "未作答" : "--")}
                      </span>
                      <span className="rounded-full border border-emerald-300/45 bg-emerald-400/10 px-2 py-0.5 text-emerald-100">
                        正解：{correctChoiceTitle ?? "--"}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2">
                      {expandedRecap.choices.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/60 px-3 py-2 text-xs text-slate-400">
                          此題沒有可回顧的選項資料。
                        </div>
                      ) : (
                        expandedRecap.choices.map((choice) => {
                          const toneClass = choice.isCorrect
                            ? "border-emerald-300/45 bg-emerald-500/14"
                            : choice.isSelectedByMe
                              ? "border-rose-300/45 bg-rose-500/14"
                              : "border-slate-700/80 bg-slate-900/70";
                          return (
                            <div
                              key={`${expandedRecap.key}-choice-${choice.index}`}
                              className={`rounded-lg border px-3 py-2 ${toneClass}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm text-slate-100">
                                  {choice.title}
                                </p>
                                <div className="flex flex-wrap items-center justify-end gap-1">
                                  {choice.isCorrect && (
                                    <span className="rounded-full border border-emerald-300/45 bg-emerald-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-100">
                                      正解
                                    </span>
                                  )}
                                  {choice.isSelectedByMe && (
                                    <span className="rounded-full border border-sky-300/45 bg-sky-400/15 px-1.5 py-0.5 text-[10px] font-semibold text-sky-100">
                                      你的答案
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {onBackToLobby && (
              <Button
                variant="outlined"
                color="inherit"
                onClick={onBackToLobby}
                className="border-slate-500/60 text-slate-200"
              >
                返回房間大廳
              </Button>
            )}
            <Button variant="contained" color="error" onClick={onRequestExit}>
              離開房間
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GameSettlementPanel;
