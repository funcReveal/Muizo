import React, { useMemo } from "react";
import { Button, Chip } from "@mui/material";

import type {
  ChatMessage,
  PlaylistItem,
  RoomParticipant,
  RoomState,
} from "../../model/types";

const SETTLEMENT_DURATION_PREFIXES = [
  "本輪作答總時長：",
  "本輪遊玩總時長：",
] as const;

interface GameSettlementPanelProps {
  room: RoomState["room"];
  participants: RoomParticipant[];
  messages: ChatMessage[];
  playlistItems: PlaylistItem[];
  trackOrder?: number[];
  playedQuestionCount: number;
  meClientId?: string;
  onBackToLobby?: () => void;
  onRequestExit: () => void;
}

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
  item?.answerText?.trim() || item?.title?.trim() || "（未提供曲名）";

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
    topGap <= 40 ? "激戰" : topGap <= 100 ? "拉鋸" : "領先";
  const pulseMetrics = [
    {
      label: "對戰",
      value: competitionTension,
      mood: battleMood,
      barClass: "from-amber-300 via-orange-300 to-rose-300",
    },
    {
      label: "連擊",
      value: comboIntensity,
      mood: comboKing ? `x${Math.max(1, comboKing.combo)}` : "--",
      barClass: "from-sky-300 via-cyan-300 to-emerald-300",
    },
    {
      label: "進度",
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
      detail: winner ? `${winner.score} 分` : "無資料",
      toneClass: "border-amber-300/45 bg-amber-400/10 text-amber-100",
    },
    {
      key: "combo",
      title: "連擊王",
      name: comboKing?.username ?? "--",
      detail: comboKing ? `最高連擊 x${Math.max(1, comboKing.combo)}` : "無資料",
      toneClass: "border-cyan-300/45 bg-cyan-400/10 text-cyan-100",
    },
    {
      key: "stable",
      title: "穩定王",
      name: stablePerformer?.username ?? "--",
      detail: stablePerformer ? `貼近中位數 ${medianScore}` : "無資料",
      toneClass: "border-emerald-300/40 bg-emerald-400/10 text-emerald-100",
    },
    {
      key: "darkhorse",
      title: "黑馬",
      name: darkHorse?.username ?? "--",
      detail: darkHorse
        ? `排名外圈最高連擊 x${Math.max(1, darkHorse.combo)}`
        : "本輪無黑馬資料",
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
        title: "拉近差距",
        action: "加題 / 縮時",
        detail: "冠軍分差偏大，下一局可嘗試增加題數或縮短作答時間。",
        toneClass: "border-amber-300/40 bg-amber-400/10 text-amber-100",
      });
    } else if (topGap <= 40) {
      tips.push({
        key: "close",
        title: "維持纏鬥",
        action: "保持設定",
        detail: "戰況很接近，可維持目前設定打造更刺激的拉鋸戰。",
        toneClass: "border-sky-300/40 bg-sky-400/10 text-sky-100",
      });
    }
    if (playedRate < 70) {
      tips.push({
        key: "progress",
        title: "提高完賽",
        action: "減題數",
        detail: "本輪完成比例偏低，建議下局減少題數提高完賽率。",
        toneClass: "border-fuchsia-300/40 bg-fuchsia-400/10 text-fuchsia-100",
      });
    }
    if (comboIntensity < 35) {
      tips.push({
        key: "combo",
        title: "連擊提升",
        action: "熟歌單",
        detail: "連擊張力偏低，可改用更熟悉歌單提升節奏感。",
        toneClass: "border-emerald-300/40 bg-emerald-400/10 text-emerald-100",
      });
    }
    if (myParticipant && myRank > 1 && myGapToWinner !== null) {
      tips.push({
        key: "me",
        title: "衝刺開局",
        action: `差 ${myGapToWinner}`,
        detail: `你與第一名差 ${myGapToWinner} 分，建議優先衝刺開局連擊。`,
        toneClass: "border-cyan-300/40 bg-cyan-400/10 text-cyan-100",
      });
    } else if (myParticipant && myRank === 1) {
      tips.push({
        key: "defend",
        title: "守住領先",
        action: "穩定節奏",
        detail: "你已領先，下一局可維持穩定答題節奏鞏固優勢。",
        toneClass: "border-amber-300/45 bg-amber-400/12 text-amber-100",
      });
    }
    if (tips.length === 0) {
      tips.push({
        key: "default",
        title: "配置平衡",
        action: "可換歌單",
        detail: "目前數據均衡，可維持設定並嘗試不同歌單風格。",
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
  const podiumPlayers = sortedParticipants.slice(0, 3);
  const quickStats = [
    {
      key: "rank",
      label: "我的名次",
      value: myRank > 0 ? `No.${myRank}` : "--",
      progress: myRank > 0 ? myPercentile : 0,
    },
    {
      key: "share",
      label: "分數佔比",
      value: myParticipant ? `${myScoreShare}%` : "--",
      progress: myParticipant ? myScoreShare : 0,
    },
    {
      key: "gap",
      label: "與第一差",
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
      label: "分差",
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
                本輪結算
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                {room.name}
                {room.playlist.title ? ` ・ ${room.playlist.title}` : ""}
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
                      {winner.combo > 1 ? ` ・ 最高連擊 x${winner.combo}` : ""}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">本輪沒有可用成績。</p>
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
                    {winner ? ` ・ 與第一差 ${Math.max(0, winner.score - myParticipant.score)}` : ""}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-400">你沒有本輪成績紀錄。</p>
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
                  尚無結算資料
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
                              ? `連擊 x${participant.combo}`
                              : "連擊 x1"}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            強度 {scoreProgress}%
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
                  戰局脈搏
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
                速覽儀表
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
                下一局建議
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
                共 {recapTracks.length} 題
              </p>
            </div>
            {recapTracks.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 px-4 py-6 text-center text-sm text-slate-500">
                目前沒有可回顧的題目資料
              </div>
            ) : (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {recapTracks.map((item) => (
                  <div
                    key={item.key}
                    className="game-settlement-track-card flex items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-950/55 px-3 py-2"
                  >
                    <div className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/10 text-xs font-semibold text-amber-100">
                      {item.order}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-100">
                        {item.title}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {item.uploader}
                        {item.duration ? ` ・ ${item.duration}` : ""}
                      </p>
                    </div>
                    {item.thumbnail && (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-10 w-16 flex-none rounded-md border border-slate-700/80 object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                ))}
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
