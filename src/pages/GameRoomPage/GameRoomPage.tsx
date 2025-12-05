import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button, Chip, LinearProgress, Switch } from "@mui/material";
import type {
  GameState,
  PlaylistItem,
  RoomState,
} from "../RoomChatPage/types";

interface GameRoomPageProps {
  room: RoomState["room"];
  gameState: GameState;
  playlist: PlaylistItem[];
  onBack: () => void;
  onSubmitChoice: (choiceIndex: number) => void;
  participants?: RoomState["participants"];
  meClientId?: string;
}

const shuffleArray = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const extractYouTubeId = (url: string): string | null => {
  try {
    const parsed = new URL(url);
    const vid = parsed.searchParams.get("v");
    if (vid) return vid;
    const segments = parsed.pathname.split("/");
    return segments.pop() || null;
  } catch (err) {
    console.error("Failed to parse video id", err);
    return null;
  }
};

const GameRoomPage: React.FC<GameRoomPageProps> = ({
  room,
  gameState,
  playlist,
  onBack,
  onSubmitChoice,
  participants = [],
  meClientId,
}) => {
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [playerStart, setPlayerStart] = useState(() =>
    Math.max(0, Math.floor((Date.now() - gameState.startedAt) / 1000))
  );
  const [showVideo, setShowVideo] = useState(gameState.showVideo ?? true);
  const [volume, setVolume] = useState(100);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const effectiveTrackOrder = useMemo(() => {
    if (gameState.trackOrder?.length) {
      return Array.from(new Set(gameState.trackOrder));
    }
    return shuffleArray(playlist.map((_, idx) => idx));
  }, [gameState.trackOrder, playlist]);

  const hasServerTrackOrder = Boolean(gameState.trackOrder?.length);
  const trackOrderLength = hasServerTrackOrder
    ? effectiveTrackOrder.length
    : playlist.length || 0;
  const trackCursor = Math.min(
    gameState.trackCursor ?? 0,
    Math.max(trackOrderLength - 1, 0)
  );
  const currentTrackIndex =
    (hasServerTrackOrder
      ? effectiveTrackOrder[trackCursor] ?? effectiveTrackOrder[0]
      : gameState.currentIndex ?? effectiveTrackOrder[trackCursor]) ?? 0;

  useEffect(() => {
    setPlayerStart(
      Math.max(0, Math.floor((Date.now() - gameState.startedAt) / 1000))
    );
    setShowVideo(gameState.showVideo ?? true);
    setSelectedChoice(null);
    const interval = setInterval(() => setNowMs(Date.now()), 500);
    return () => clearInterval(interval);
  }, [gameState.startedAt, gameState.showVideo, currentTrackIndex]);

  useEffect(() => {
    const target = iframeRef.current?.contentWindow;
    if (!target) return;
    try {
      target.postMessage(
        JSON.stringify({
          event: "command",
          func: "setVolume",
          args: [volume],
        }),
        "*"
      );
    } catch (err) {
      console.error("setVolume failed", err);
    }
  }, [volume]);

  const item = useMemo(() => {
    return playlist[currentTrackIndex] ?? playlist[0];
  }, [playlist, currentTrackIndex]);

  const videoId = item ? extractYouTubeId(item.url) : null;
  const phaseEndsAt =
    gameState.phase === "guess"
      ? gameState.startedAt + gameState.guessDurationMs
      : gameState.revealEndsAt;
  const waitingToStart = gameState.startedAt > nowMs;
  const phaseRemainingMs = Math.max(0, phaseEndsAt - nowMs);
  const revealCountdownMs = Math.max(0, gameState.revealEndsAt - nowMs);
  const isEnded = gameState.status === "ended";

  const iframeSrc = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&controls=0&disablekb=1&start=${
        waitingToStart ? 0 : playerStart
      }&enablejsapi=1&rel=0&playsinline=1&modestbranding=1&fs=0`
    : null;

  const phaseLabel = isEnded
    ? "已結束"
    : gameState.phase === "guess"
    ? "猜歌"
    : "公布答案";
  const isReveal = gameState.phase === "reveal";
  const correctChoiceIndex = currentTrackIndex;
  const progressPct =
    phaseEndsAt === gameState.startedAt
      ? 0
      : ((gameState.phase === "guess"
          ? gameState.guessDurationMs - phaseRemainingMs
          : gameState.revealDurationMs - phaseRemainingMs) /
          (gameState.phase === "guess"
            ? gameState.guessDurationMs
            : gameState.revealDurationMs)) *
        100;

  return (
    <div className="grid w-full grid-cols-1 gap-4 lg:grid-cols-[260px,1fr] lg:min-h-[75vh]">
      {/* 分數榜 */}
      <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-slate-50 shadow-md">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span className="inline-block h-1.5 w-6 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" />
          <span className="text-sm font-semibold">分數榜</span>
        </div>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {participants
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((p, idx) => (
              <div
                key={p.clientId}
                className={`flex items-center justify-between rounded px-2 py-1 text-sm ${
                  p.clientId === meClientId
                    ? "border border-emerald-600/50 bg-emerald-900/40 text-emerald-100"
                    : "bg-slate-800/40 text-slate-200"
                }`}
              >
                <span className="truncate">
                  {idx + 1}. {p.clientId === meClientId ? `${p.username}（我）` : p.username}
                </span>
                <span className="font-semibold text-emerald-300">
                  {p.score}
                  {p.combo > 1 && <span className="ml-1 text-amber-300">x{p.combo}</span>}
                </span>
              </div>
            ))}
        </div>
        {meClientId && !participants.some((p) => p.clientId === meClientId) && (
          <div className="mt-2 text-[11px] text-slate-400">未在房間內，請重新加入以同步。</div>
        )}
      </div>

      {/* 右側：上播放、下答題 */}
      <div className="grid h-full grid-rows-[1.6fr,1fr] gap-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-slate-50 shadow-md">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-block h-1.5 w-6 rounded-full bg-gradient-to-r from-sky-400 to-emerald-400" />
              <div>
                <p className="text-sm font-semibold">{room.name}</p>
                <p className="text-xs text-slate-400">
                  曲目 {trackCursor + 1}/{trackOrderLength || "?"}
                </p>
              </div>
            </div>
            <Button variant="outlined" color="inherit" size="small" onClick={onBack}>
              返回聊天室
            </Button>
          </div>

          <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-inner">
            {iframeSrc ? (
              <iframe
                key={`${currentTrackIndex}-${gameState.startedAt}`}
                src={iframeSrc}
                className={`h-full w-full transition-opacity duration-300 ${
                  gameState.phase === "guess" || !showVideo ? "opacity-0" : "opacity-100"
                }`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Now playing"
                style={{ pointerEvents: "none" }}
                ref={iframeRef}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                找不到可播放的影片
              </div>
            )}
            {gameState.phase === "guess" && !isEnded && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="h-24 w-24 animate-spin rounded-full border-4 border-slate-700 shadow-lg shadow-emerald-500/30" />
                <p className="mt-2 text-xs text-slate-300">
                  {waitingToStart
                    ? `即將開始 · ${Math.ceil((gameState.startedAt - nowMs) / 1000)}s`
                    : `${phaseLabel}中`}
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-slate-300">公布階段顯示影片</span>
            <Switch
              color="info"
              checked={showVideo}
              onChange={(e) => setShowVideo(e.target.checked)}
              disabled={gameState.phase === "guess"}
            />
          </div>
          <div className="mt-2">
            <span className="text-xs text-slate-300">音量</span>
            <input
              type="range"
              min={0}
              max={100}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-slate-50 shadow-md">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block h-1.5 w-6 rounded-full bg-gradient-to-r from-amber-400 to-rose-400" />
            <span className="text-sm font-semibold">{phaseLabel}</span>
            <Chip
              label={`${Math.ceil(phaseRemainingMs / 1000)}s`}
              size="small"
              color={gameState.phase === "guess" ? "warning" : "success"}
              variant="outlined"
            />
          </div>

          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, progressPct))}
            color={gameState.phase === "guess" ? "warning" : "success"}
          />

          <div className="mt-3 grid grid-cols-1 gap-2">
            {gameState.choices.map((choice, idx) => {
              const isSelected = selectedChoice === choice.index;
              const isCorrect = choice.index === correctChoiceIndex;
              const isLocked = isReveal || isEnded;

              return (
                <Button
                  key={`${choice.index}-${idx}`}
                  fullWidth
                  size="large"
                  disableRipple
                  aria-disabled={isLocked}
                  tabIndex={isLocked ? -1 : 0}
                  variant={
                    isReveal
                      ? isCorrect || isSelected
                        ? "contained"
                        : "outlined"
                      : isSelected
                      ? "contained"
                      : "outlined"
                  }
                  color={
                    isReveal
                      ? isCorrect
                        ? "success"
                        : isSelected
                        ? "error"
                        : "info"
                      : isSelected
                      ? "info"
                      : "info"
                  }
                  className={`justify-start ${
                    isReveal
                      ? isCorrect
                        ? "bg-emerald-700/40"
                        : isSelected
                        ? "bg-rose-700/40"
                        : "opacity-90"
                    : isSelected
                    ? "bg-sky-700/30"
                    : ""
                  } ${isLocked ? "pointer-events-none" : ""}`}
                  disabled={false}
                  onClick={() => {
                    if (isLocked) return;
                    setSelectedChoice(choice.index);
                    onSubmitChoice(choice.index);
                  }}
                >
                  {choice.title}
                </Button>
              );
            })}
          </div>

          {gameState.phase === "reveal" && (
            <div className="mt-3 rounded-lg border border-emerald-700 bg-emerald-900/30 p-3">
              <p className="text-sm font-semibold text-emerald-100">正確答案</p>
              <p className="mt-1 text-sm text-emerald-50">{gameState.answerTitle ?? "—"}</p>
              {gameState.status === "playing" ? (
                <p className="mt-1 text-xs text-emerald-200">
                  下一首將在 {Math.ceil(revealCountdownMs / 1000)} 秒後開始
                </p>
              ) : (
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-emerald-200">
                    已播放完所有曲目，請房主挑選新的歌單。
                  </p>
                  <Button size="small" variant="outlined" color="inherit" onClick={onBack}>
                    返回聊天室
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameRoomPage;
