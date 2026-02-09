import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import {
  Bolt,
  Pause,
  PlayArrow,
  Repeat,
  VolumeOff,
  VolumeUp,
} from "@mui/icons-material";

type PlayerPanelProps = {
  selectedVideoId: string | null;
  selectedTitle: string;
  selectedUploader: string;
  selectedDuration?: string;
  selectedClipDurationLabel: string;
  selectedClipDurationSec: string;
  clipCurrentSec: string;
  clipDurationSec: string;
  startSec: number;
  effectiveEnd: number;
  currentTimeSec: number;
  onProgressChange: (value: number) => void;
  onTogglePlayback: () => void;
  isPlayerReady: boolean;
  isPlaying: boolean;
  onVolumeChange: (value: number) => void;
  volume: number;
  isMuted: boolean;
  onToggleMute: () => void;
  autoPlayOnSwitch: boolean;
  onAutoPlayChange: (value: boolean) => void;
  autoPlayLabel: string;
  loopEnabled: boolean;
  onLoopChange: (value: boolean) => void;
  loopLabel: string;
  playLabel: string;
  pauseLabel: string;
  volumeLabel: string;
  noSelectionLabel: string;
  playerContainerRef: RefObject<HTMLDivElement | null>;
  thumbnail?: string;
};

const PlayerPanel = ({
  selectedVideoId,
  selectedTitle,
  selectedUploader,
  selectedDuration,
  selectedClipDurationLabel,
  selectedClipDurationSec,
  clipCurrentSec,
  clipDurationSec,
  startSec,
  effectiveEnd,
  currentTimeSec,
  onProgressChange,
  onTogglePlayback,
  isPlayerReady,
  isPlaying,
  onVolumeChange,
  volume,
  isMuted,
  onToggleMute,
  autoPlayOnSwitch,
  onAutoPlayChange,
  autoPlayLabel,
  loopEnabled,
  onLoopChange,
  loopLabel,
  playLabel,
  pauseLabel,
  noSelectionLabel,
  playerContainerRef,
  thumbnail,
}: PlayerPanelProps) => {
  const volumeDragRef = useRef(false);
  const volumePointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isVolumeDragging, setIsVolumeDragging] = useState(false);
  const updateVolumeFromEvent = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / rect.width;
      const next = Math.min(100, Math.max(0, Math.round(ratio * 100)));
      onVolumeChange(next);
    },
    [onVolumeChange],
  );
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState<number | null>(null);
  const [clickAnimating, setClickAnimating] = useState(false);
  const dragRafRef = useRef<number | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const lastSeekAtRef = useRef<number>(0);
  const [hoverPercent, setHoverPercent] = useState<number | null>(null);
  const clampTime = useCallback(
    (value: number) => Math.min(effectiveEnd, Math.max(startSec, value)),
    [effectiveEnd, startSec],
  );
  const handleSeekAt = useCallback(
    (clientX: number, commit: boolean) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ratio = (clientX - rect.left) / rect.width;
      const next = clampTime(startSec + ratio * (effectiveEnd - startSec));
      setDragTime(next);
      if (commit) {
        onProgressChange(next);
      }
    },
    [clampTime, effectiveEnd, onProgressChange, startSec],
  );
  const getTimeFromClientX = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const ratio = (clientX - rect.left) / rect.width;
      return clampTime(startSec + ratio * (effectiveEnd - startSec));
    },
    [clampTime, effectiveEnd, startSec],
  );
  const handleHoverAt = useCallback(
    (clientX: number) => {
      const rect = trackRef.current?.getBoundingClientRect();
      if (!rect) return;
      const ratio = (clientX - rect.left) / rect.width;
      const next = clampTime(startSec + ratio * (effectiveEnd - startSec));
      const percent =
        ((next - startSec) / Math.max(1, effectiveEnd - startSec)) * 100;
      setHoverPercent(Math.max(0, Math.min(100, percent)));
    },
    [clampTime, effectiveEnd, startSec],
  );

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (event: PointerEvent) => {
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
      }
      dragRafRef.current = requestAnimationFrame(() => {
        handleSeekAt(event.clientX, false);
        const now = performance.now();
        if (now - lastSeekAtRef.current > 90) {
          lastSeekAtRef.current = now;
          if (dragTime !== null) {
            onProgressChange(dragTime);
          }
        }
      });
    };
    const onUp = (event?: PointerEvent) => {
      if (dragRafRef.current) {
        cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      const startX = dragStartXRef.current;
      const endX = event?.clientX ?? startX ?? 0;
      const moved = startX !== null ? Math.abs(endX - startX) : 0;
      if (moved < 4) {
        const target = getTimeFromClientX(endX);
        if (target !== null) {
          setClickAnimating(true);
          setDragTime(target);
          onProgressChange(target);
          window.setTimeout(() => {
            setClickAnimating(false);
            setDragTime(null);
          }, 200);
        }
      } else if (dragTime !== null) {
        onProgressChange(dragTime);
      }
      setIsDragging(false);
      setDragTime(null);
      dragStartXRef.current = null;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragTime, handleSeekAt, isDragging, onProgressChange]);

  const effectiveTime = dragTime ?? currentTimeSec;
  const progressPercent = Math.min(
    100,
    Math.max(
      0,
      ((effectiveTime - startSec) / Math.max(1, effectiveEnd - startSec)) * 100,
    ),
  );
  const previewTime =
    hoverPercent === null
      ? null
      : startSec + (hoverPercent / 100) * Math.max(1, effectiveEnd - startSec);
  const formatTime = (value: number) => {
    const total = Math.max(0, Math.floor(value));
    const m = Math.floor(total / 60)
      .toString()
      .padStart(2, "0");
    const s = (total % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };
  return (
    <div className="p-2.5">
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-900 aspect-16/6">
        {selectedVideoId ? (
          <>
            <div ref={playerContainerRef} className="h-full w-full" />
            <div className="absolute inset-0 z-10" aria-hidden="true" />
          </>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={selectedTitle}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-slate-500">
            {noSelectionLabel}
          </div>
        )}
      </div>
      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-slate-100 line-clamp-1">
            {selectedTitle}
          </div>
          <div className="text-[11px] text-slate-400">
            {selectedUploader}
            {selectedDuration ? ` · ${selectedDuration}` : ""}
          </div>
        </div>
        <div className="shrink-0 text-[9px] uppercase tracking-[0.3em] text-slate-500">
          {selectedClipDurationLabel} {selectedClipDurationSec}
        </div>
      </div>
      <div className="mt-2">
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>{clipCurrentSec}</span>
          <span>{clipDurationSec}</span>
        </div>
        <div className="mt-1.5">
          <div
            ref={trackRef}
            className="relative h-2 w-full cursor-pointer rounded-full bg-slate-800/80"
            onPointerDown={(event) => {
              event.preventDefault();
              setIsDragging(true);
              dragStartXRef.current = event.clientX;
            }}
            onPointerMove={(event) => handleHoverAt(event.clientX)}
            onPointerLeave={() => setHoverPercent(null)}
          >
            <div
              className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300 ${
                clickAnimating ? "transition-[width] duration-200 ease-out" : ""
              }`}
              style={{ width: `${progressPercent}%` }}
            />
            {hoverPercent !== null && previewTime !== null && (
              <div
                className="absolute -top-7 rounded-full border border-slate-700 bg-slate-900/90 px-2 py-0.5 text-[10px] text-slate-200"
                style={{ left: `calc(${hoverPercent}% - 18px)` }}
              >
                {formatTime(previewTime)}
              </div>
            )}
            <div
              className={`absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-sky-200 shadow-[0_0_0_2px_rgba(15,23,42,0.8)] ${
                clickAnimating ? "transition-[left] duration-200 ease-out" : ""
              }`}
              style={{ left: `calc(${progressPercent}% - 6px)` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onTogglePlayback}
          disabled={!isPlayerReady}
          aria-label={isPlaying ? pauseLabel : playLabel}
          className={`flex h-7 w-7 items-center justify-center rounded-full border text-slate-100 transition ${
            isPlaying
              ? "border-sky-400/70 bg-sky-400/15"
              : "border-slate-700 bg-slate-900/80"
          } hover:border-sky-300 disabled:opacity-50`}
        >
          {isPlaying ? (
            <Pause fontSize="small" />
          ) : (
            <PlayArrow fontSize="small" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onAutoPlayChange(!autoPlayOnSwitch)}
          aria-pressed={autoPlayOnSwitch}
          title={autoPlayLabel}
          className={`flex h-7 w-7 items-center justify-center rounded-full border text-slate-100 transition ${
            autoPlayOnSwitch
              ? "border-emerald-400/70 bg-emerald-400/15"
              : "border-slate-700 bg-slate-900/80"
          } hover:border-emerald-300`}
        >
          <Bolt fontSize="small" />
        </button>
        <button
          type="button"
          onClick={() => onLoopChange(!loopEnabled)}
          aria-pressed={loopEnabled}
          title={loopLabel}
          className={`flex h-7 w-7 items-center justify-center rounded-full border text-slate-100 transition ${
            loopEnabled
              ? "border-amber-400/70 bg-amber-400/15"
              : "border-slate-700 bg-slate-900/80"
          } hover:border-amber-300`}
        >
          <Repeat fontSize="small" />
        </button>
        <div className="ml-auto flex items-center gap-2 rounded-2xl bg-slate-950/60 px-2.5 py-1.5 text-[11px] text-slate-300 shadow-[inset_0_0_0_1px_rgba(15,23,42,0.25)]">
          <button
            type="button"
            onClick={onToggleMute}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900/70 text-slate-200 transition hover:bg-slate-800/90 hover:text-slate-50"
            onMouseDown={(event) => event.preventDefault()}
            tabIndex={-1}
            aria-label={isMuted ? "????" : "??"}
          >
            {isMuted || volume === 0 ? (
              <VolumeOff fontSize="small" />
            ) : (
              <VolumeUp fontSize="small" />
            )}
          </button>
          <div
            className="relative h-6 w-28 cursor-pointer rounded-full bg-slate-900/70"
            onPointerDown={(event) => {
              event.preventDefault();
              volumeDragRef.current = true;
              setIsVolumeDragging(false);
              volumePointerStartRef.current = {
                x: event.clientX,
                y: event.clientY,
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
            onMouseDown={(event) => event.preventDefault()}
            tabIndex={-1}
            onPointerMove={(event) => {
              if (!volumeDragRef.current) return;
              if (!isVolumeDragging) {
                const start = volumePointerStartRef.current;
                if (start) {
                  const deltaX = Math.abs(event.clientX - start.x);
                  const deltaY = Math.abs(event.clientY - start.y);
                  if (deltaX + deltaY < 4) return;
                }
                setIsVolumeDragging(true);
              }
              updateVolumeFromEvent(event);
            }}
            onPointerUp={(event) => {
              if (volumeDragRef.current) {
                volumeDragRef.current = false;
                setIsVolumeDragging(false);
                if (!isVolumeDragging) {
                  updateVolumeFromEvent(event);
                }
                volumePointerStartRef.current = null;
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
            onPointerCancel={(event) => {
              if (volumeDragRef.current) {
                volumeDragRef.current = false;
                setIsVolumeDragging(false);
                volumePointerStartRef.current = null;
                event.currentTarget.releasePointerCapture(event.pointerId);
              }
            }}
          >
            <div className="absolute inset-x-1 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-slate-800" />
            <div
              className="absolute left-1 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-300"
              style={{
                width: `calc(${isMuted ? 0 : volume}% - 8px)`,
                transition: isVolumeDragging ? "none" : "width 200ms ease-out",
              }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full bg-sky-200 shadow-[0_0_0_2px_rgba(15,23,42,0.8)]"
              style={{
                left: `calc(${isMuted ? 0 : volume}% - 6px)`,
                transition: isVolumeDragging ? "none" : "left 200ms ease-out",
              }}
            />
          </div>
          <span className="min-w-[28px] rounded-full bg-slate-900/70 px-2 py-0.5 text-right text-[10px] text-slate-400">
            {isMuted ? 0 : volume}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PlayerPanel;
