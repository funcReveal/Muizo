import React, { useCallback, useEffect, useRef, useState } from "react";

import type { GameState } from "@features/RoomSession";

interface UseGameRoomPlayerSyncParams {
  serverOffsetMs: number;
  getServerNowMs: () => number;
  gameVolume: number;
  requiresAudioGesture: boolean;
  startedAt: number;
  phase: GameState["phase"];
  revealEndsAt: number;
  revealDurationMs: number;
  effectiveGuessDurationMs: number;
  fallbackDurationSec: number;
  shouldLoopRoomSettingsClip: boolean;
  clipStartSec: number;
  clipEndSec: number;
  waitingToStart: boolean;
  isEnded: boolean;
  isReveal: boolean;
  trackLoadKey: string;
  trackSessionKey: string;
  audioGestureSessionKey: string;
  videoId: string | null;
  currentTrackIndex: number;
  primeSfxAudio: () => void;
}

const PLAYER_ID = "mq-main-player";

// ── Drift tolerances (2 tiers) ──────────────────────────────────────────────
// DRIFT_TOLERANCE_SEC:        steady-state threshold for resume / drift-sync /
//                             post-start check; any drift greater than this
//                             triggers a single corrective seek.
// POST_START_DRIFT_TOLERANCE_SEC: stricter tier used *only* inside the one-shot
//                             post-start check at T0+POST_START_DRIFT_CHECK_MS,
//                             where we want tighter alignment right after play.
const DRIFT_TOLERANCE_SEC = 1;
const POST_START_DRIFT_TOLERANCE_SEC = 0.35;

// ── Prestart warmup ────────────────────────────────────────────────────────
// At T-PRESTART_WARMUP_LEAD_MS (4500), mute + seek to clipStart + play for
// PRESTART_WARMUP_PLAY_MS (140) to prime the codec AND trigger byte loading,
// then pause and hold at clipStart until T0. Gives the player ~4.5s to buffer
// before go-time — critical because cueVideoById alone does NOT load bytes,
// only playVideo/seekTo do. On slow 4G this is the difference between a
// correctly-aligned start and a 3s offset that needs corrective seek.
// Only applies when we actually have that much lead (Q1 has 5s countdown;
// Q2+ has 0s → warmup is skipped and catchup loop takes over instead).
// PRESTART_FINAL_HOLD_MS: mute-hold window after playVideo at T0 *when warmup
// completed*. Short because the player is already primed at clipStart.
// NO_WARMUP_HOLD_MS: longer mute-hold when we start playback without warmup
// (Q2+ where startedAt is already now, gesture unlock, or late join).
const PRESTART_WARMUP_LEAD_MS = 4500;
const PRESTART_WARMUP_PLAY_MS = 140;
const PRESTART_FINAL_HOLD_MS = 120;
const NO_WARMUP_HOLD_MS = 680;

// ── Post-start drift check (single checkpoint) ─────────────────────────────
// One check at T0+POST_START_DRIFT_CHECK_MS. If drift exceeds
// POST_START_DRIFT_TOLERANCE_SEC, do one seek correction. No additional
// polling after that.
const POST_START_DRIFT_CHECK_MS = 1500;

// ── Buffering grace ─────────────────────────────────────────────────────────
// If YouTube reports state=3 (buffering), suppress drift-triggered seeks for
// this window — seeking mid-buffer just extends the stall.
// 例外：LARGE_DRIFT_OVERRIDE_SEC —— 若偏差超過此值，表示 player 正在錯誤位置
// 緩衝錯誤內容，繼續等反而永遠對不齊；此時即使在 grace 內也強制 seek。
// 觸發情境：慢速 4G 下 post-start drift check 恰好落在 grace 窗口內。
const BUFFERING_GRACE_MS = 1500;
const RECENT_BUFFERING_WINDOW_MS = 1500;
const LARGE_DRIFT_OVERRIDE_SEC = 1.5;

// ── Resume resync ──────────────────────────────────────────────────────────
// After coming back from background / focus event, do a single delayed check
// to verify drift stayed within tolerance. No multi-checkpoint ladder.
const RESUME_RESYNC_CHECK_MS = 700;

// ── Recovery monitor loop ───────────────────────────────────────────────────
// Event-driven: loop idles when healthy; kicks on bad state transitions or
// visibility return, then polls every RECOVERY_MONITOR_INTERVAL_MS until
// healthy again. When background, use BACKGROUND_MONITOR_INTERVAL_MS to save
// battery. AUTO_RESUME_MIN_INTERVAL_MS throttles repeated playVideo kicks.
const RECOVERY_MONITOR_INTERVAL_MS = 500;
const BACKGROUND_MONITOR_INTERVAL_MS = 2000;
const AUTO_RESUME_MIN_INTERVAL_MS = 1800;

// Ignore drift signals right after an intentional start — the player may still
// be ramping up currentTime.
const RECENT_START_GUARD_MS = 2500;

const SYNC_DEBUG_STORAGE_KEY = "musicquiz:debug-sync";

const useGameRoomPlayerSync = ({
  serverOffsetMs,
  getServerNowMs,
  gameVolume,
  requiresAudioGesture,
  startedAt,
  phase,
  revealEndsAt,
  revealDurationMs,
  effectiveGuessDurationMs,
  fallbackDurationSec,
  shouldLoopRoomSettingsClip,
  clipStartSec,
  clipEndSec,
  waitingToStart,
  isEnded,
  isReveal,
  trackLoadKey,
  trackSessionKey,
  audioGestureSessionKey,
  videoId,
  currentTrackIndex,
  primeSfxAudio,
}: UseGameRoomPlayerSyncParams) => {
  const [audioUnlockSessionKey, setAudioUnlockSessionKey] = useState<
    string | null
  >(() => (!requiresAudioGesture ? audioGestureSessionKey : null));
  const audioUnlocked =
    !requiresAudioGesture || audioUnlockSessionKey === audioGestureSessionKey;
  const audioUnlockedRef = useRef(audioUnlocked);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlayerPlaying, setIsPlayerPlaying] = useState(false);
  const [loadedTrackKey, setLoadedTrackKey] = useState<string | null>(null);
  const [playerVideoId, setPlayerVideoId] = useState<string | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedPlaybackRef = useRef(false);
  // 當 startPlayback 被呼叫後，等待下一次 state=1 (playing) 立即對齊伺服器位置。
  // 這處理「playVideo 在 T0 下達，但慢速網路下 player 到 T0+X 才真正播放」的情況
  // —— 此時伺服器位置已前進 X 秒，我們必須 seekTo 趕上，而不是停在 clipStart。
  const awaitingFirstPlaySyncRef = useRef(false);
  const playerReadyRef = useRef(false);
  const playerStartRef = useRef(0);
  const lastSyncMsRef = useRef<number>(0);
  const lastTrackLoadKeyRef = useRef<string | null>(null);
  const lastLoadedVideoIdRef = useRef<string | null>(null);
  const lastTrackSessionRef = useRef<string | null>(null);
  const lastPassiveResumeRef = useRef<number>(0);
  const resumeNeedsSyncRef = useRef(false);
  const resyncTimersRef = useRef<number[]>([]);
  const initialAudioHoldReleaseTimerRef = useRef<number | null>(null);
  const initialAudioSyncPendingRef = useRef(false);
  const lastTimeRequestAtMsRef = useRef<number>(0);
  const lastPlayerStateRef = useRef<number | null>(null);
  const lastPlayerTimeSecRef = useRef<number | null>(null);
  const lastPlayerTimeAtMsRef = useRef<number>(0);
  const lastTimeRequestReasonRef = useRef("init");
  const guessLoopSpanRef = useRef<number | null>(null);
  const revealReplayRef = useRef(false);
  const lastRevealStartKeyRef = useRef<string | null>(null);
  const bufferingStartedAtRef = useRef<number | null>(null);
  const lastBufferingAtMsRef = useRef<number>(0);
  const bufferingGraceUntilMsRef = useRef<number>(0);
  const lastAutoResumeAttemptAtMsRef = useRef<number>(0);
  const listeningRetryTimerRef = useRef<number | null>(null);
  const playbackStartTimerRef = useRef<number | null>(null);
  const playbackWarmupTimerRef = useRef<number | null>(null);
  const playbackWarmupStopTimerRef = useRef<number | null>(null);
  const postStartDriftTimersRef = useRef<number[]>([]);
  // post-start drift 若被 buffering grace 擋下且仍偏差，允許最多 1 次重試
  const postStartDriftRetriedRef = useRef(false);
  const silentAudioStartTimerRef = useRef<number | null>(null);
  const silentAudioPlayPromiseRef = useRef<Promise<void> | null>(null);
  const hasMediaSessionMetadataRef = useRef(false);
  const lastMediaSessionPlaybackStateRef = useRef<
    MediaSessionPlaybackState | null
  >(null);
  const pendingResumeSyncReasonRef = useRef("resume");
  const lastWaitingToStartRef = useRef(waitingToStart);
  const prestartWarmupActiveRef = useRef(false);
  const previousServerOffsetRef = useRef(serverOffsetMs);
  const trackPreparedRef = useRef(false);
  // ── Recovery loop kick ref ──────────────────────────────────────────────────
  // 讓 onStateChange / visibility handler 在 loop 停止後能重新啟動它。
  // 設計目標：healthy state 下 loop 自動停止；只在偵測到問題時才重啟。
  const recoveryLoopKickRef = useRef<(() => void) | null>(null);

  const isSyncDebugEnabled = useCallback(() => {
    if (typeof window === "undefined") return false;
    return (
      window.localStorage.getItem(SYNC_DEBUG_STORAGE_KEY) === "1" ||
      window.location.search.includes("debugSync=1")
    );
  }, []);

  const debugSync = useCallback(
    (label: string, payload?: Record<string, unknown>) => {
      if (!isSyncDebugEnabled()) return;
      const clientNow = Date.now();
      const serverNow = getServerNowMs();
      console.debug(`[mq-sync] ${label}`, {
        clientNow,
        serverNow,
        serverOffsetMs: serverNow - clientNow,
        trackSessionKey,
        startedAt,
        ...payload,
      });
    },
    [getServerNowMs, isSyncDebugEnabled, startedAt, trackSessionKey],
  );

  const clearPlaybackStartTimer = useCallback(() => {
    if (playbackStartTimerRef.current !== null) {
      window.clearTimeout(playbackStartTimerRef.current);
      playbackStartTimerRef.current = null;
    }
  }, []);

  const clearPlaybackWarmupTimers = useCallback(() => {
    if (playbackWarmupTimerRef.current !== null) {
      window.clearTimeout(playbackWarmupTimerRef.current);
      playbackWarmupTimerRef.current = null;
    }
    if (playbackWarmupStopTimerRef.current !== null) {
      window.clearTimeout(playbackWarmupStopTimerRef.current);
      playbackWarmupStopTimerRef.current = null;
    }
    prestartWarmupActiveRef.current = false;
  }, []);

  const clearPostStartDriftTimers = useCallback(() => {
    postStartDriftTimersRef.current.forEach((timerId) =>
      window.clearTimeout(timerId),
    );
    postStartDriftTimersRef.current = [];
  }, []);

  const clearSilentAudioStartTimer = useCallback(() => {
    if (silentAudioStartTimerRef.current !== null) {
      window.clearTimeout(silentAudioStartTimerRef.current);
      silentAudioStartTimerRef.current = null;
    }
  }, []);

  const markAudioUnlocked = useCallback(() => {
    if (audioUnlockedRef.current) return;
    // Mobile gesture playback may continue in the same event loop, so update
    // the ref immediately instead of waiting for the state commit.
    audioUnlockedRef.current = true;
    setAudioUnlockSessionKey(audioGestureSessionKey);
  }, [audioGestureSessionKey]);

  useEffect(() => {
    audioUnlockedRef.current = audioUnlocked;
  }, [audioUnlocked]);

  useEffect(() => {
    const offsetDelta = serverOffsetMs - previousServerOffsetRef.current;
    if (offsetDelta === 0) return;
    if (lastSyncMsRef.current !== 0) {
      lastSyncMsRef.current += offsetDelta;
    }
    if (lastPlayerTimeAtMsRef.current !== 0) {
      lastPlayerTimeAtMsRef.current += offsetDelta;
    }
    if (lastTimeRequestAtMsRef.current !== 0) {
      lastTimeRequestAtMsRef.current += offsetDelta;
    }
    previousServerOffsetRef.current = serverOffsetMs;
  }, [serverOffsetMs]);

  useEffect(() => {
    return () => {
      if (listeningRetryTimerRef.current !== null) {
        window.clearTimeout(listeningRetryTimerRef.current);
        listeningRetryTimerRef.current = null;
      }
      clearPlaybackStartTimer();
      clearPlaybackWarmupTimers();
      clearPostStartDriftTimers();
      clearSilentAudioStartTimer();
    };
  }, [
    clearPlaybackStartTimer,
    clearPlaybackWarmupTimers,
    clearPostStartDriftTimers,
    clearSilentAudioStartTimer,
  ]);

  const postPlayerMessage = useCallback(
    (payload: Record<string, unknown>, logLabel: string) => {
      try {
        const frame = iframeRef.current;
        if (!frame || !frame.isConnected) return false;
        const target = frame.contentWindow;
        if (!target) return false;
        target.postMessage(JSON.stringify(payload), "*");
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.toLowerCase().includes("disconnected port")) {
          return false;
        }
        console.error(`${logLabel} failed`, err);
        return false;
      }
    },
    [],
  );

  const applyVolume = useCallback(
    (val: number) => {
      const safeVolume = Math.min(100, Math.max(0, val));
      postPlayerMessage(
        {
          event: "command",
          func: "setVolume",
          args: [safeVolume],
        },
        "setVolume",
      );
    },
    [postPlayerMessage],
  );

  const revealStartAt = revealEndsAt - revealDurationMs;
  const revealDurationSec = Math.max(0, revealDurationMs / 1000);
  const clipLengthSec = Math.max(0.01, clipEndSec - clipStartSec);

  const computeServerPositionSec = useCallback(() => {
    const elapsed = Math.max(0, (getServerNowMs() - startedAt) / 1000);
    const loopSpan = guessLoopSpanRef.current;
    if (phase === "guess" && loopSpan && loopSpan > 0.01) {
      const offset = elapsed % loopSpan;
      return Math.min(clipEndSec, clipStartSec + offset);
    }
    return Math.min(clipEndSec, clipStartSec + elapsed);
  }, [clipEndSec, clipStartSec, getServerNowMs, phase, startedAt]);

  const computeRevealPositionSec = useCallback(() => {
    const elapsed = Math.max(0, (getServerNowMs() - revealStartAt) / 1000);
    const effectiveElapsed =
      revealDurationSec > 0 ? Math.min(elapsed, revealDurationSec) : elapsed;
    const offset = clipLengthSec > 0 ? effectiveElapsed % clipLengthSec : 0;
    return Math.min(clipEndSec, clipStartSec + offset);
  }, [
    clipEndSec,
    clipLengthSec,
    clipStartSec,
    getServerNowMs,
    revealDurationSec,
    revealStartAt,
  ]);

  const getDesiredPositionSec = useCallback(() => {
    if (revealReplayRef.current) {
      return computeRevealPositionSec();
    }
    return computeServerPositionSec();
  }, [computeRevealPositionSec, computeServerPositionSec]);

  const getEstimatedLocalPositionSec = useCallback(() => {
    const elapsed = (getServerNowMs() - lastSyncMsRef.current) / 1000;
    return Math.min(clipEndSec, Math.max(0, playerStartRef.current + elapsed));
  }, [clipEndSec, getServerNowMs]);

  useEffect(() => {
    guessLoopSpanRef.current = null;
  }, [trackLoadKey, trackSessionKey]);

  useEffect(() => {
    bufferingStartedAtRef.current = null;
    bufferingGraceUntilMsRef.current = 0;
    postStartDriftRetriedRef.current = false;
    awaitingFirstPlaySyncRef.current = false;
  }, [trackSessionKey]);

  const postCommand = useCallback(
    (func: string, args: unknown[] = []) => {
      postPlayerMessage(
        {
          event: "command",
          func,
          args,
          id: PLAYER_ID,
        },
        func,
      );
    },
    [postPlayerMessage],
  );

  const requestPlayerTime = useCallback(
    (reason: string) => {
      if (!playerReadyRef.current) return false;
      lastTimeRequestReasonRef.current = reason;
      lastTimeRequestAtMsRef.current = getServerNowMs();
      postCommand("getCurrentTime");
      return true;
    },
    [getServerNowMs, postCommand],
  );

  const isStartedByServerTime = useCallback(() => {
    return getServerNowMs() >= startedAt;
  }, [getServerNowMs, startedAt]);

  const getFreshPlayerTimeSec = useCallback(() => {
    const nowMs = getServerNowMs();
    if (nowMs - lastPlayerTimeAtMsRef.current > 2000) return null;
    return lastPlayerTimeSecRef.current;
  }, [getServerNowMs]);

  const getPlayerDebugPayload = useCallback(
    (state?: number) => ({
      ...(typeof state === "number" ? { state } : {}),
      currentTrackIndex,
      trackSessionKey,
      waitingToStart,
      isReveal,
      lastPlayerTimeSec: lastPlayerTimeSecRef.current,
      lastTimeRequestReason: lastTimeRequestReasonRef.current,
    }),
    [currentTrackIndex, isReveal, trackSessionKey, waitingToStart],
  );

  const isBufferingGraceActive = useCallback(
    (nowMs = getServerNowMs()) => nowMs < bufferingGraceUntilMsRef.current,
    [getServerNowMs],
  );

  const hasRecentBuffering = useCallback(
    (windowMs = RECENT_BUFFERING_WINDOW_MS, nowMs = getServerNowMs()) =>
      nowMs - lastBufferingAtMsRef.current <= windowMs,
    [getServerNowMs],
  );

  const updateMediaSession = useCallback(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    if (typeof MediaMetadata === "undefined") return;
    try {
      const silentAudio = silentAudioRef.current;
      const hasSilentAudioSession =
        requiresAudioGesture &&
        audioUnlockedRef.current &&
        !!silentAudio &&
        !silentAudio.paused;
      const playbackState: MediaSessionPlaybackState = hasSilentAudioSession
        ? "playing"
        : isEnded
          ? "paused"
          : "playing";
      // Dedup: skip if playbackState hasn't changed; cheap no-op rather than
      // a timed throttle (no need for isMobileClient branch).
      if (lastMediaSessionPlaybackStateRef.current === playbackState) return;
      if (!hasMediaSessionMetadataRef.current) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: "Muizo",
          artist: "Music Quiz",
          album: "Competitive Audio Mode",
        });
        hasMediaSessionMetadataRef.current = true;
      }
      navigator.mediaSession.playbackState = playbackState;
      lastMediaSessionPlaybackStateRef.current = playbackState;
    } catch (err) {
      console.error("mediaSession setup failed", err);
    }
  }, [isEnded, requiresAudioGesture]);

  const startSilentAudio = useCallback(() => {
    const audio = silentAudioRef.current;
    if (!audio) return;
    audio.loop = true;
    audio.preload = "auto";
    audio.muted = false;
    audio.volume = 1;
    updateMediaSession();
    if (!audio.paused) {
      clearSilentAudioStartTimer();
      silentAudioStartTimerRef.current = window.setTimeout(() => {
        silentAudioStartTimerRef.current = null;
        updateMediaSession();
      }, 300);
      return;
    }
    if (silentAudioPlayPromiseRef.current) return;
    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === "function") {
      silentAudioPlayPromiseRef.current = playPromise
        .catch(() => {
          updateMediaSession();
        })
        .finally(() => {
          silentAudioPlayPromiseRef.current = null;
          clearSilentAudioStartTimer();
          silentAudioStartTimerRef.current = window.setTimeout(() => {
            silentAudioStartTimerRef.current = null;
            updateMediaSession();
          }, 300);
        });
    } else {
      clearSilentAudioStartTimer();
      silentAudioStartTimerRef.current = window.setTimeout(() => {
        silentAudioStartTimerRef.current = null;
        updateMediaSession();
      }, 300);
    }
  }, [clearSilentAudioStartTimer, updateMediaSession]);

  const stopSilentAudio = useCallback(() => {
    const audio = silentAudioRef.current;
    if (!audio) return;
    try {
      clearSilentAudioStartTimer();
      audio.pause();
      audio.currentTime = 0;
      updateMediaSession();
    } catch (err) {
      console.error("Failed to stop silent audio", err);
    }
  }, [clearSilentAudioStartTimer, updateMediaSession]);

  const clearInitialAudioHoldReleaseTimer = useCallback(() => {
    if (initialAudioHoldReleaseTimerRef.current !== null) {
      window.clearTimeout(initialAudioHoldReleaseTimerRef.current);
      initialAudioHoldReleaseTimerRef.current = null;
    }
  }, []);

  const releaseInitialAudioHold = useCallback(() => {
    clearInitialAudioHoldReleaseTimer();
    if (!initialAudioSyncPendingRef.current) return;
    initialAudioSyncPendingRef.current = false;
    postCommand("unMute");
    applyVolume(gameVolume);
  }, [applyVolume, clearInitialAudioHoldReleaseTimer, gameVolume, postCommand]);

  const scheduleInitialAudioHoldRelease = useCallback(
    (delayMs = NO_WARMUP_HOLD_MS) => {
      clearInitialAudioHoldReleaseTimer();
      initialAudioHoldReleaseTimerRef.current = window.setTimeout(() => {
        releaseInitialAudioHold();
      }, delayMs);
    },
    [clearInitialAudioHoldReleaseTimer, releaseInitialAudioHold],
  );

  const armInitialAudioSync = useCallback(
    (holdDelayMs = NO_WARMUP_HOLD_MS) => {
      initialAudioSyncPendingRef.current = true;
      scheduleInitialAudioHoldRelease(holdDelayMs);
    },
    [scheduleInitialAudioHoldRelease],
  );

  const loadTrack = useCallback(
    (
      id: string,
      startSeconds: number,
      endSeconds: number | undefined,
      autoplay: boolean,
      reason: "loadTrack-cue" | "loadTrack-autoplay",
    ) => {
      trackPreparedRef.current = false;
      debugSync("loadTrack", {
        videoId: id,
        startSeconds,
        endSeconds,
        autoplay,
        reason,
      });
      const payload = {
        videoId: id,
        startSeconds,
        ...(typeof endSeconds === "number" ? { endSeconds } : {}),
      };
      postCommand(autoplay ? "loadVideoById" : "cueVideoById", [payload]);
      lastLoadedVideoIdRef.current = id;
      lastSyncMsRef.current = getServerNowMs();
    },
    [debugSync, getServerNowMs, postCommand],
  );

  const startPlayback = useCallback(
    (
      forcedPosition?: number,
      forceSeek = false,
      options?: {
        holdAudio?: boolean;
        holdReleaseDelayMs?: number;
        reason?:
          | "startPlayback-startedAt"
          | "post-start-drift"
          | "watchdog"
          | "resume"
          | "media-seek"
          | "guess-loop"
          | "reveal-replay";
      },
    ) => {
      if (requiresAudioGesture && !audioUnlockedRef.current) return;
      const serverNowMs = getServerNowMs();
      if (serverNowMs < startedAt) return;
      const rawStartPos = forcedPosition ?? getDesiredPositionSec();
      const startPos = Math.min(
        clipEndSec,
        Math.max(clipStartSec, rawStartPos),
      );
      const estimated = getEstimatedLocalPositionSec();
      const bufferingGraceActive = isBufferingGraceActive(serverNowMs);
      const suppressCorrectiveSeek =
        bufferingGraceActive &&
        options?.reason !== "startPlayback-startedAt" &&
        options?.reason !== "guess-loop";
      const needsSeek =
        !suppressCorrectiveSeek &&
        (forceSeek || Math.abs(estimated - startPos) > DRIFT_TOLERANCE_SEC);
      const holdAudio =
        options?.holdAudio ?? initialAudioSyncPendingRef.current;
      if (Math.abs(playerStartRef.current - startPos) > 0.01) {
        playerStartRef.current = startPos;
      }
      lastSyncMsRef.current = serverNowMs;

      // 標記：T0 首次起播後，等待下次 state=1 立即對齊。不涵蓋 resume / media-seek
      // / guess-loop / reveal-replay / post-start-drift（這些已有各自的對齊路徑）。
      if (options?.reason === "startPlayback-startedAt") {
        awaitingFirstPlaySyncRef.current = true;
      }

      if (needsSeek) {
        debugSync("seekTo", {
          reason: options?.reason ?? "startPlayback-startedAt",
          startPos,
          estimated,
          forceSeek,
          bufferingGraceActive,
          holdAudio,
        });
        postCommand("seekTo", [startPos, true]);
      }
      startSilentAudio();
      debugSync("playVideo", {
        reason: options?.reason ?? "startPlayback-startedAt",
        startPos,
        estimated,
        needsSeek,
        holdAudio,
      });
      postCommand("playVideo");
      if (holdAudio) {
        postCommand("mute");
        scheduleInitialAudioHoldRelease(options?.holdReleaseDelayMs);
      } else {
        postCommand("unMute");
        applyVolume(gameVolume);
      }
    },
    [
      applyVolume,
      clipEndSec,
      clipStartSec,
      debugSync,
      gameVolume,
      getDesiredPositionSec,
      getEstimatedLocalPositionSec,
      getServerNowMs,
      isBufferingGraceActive,
      postCommand,
      requiresAudioGesture,
      scheduleInitialAudioHoldRelease,
      startSilentAudio,
      startedAt,
    ],
  );

  // Schedule a single drift check at T0 + POST_START_DRIFT_CHECK_MS. The
  // infoDelivery handler picks up the response and calls syncToServerPosition
  // with POST_START_DRIFT_TOLERANCE_SEC (0.35s) — tight threshold only for
  // this one-shot early check. After that, we don't poll again.
  const schedulePostStartDriftChecks = useCallback(() => {
    clearPostStartDriftTimers();
    const timerId = window.setTimeout(() => {
      if (!playerReadyRef.current) return;
      requestPlayerTime(`post-start-drift-${POST_START_DRIFT_CHECK_MS}`);
    }, POST_START_DRIFT_CHECK_MS);
    postStartDriftTimersRef.current.push(timerId);
  }, [clearPostStartDriftTimers, requestPlayerTime]);

  // ── Prestart warmup ────────────────────────────────────────────────────────
  // At T-PRESTART_WARMUP_LEAD_MS (4500ms before the scheduled startedAt):
  //   1. mute + seek to clipStart
  //   2. playVideo for PRESTART_WARMUP_PLAY_MS (140ms) to prime the codec AND
  //      kick off byte loading (cueVideoById alone does not load bytes)
  //   3. pauseVideo + seek back to clipStart
  //   4. hold (muted, paused, at clipStart) until T0
  // This gives the YouTube player ~4.5s headroom to buffer the clip before
  // playback begins — essential on slow networks where 2s was too tight and
  // left players starting 3s behind server position.
  const startPrestartWarmup = useCallback(() => {
    clearPlaybackWarmupTimers();
    if (
      !playerReadyRef.current ||
      !trackPreparedRef.current ||
      !videoId ||
      isEnded
    )
      return;
    if (requiresAudioGesture && !audioUnlockedRef.current) return;
    if (isStartedByServerTime()) return;
    prestartWarmupActiveRef.current = true;
    playerStartRef.current = clipStartSec;
    lastSyncMsRef.current = getServerNowMs();
    startSilentAudio();
    debugSync("prestart-warmup-start", {
      reason: "prestart-warmup",
      warmupLeadMs: PRESTART_WARMUP_LEAD_MS,
      warmupPlayMs: PRESTART_WARMUP_PLAY_MS,
      targetSec: clipStartSec,
    });
    postCommand("mute");
    postCommand("seekTo", [clipStartSec, true]);
    postCommand("playVideo");
    playbackWarmupStopTimerRef.current = window.setTimeout(() => {
      playbackWarmupStopTimerRef.current = null;
      if (isStartedByServerTime()) return;
      debugSync("prestart-warmup-stop", { targetSec: clipStartSec });
      postCommand("pauseVideo");
      postCommand("seekTo", [clipStartSec, true]);
      // prestartWarmupActiveRef stays true until T0 handler consumes it — that
      // flag tells schedulePlaybackStart whether warmup completed (use short
      // final hold) or was skipped (use longer no-warmup hold).
    }, PRESTART_WARMUP_PLAY_MS);
  }, [
    clearPlaybackWarmupTimers,
    clipStartSec,
    debugSync,
    getServerNowMs,
    isEnded,
    isStartedByServerTime,
    postCommand,
    requiresAudioGesture,
    startSilentAudio,
    videoId,
  ]);

  // ── Schedule playback start ────────────────────────────────────────────────
  // Plans two timers relative to startedAt:
  //   1. Warmup timer at max(0, delayMs - PRESTART_WARMUP_LEAD_MS) — skipped
  //      if there isn't enough lead (Q2+ where delayMs ≤ PRESTART_WARMUP_LEAD_MS;
  //      the player starts catchup-muted instead). For Q1 (5s countdown),
  //      warmup fires ~500ms after schedulePlaybackStart and runs until T0.
  //   2. Playback start timer at delayMs — at T0, playVideo + schedule unmute.
  // If startedAt is already ≤ now (Q2+ / late join), go straight to muted
  // playback with the longer no-warmup hold; the recovery loop + post-start
  // drift check will catch up to server position.
  const schedulePlaybackStart = useCallback(() => {
    clearPlaybackStartTimer();
    clearPlaybackWarmupTimers();
    if (
      !playerReadyRef.current ||
      !trackPreparedRef.current ||
      !videoId ||
      isEnded
    ) {
      debugSync("schedulePlaybackStart-deferred", {
        hasPlayerReady: playerReadyRef.current,
        trackPrepared: trackPreparedRef.current,
        hasVideoId: !!videoId,
        isEnded,
      });
      return;
    }
    if (requiresAudioGesture && !audioUnlockedRef.current) return;

    const delayMs = startedAt - getServerNowMs();

    // Already past T0 — no lead time, go straight to muted playback and let
    // the recovery loop + post-start drift check handle alignment.
    if (delayMs <= 0) {
      armInitialAudioSync(NO_WARMUP_HOLD_MS);
      startPlayback(undefined, true, {
        holdAudio: true,
        holdReleaseDelayMs: NO_WARMUP_HOLD_MS,
        reason: "startPlayback-startedAt",
      });
      return;
    }

    // Schedule warmup only if there's enough lead.
    const scheduleWarmup = delayMs > PRESTART_WARMUP_LEAD_MS;
    if (scheduleWarmup) {
      playbackWarmupTimerRef.current = window.setTimeout(
        () => {
          playbackWarmupTimerRef.current = null;
          startPrestartWarmup();
        },
        delayMs - PRESTART_WARMUP_LEAD_MS,
      );
    }

    // Schedule the actual T0 start.
    playbackStartTimerRef.current = window.setTimeout(() => {
      playbackStartTimerRef.current = null;
      if (!playerReadyRef.current || !videoId || isEnded) return;
      const warmupWasActive = prestartWarmupActiveRef.current;
      prestartWarmupActiveRef.current = false;
      const holdMs = warmupWasActive ? PRESTART_FINAL_HOLD_MS : NO_WARMUP_HOLD_MS;
      armInitialAudioSync(holdMs);
      startPlayback(undefined, warmupWasActive, {
        holdAudio: true,
        holdReleaseDelayMs: holdMs,
        reason: "startPlayback-startedAt",
      });
    }, delayMs);

    debugSync("schedulePlaybackStart", {
      delayMs,
      warmupScheduled: scheduleWarmup,
      warmupLeadMs: scheduleWarmup ? PRESTART_WARMUP_LEAD_MS : 0,
    });
  }, [
    armInitialAudioSync,
    clearPlaybackStartTimer,
    clearPlaybackWarmupTimers,
    debugSync,
    getServerNowMs,
    isEnded,
    requiresAudioGesture,
    startPrestartWarmup,
    startPlayback,
    startedAt,
    videoId,
  ]);

  // Called once per track when YouTube reports state 5 (cued) or 1 (playing).
  // If server time is already past startedAt (Q2+ / late join), start muted
  // playback immediately with the no-warmup hold; otherwise schedule the
  // normal warmup + T0 start sequence.
  const handleTrackPrepared = useCallback(
    (state: number) => {
      if (trackPreparedRef.current) return;
      trackPreparedRef.current = true;
      debugSync("track-prepared", { state, waitingToStart });
      if (isStartedByServerTime()) {
        if (hasStartedPlaybackRef.current) return;
        armInitialAudioSync(NO_WARMUP_HOLD_MS);
        startPlayback(undefined, true, {
          holdAudio: true,
          holdReleaseDelayMs: NO_WARMUP_HOLD_MS,
          reason: "startPlayback-startedAt",
        });
        return;
      }
      schedulePlaybackStart();
    },
    [
      armInitialAudioSync,
      debugSync,
      isStartedByServerTime,
      schedulePlaybackStart,
      startPlayback,
      waitingToStart,
    ],
  );

  const unlockAudioAndStart = useCallback(() => {
    primeSfxAudio();

    // 沒 ready 時，完全不允許進入真正解鎖
    if (!playerReadyRef.current) {
      resumeNeedsSyncRef.current = true;
      return false;
    }

    if (!audioUnlockedRef.current) {
      markAudioUnlocked();
    }

    startSilentAudio();

    const serverNow = getServerNowMs();
    if (serverNow < startedAt) {
      // Gesture happened before T0 — do a short play/pause to unlock the
      // codec, then hold at clipStart. The normal schedulePlaybackStart flow
      // will take over for the actual T0 start.
      debugSync("gesture-unlock-warmup", { targetSec: clipStartSec });
      postCommand("seekTo", [clipStartSec, true]);
      postCommand("playVideo");
      window.setTimeout(() => {
        postCommand("pauseVideo");
        postCommand("seekTo", [clipStartSec, true]);
      }, 120);
      return true;
    }

    // Gesture happened after T0 — start muted, let recovery/drift check align.
    armInitialAudioSync(NO_WARMUP_HOLD_MS);
    startPlayback(undefined, false, {
      holdAudio: true,
      holdReleaseDelayMs: NO_WARMUP_HOLD_MS,
      reason: "startPlayback-startedAt",
    });

    return true;
  }, [
    armInitialAudioSync,
    clipStartSec,
    debugSync,
    getServerNowMs,
    markAudioUnlocked,
    postCommand,
    primeSfxAudio,
    startPlayback,
    startSilentAudio,
    startedAt,
  ]);

  const handleGestureOverlayTrigger = useCallback(
    (event?: React.SyntheticEvent) => {
      event?.preventDefault();
      event?.stopPropagation();

      // 第二層保護：沒 ready 不做事
      if (!playerReadyRef.current) return;

      unlockAudioAndStart();
    },
    [unlockAudioAndStart],
  );
  // ── syncToServerPosition ───────────────────────────────────────────────────
  // Compares estimated local position against server-expected position. If
  // drift exceeds toleranceSec (default: DRIFT_TOLERANCE_SEC), issues a single
  // seek via startPlayback(). Otherwise updates local sync state and ensures
  // the player is in the "playing + unmuted" state.
  //
  // During reveal (non-replay mode), the clip is looping: we don't seek, just
  // ensure playback continues — seeking would jump mid-loop for no benefit.
  // Buffering grace window also suppresses seek (seeking mid-buffer stalls).
  const syncToServerPosition = useCallback(
    (
      reason: string,
      forceSeek = false,
      toleranceSec = DRIFT_TOLERANCE_SEC,
      requirePlayerTime = false,
      bypassBufferingGrace = false,
    ) => {
      const nowMs = getServerNowMs();
      const bufferingGraceActive =
        !bypassBufferingGrace && isBufferingGraceActive(nowMs);
      if (isReveal && !revealReplayRef.current && !forceSeek) {
        if (lastPlayerStateRef.current !== 1 && !bufferingGraceActive) {
          postCommand("playVideo");
          postCommand("unMute");
          applyVolume(gameVolume);
        }
        return false;
      }
      const serverPosition = getDesiredPositionSec();
      const playerTime = getFreshPlayerTimeSec();
      if (requirePlayerTime && playerTime === null) {
        return false;
      }
      const estimated = playerTime ?? getEstimatedLocalPositionSec();
      const drift = Math.abs(estimated - serverPosition);
      // 大偏差例外：只有拿到真實 player time（非本地估算）且偏差超過 1.5s 時，
      // 即使在 buffering grace 內也強制 seek。原因：此時 player 正在錯誤位置
      // 緩衝錯誤內容，不 seek 永遠對不齊（典型：慢速 4G 首播 drift check 落在
      // grace 窗口內被擋下）。
      const isLargeRealDrift =
        playerTime !== null && drift > LARGE_DRIFT_OVERRIDE_SEC;
      const shouldSeek =
        isLargeRealDrift ||
        (!bufferingGraceActive &&
          (drift > toleranceSec || (forceSeek && playerTime === null)));
      if (shouldSeek) {
        if (isLargeRealDrift && bufferingGraceActive) {
          debugSync("large-drift-override", {
            reason,
            playerTime,
            serverPosition,
            drift,
            bufferingGraceUntilMs: bufferingGraceUntilMsRef.current,
          });
        }
        startPlayback(serverPosition, true, {
          holdAudio: initialAudioSyncPendingRef.current,
          reason:
            reason === "media-seek"
              ? "media-seek"
              : reason.startsWith("resume") || reason === "infoDelivery"
                ? "resume"
                : reason.startsWith("post-start-drift")
                  ? "post-start-drift"
                  : "startPlayback-startedAt",
        });
        return true;
      }
      playerStartRef.current = serverPosition;
      lastSyncMsRef.current = getServerNowMs();
      if (initialAudioSyncPendingRef.current) {
        releaseInitialAudioHold();
      }
      if (lastPlayerStateRef.current !== 1 && !bufferingGraceActive) {
        postCommand("playVideo");
        postCommand("unMute");
        applyVolume(gameVolume);
      }
      return false;
    },
    [
      applyVolume,
      debugSync,
      gameVolume,
      getDesiredPositionSec,
      getEstimatedLocalPositionSec,
      getFreshPlayerTimeSec,
      getServerNowMs,
      isBufferingGraceActive,
      isReveal,
      postCommand,
      releaseInitialAudioHold,
      startPlayback,
    ],
  );

  // Single delayed resync check after resume (visibility return / media-seek).
  // If drift still exceeds tolerance at RESUME_RESYNC_CHECK_MS, a single seek
  // correction is issued via syncToServerPosition.
  const scheduleResumeResync = useCallback(() => {
    resyncTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    resyncTimersRef.current = [];
    const timerId = window.setTimeout(() => {
      if (!playerReadyRef.current) return;
      if (document.visibilityState !== "visible") return;
      if (getServerNowMs() < startedAt) return;
      requestPlayerTime(`resume-${RESUME_RESYNC_CHECK_MS}`);
      window.setTimeout(() => {
        syncToServerPosition(
          `resume-check-${RESUME_RESYNC_CHECK_MS}`,
          false,
          DRIFT_TOLERANCE_SEC,
          true,
        );
      }, 120);
    }, RESUME_RESYNC_CHECK_MS);
    resyncTimersRef.current.push(timerId);
  }, [getServerNowMs, requestPlayerTime, startedAt, syncToServerPosition]);

  const requestPlayerTimeRef = useRef(requestPlayerTime);
  const scheduleResumeResyncRef = useRef(scheduleResumeResync);
  const syncToServerPositionRef = useRef(syncToServerPosition);
  const updateMediaSessionRef = useRef(updateMediaSession);

  useEffect(() => {
    requestPlayerTimeRef.current = requestPlayerTime;
    scheduleResumeResyncRef.current = scheduleResumeResync;
    syncToServerPositionRef.current = syncToServerPosition;
    updateMediaSessionRef.current = updateMediaSession;
  }, [
    requestPlayerTime,
    scheduleResumeResync,
    syncToServerPosition,
    updateMediaSession,
  ]);

  useEffect(
    () => () => {
      clearInitialAudioHoldReleaseTimer();
      clearPlaybackStartTimer();
      clearPlaybackWarmupTimers();
      clearPostStartDriftTimers();
      resyncTimersRef.current.forEach((timerId) =>
        window.clearTimeout(timerId),
      );
      stopSilentAudio();
    },
    [
      clearInitialAudioHoldReleaseTimer,
      clearPlaybackStartTimer,
      clearPlaybackWarmupTimers,
      clearPostStartDriftTimers,
      stopSilentAudio,
    ],
  );

  useEffect(() => {
    if (lastWaitingToStartRef.current && !waitingToStart) {
      debugSync("waitingToStart=false");
    }
    lastWaitingToStartRef.current = waitingToStart;
  }, [debugSync, waitingToStart]);

  // ── Recovery monitor loop ──────────────────────────────────────────────────
  // 事件驅動：healthy 時 loop 停止；偵測到壞狀態或 visibility 回前景時由
  // recoveryLoopKickRef() 重啟。
  //
  //  • 什麼情況會繼續跑（needsRecoverySync=true）：
  //      - waitingToStart：開局前等待
  //      - !playerReadyRef：player 尚未 ready
  //      - recentlyStarted：開始後 2.5s 內補同步視窗
  //      - playerState === 2：意外暫停，需重啟
  //      - playerState === null / -1：未初始化，需觸發播放
  //      - bufferingNeedsRecovery：緩衝超過 grace 期
  //      - resumeNeedsSyncRef：回前景後需補同步
  //
  //  • 輪詢間隔（單一策略，不再分 mobile / desktop）：
  //      - 背景：BACKGROUND_MONITOR_INTERVAL_MS (2000ms)
  //      - 前景需 recovery：RECOVERY_MONITOR_INTERVAL_MS (500ms)
  //      - 前景 healthy：loop 停止
  useEffect(() => {
    let timerId: number | null = null;

    const scheduleNext = (delayMs: number) => {
      timerId = window.setTimeout(tick, delayMs);
    };

    // kick：讓外部事件處理器（onStateChange / visibility）在 loop 停止後重啟它
    const kick = () => {
      if (timerId !== null) return; // 已在跑，不重複啟動
      tick();
    };

    const tick = () => {
      const visibilityHidden =
        typeof document !== "undefined" &&
        document.visibilityState !== "visible";
      const now = getServerNowMs();
      const playerState = lastPlayerStateRef.current;
      const recentlyStarted =
        now >= startedAt && now - startedAt < RECENT_START_GUARD_MS;
      const bufferingGraceActive = isBufferingGraceActive(now);
      const bufferingNeedsRecovery =
        playerState === 3 && !bufferingGraceActive;

      const needsRecoverySync =
        waitingToStart ||
        !playerReadyRef.current ||
        isEnded ||
        resumeNeedsSyncRef.current ||
        recentlyStarted ||
        playerState === 2 ||
        bufferingNeedsRecovery ||
        playerState === null ||
        playerState === -1;

      if (
        resumeNeedsSyncRef.current &&
        playerReadyRef.current &&
        now >= startedAt
      ) {
        pendingResumeSyncReasonRef.current = "interval-resume";
        requestPlayerTime("interval-resume");
        scheduleNext(420);
        return;
      }

      if (!visibilityHidden && needsRecoverySync) {
        const canAutoResumeNow =
          now - lastAutoResumeAttemptAtMsRef.current >=
          AUTO_RESUME_MIN_INTERVAL_MS;

        if (playerReadyRef.current && now >= startedAt && !isEnded) {
          if (playerState === 2 && canAutoResumeNow) {
            lastAutoResumeAttemptAtMsRef.current = now;
            postCommand("playVideo");
            postCommand("unMute");
            applyVolume(gameVolume);
          } else if (
            (playerState === null || playerState === -1) &&
            canAutoResumeNow
          ) {
            lastAutoResumeAttemptAtMsRef.current = now;
            startPlayback();
          }
        }
      }

      // Healthy → loop 停止，等待 kick 重啟
      if (!needsRecoverySync) {
        timerId = null;
        return;
      }

      const nextDelay = visibilityHidden
        ? BACKGROUND_MONITOR_INTERVAL_MS
        : RECOVERY_MONITOR_INTERVAL_MS;

      scheduleNext(nextDelay);
    };

    // 將 kick 暴露給外部 effect（onStateChange / visibility handler）
    recoveryLoopKickRef.current = kick;

    tick();

    return () => {
      if (timerId !== null) window.clearTimeout(timerId);
      recoveryLoopKickRef.current = null; // 避免 unmount 後的過期 kick
    };
  }, [
    applyVolume,
    gameVolume,
    getServerNowMs,
    isEnded,
    postCommand,
    requestPlayerTime,
    startPlayback,
    startedAt,
    waitingToStart,
    isBufferingGraceActive,
  ]);

  useEffect(() => {
    applyVolume(gameVolume);
  }, [applyVolume, gameVolume]);

  useEffect(() => {
    if (!isEnded) return;
    updateMediaSession();
  }, [isEnded, updateMediaSession]);

  useEffect(() => {
    if (!requiresAudioGesture || !audioUnlocked) return;
    updateMediaSession();
  }, [audioUnlocked, requiresAudioGesture, updateMediaSession]);

  useEffect(() => {
    if (isEnded) return;
    if (requiresAudioGesture && !audioUnlockedRef.current) return;
    startSilentAudio();
  }, [
    currentTrackIndex,
    isEnded,
    phase,
    requiresAudioGesture,
    startedAt,
    startSilentAudio,
  ]);

  useEffect(() => {
    applyVolume(gameVolume);
  }, [applyVolume, currentTrackIndex, gameVolume, startedAt]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    if (typeof MediaMetadata === "undefined") return;

    try {
      const noop = () => {};

      const handleMediaSeek = () => {
        resumeNeedsSyncRef.current = true;
        pendingResumeSyncReasonRef.current = "media-seek";
        requestPlayerTimeRef.current("media-seek");
        window.setTimeout(() => {
          syncToServerPositionRef.current("media-seek");
          scheduleResumeResyncRef.current();
        }, 120);
      };

      const actions: Array<MediaSessionAction> = [
        "play",
        "pause",
        "stop",
        "seekbackward",
        "seekforward",
        "seekto",
        "previoustrack",
        "nexttrack",
      ];

      actions.forEach((action) => {
        try {
          if (
            action === "seekbackward" ||
            action === "seekforward" ||
            action === "seekto"
          ) {
            navigator.mediaSession.setActionHandler(action, handleMediaSeek);
          } else {
            navigator.mediaSession.setActionHandler(action, noop);
          }
        } catch (err) {
          console.error("Failed to set media session action handler", err);
        }
      });

      updateMediaSessionRef.current();
    } catch (err) {
      console.error("mediaSession setup failed", err);
    }

    return () => {
      const actions: Array<MediaSessionAction> = [
        "play",
        "pause",
        "stop",
        "seekbackward",
        "seekforward",
        "seekto",
        "previoustrack",
        "nexttrack",
      ];

      actions.forEach((action) => {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch {
          // ignore
        }
      });
    };
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin || "";
      const isYouTube =
        origin.includes("youtube.com") ||
        origin.includes("youtube-nocookie.com");
      if (!isYouTube || typeof event.data !== "string") return;

      let data: { event?: string; info?: number; id?: string };
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.id && data.id !== PLAYER_ID) return;

      if (data.event === "onReady") {
        if (listeningRetryTimerRef.current !== null) {
          window.clearTimeout(listeningRetryTimerRef.current);
          listeningRetryTimerRef.current = null;
        }
        playerReadyRef.current = true;
        setIsPlayerReady(true);
        const currentId = videoId;
        if (!currentId) return;
        if (lastTrackLoadKeyRef.current === trackLoadKey) return;
        const beforeStart = !isStartedByServerTime();
        const startSec = beforeStart
          ? clipStartSec
          : computeServerPositionSec();
        playerStartRef.current = startSec;
        loadTrack(
          currentId,
          startSec,
          clipEndSec,
          !beforeStart,
          beforeStart ? "loadTrack-cue" : "loadTrack-autoplay",
        );
        setLoadedTrackKey(trackLoadKey);
        lastTrackLoadKeyRef.current = trackLoadKey;
        if (beforeStart) {
          schedulePlaybackStart();
        }
      }

      if (data.event === "onStateChange") {
        const state = typeof data.info === "number" ? data.info : null;
        lastPlayerStateRef.current = state;
        if (typeof state === "number") {
          debugSync("player-state-change", getPlayerDebugPayload(state));
        }

        // ── Recovery loop kick ──────────────────────────────────────────────
        // loop 在 healthy 狀態下主動停止；這裡在偵測到壞狀態時重啟它。
        // 放在所有 if(state===x) 之前，避免被後面的 early return 跳過。
        if (state === 2 || state === -1 || state === null) {
          // 暫停 / 未初始化：需要 recovery loop 做自動重播或補同步
          recoveryLoopKickRef.current?.();
        }
        if (state === 3) {
          // 緩衝中：grace 期結束後 loop 需重新確認是否已恢復
          window.setTimeout(() => {
            recoveryLoopKickRef.current?.();
          }, BUFFERING_GRACE_MS + 200);
        }

        if (state === 3) {
          const nowMs = getServerNowMs();
          lastBufferingAtMsRef.current = nowMs;
          bufferingGraceUntilMsRef.current = nowMs + BUFFERING_GRACE_MS;
          if (bufferingStartedAtRef.current === null) {
            bufferingStartedAtRef.current = nowMs;
            debugSync("buffering-start", getPlayerDebugPayload(state));
          }
        } else if (bufferingStartedAtRef.current !== null) {
          const durationMs = Math.max(0, getServerNowMs() - bufferingStartedAtRef.current);
          debugSync("buffering-end", {
            ...getPlayerDebugPayload(state ?? undefined),
            durationMs,
          });
          bufferingStartedAtRef.current = null;
        }
        if (state === 5 || state === 1) {
          handleTrackPrepared(data.info ?? state);
        }
        if (state === 1) {
          // 仍標記 track 已備好（warmup 期間也已載入 bytes，UI 可顯示封面）
          setLoadedTrackKey(trackLoadKey);
          if (prestartWarmupActiveRef.current) {
            // Prestart warmup 的 140ms playVideo 會短暫進入 state=1，之後被
            // pauseVideo 打回 state=2。此時不應把它當作真正的起播：
            //  - 不要設 hasStartedPlaybackRef（會讓 state=2 auto-resume 誤觸發）
            //  - 不要 schedulePostStartDriftChecks（基準時間是 warmup 開始而非 T0）
            //  - 不要 setIsPlayerPlaying(true)（會跟 140ms 後的 pause 閃爍）
            //  - 不要觸發 first-play-sync（還沒真正開始播放）
            debugSync("player-state-playing-warmup");
          } else {
            const shouldDoFirstPlaySync = awaitingFirstPlaySyncRef.current;
            awaitingFirstPlaySyncRef.current = false;
            setIsPlayerPlaying(true);
            hasStartedPlaybackRef.current = true;
            lastSyncMsRef.current = getServerNowMs();
            debugSync("player-state-playing");
            if (initialAudioSyncPendingRef.current) {
              scheduleInitialAudioHoldRelease(220);
            }
            // 若剛從 startPlayback 觸發的首次起播，用 first-play-sync 觸發立即對齊，
            // 處理「playVideo 下達後 player 晚了 X 秒才真正進入 state=1」的情況。
            requestPlayerTime(
              shouldDoFirstPlaySync ? "first-play-sync" : "state-playing",
            );
            schedulePostStartDriftChecks();
            startSilentAudio();
          }
        }
        if (state === 2 || state === 0) {
          setIsPlayerPlaying(false);
        }
        if (
          state === 2 &&
          hasStartedPlaybackRef.current &&
          isStartedByServerTime()
        ) {
          const now = Date.now();
          if (
            now - lastPassiveResumeRef.current >
            AUTO_RESUME_MIN_INTERVAL_MS
          ) {
            lastPassiveResumeRef.current = now;
            postCommand("playVideo");
            postCommand("unMute");
            applyVolume(gameVolume);
          }
        }
        if (state === 0) {
          const serverNow = getServerNowMs();
          const guessEndsAt = startedAt + effectiveGuessDurationMs;
          if (
            phase === "guess" &&
            shouldLoopRoomSettingsClip &&
            !isEnded &&
            isStartedByServerTime() &&
            serverNow < guessEndsAt
          ) {
            const latestPlayerTime = lastPlayerTimeSecRef.current;
            if (
              typeof latestPlayerTime === "number" &&
              latestPlayerTime > clipStartSec + 0.05
            ) {
              guessLoopSpanRef.current = Math.max(
                0.25,
                latestPlayerTime - clipStartSec,
              );
            } else if (!guessLoopSpanRef.current) {
              guessLoopSpanRef.current = Math.max(
                0.5,
                Math.min(5, fallbackDurationSec),
              );
            }
            startPlayback(computeServerPositionSec(), true, {
              reason: "guess-loop",
            });
            return;
          }
          if (isReveal) {
            revealReplayRef.current = true;
            startPlayback(computeRevealPositionSec(), true, {
              reason: "reveal-replay",
            });
          }
        }
      }

      if (data.event === "infoDelivery") {
        const info = (data as { info?: { currentTime?: number } }).info;
        if (typeof info?.currentTime === "number") {
          lastPlayerTimeSecRef.current = info.currentTime;
          lastPlayerTimeAtMsRef.current = getServerNowMs();
          // First-play sync：player 剛進入 state=1（真正開始播放）時立即對齊。
          // 覆蓋「playVideo 下達後慢網延遲數秒才真正開始」的情境。bypass
          // buffering grace，因為 state=1 本身就代表 buffer 已完成，這是最佳
          // seek 時機而非 stall 中段。
          if (lastTimeRequestReasonRef.current === "first-play-sync") {
            const expected = getDesiredPositionSec();
            const drift = Math.abs(info.currentTime - expected);
            const didSeek = syncToServerPosition(
              "first-play-sync",
              false,
              POST_START_DRIFT_TOLERANCE_SEC,
              true,
              true, // bypassBufferingGrace
            );
            debugSync("first-play-sync", {
              playerTime: info.currentTime,
              expected,
              drift,
              toleranceSec: POST_START_DRIFT_TOLERANCE_SEC,
              didSeek,
            });
          }
          if (
            lastTimeRequestReasonRef.current.startsWith("post-start-drift-")
          ) {
            const expected = getDesiredPositionSec();
            const drift = Math.abs(info.currentTime - expected);
            const didSeek = syncToServerPosition(
              lastTimeRequestReasonRef.current,
              false,
              POST_START_DRIFT_TOLERANCE_SEC,
              true,
            );
            debugSync("post-start-drift", {
              checkpoint: lastTimeRequestReasonRef.current,
              playerTime: info.currentTime,
              expected,
              drift,
              toleranceSec: POST_START_DRIFT_TOLERANCE_SEC,
              didSeek,
            });
            // 保險：若這次被 buffering grace 擋下（didSeek=false）但偏差仍超過
            // 容忍值，重排一次檢查。避免「drift check 恰好落在 grace 窗口內」
            // 的邊界情境造成永久失準。每個 track session 只重試一次。
            if (
              !didSeek &&
              drift > POST_START_DRIFT_TOLERANCE_SEC &&
              !postStartDriftRetriedRef.current
            ) {
              postStartDriftRetriedRef.current = true;
              schedulePostStartDriftChecks();
            }
          }
          if (resumeNeedsSyncRef.current) {
            resumeNeedsSyncRef.current = false;
            if (document.visibilityState !== "visible") {
              return;
            }
            const resumeReason = pendingResumeSyncReasonRef.current;
            const didSeek = syncToServerPosition(
              resumeReason,
              false,
              DRIFT_TOLERANCE_SEC,
              true,
            );
            if (didSeek || resumeReason.startsWith("visibility")) {
              scheduleResumeResync();
            }
          }
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [
    armInitialAudioSync,
    applyVolume,
    clipEndSec,
    clipStartSec,
    computeRevealPositionSec,
    computeServerPositionSec,
    debugSync,
    effectiveGuessDurationMs,
    fallbackDurationSec,
    gameVolume,
    getServerNowMs,
    getDesiredPositionSec,
    getPlayerDebugPayload,
    handleTrackPrepared,
    isEnded,
    isReveal,
    isStartedByServerTime,
    loadTrack,
    phase,
    postCommand,
    requestPlayerTime,
    scheduleInitialAudioHoldRelease,
    schedulePlaybackStart,
    schedulePostStartDriftChecks,
    scheduleResumeResync,
    shouldLoopRoomSettingsClip,
    startPlayback,
    startSilentAudio,
    startedAt,
    syncToServerPosition,
    trackLoadKey,
    videoId,
  ]);

  useEffect(() => {
    if (!videoId) return;
    if (!playerReadyRef.current) return;
    if (lastTrackLoadKeyRef.current === trackLoadKey) return;

    if (lastTrackSessionRef.current !== trackSessionKey) {
      lastTrackSessionRef.current = trackSessionKey;
      hasStartedPlaybackRef.current = false;
      playerStartRef.current = computeServerPositionSec();
    }

    revealReplayRef.current = false;
    const autoplay = isStartedByServerTime();
    const startSec = autoplay ? computeServerPositionSec() : clipStartSec;
    playerStartRef.current = startSec;
    loadTrack(
      videoId,
      startSec,
      clipEndSec,
      autoplay,
      autoplay ? "loadTrack-autoplay" : "loadTrack-cue",
    );
    hasStartedPlaybackRef.current = false;
    lastTrackLoadKeyRef.current = trackLoadKey;
    if (!autoplay) {
      schedulePlaybackStart();
    }
  }, [
    clipEndSec,
    clipStartSec,
    computeServerPositionSec,
    loadTrack,
    schedulePlaybackStart,
    startPlayback,
    trackLoadKey,
    trackSessionKey,
    videoId,
    isStartedByServerTime,
  ]);

  useEffect(() => {
    if (!isReveal) {
      revealReplayRef.current = false;
      lastRevealStartKeyRef.current = null;
      return;
    }
    const revealKey = `${trackSessionKey}:${revealEndsAt}:reveal`;
    if (lastRevealStartKeyRef.current === revealKey) return;
    lastRevealStartKeyRef.current = revealKey;
    const playerEnded = lastPlayerStateRef.current === 0;

    if (playerEnded) {
      if (hasRecentBuffering()) {
        const timerId = window.setTimeout(() => {
          revealReplayRef.current = true;
          startPlayback(computeRevealPositionSec(), false, {
            reason: "reveal-replay",
          });
        }, 260);
        return () => window.clearTimeout(timerId);
      }
      revealReplayRef.current = true;
      startPlayback(computeRevealPositionSec(), true, {
        reason: "reveal-replay",
      });
      return;
    }

    revealReplayRef.current = false;
    const state = lastPlayerStateRef.current;
    const recentBuffering = hasRecentBuffering();
    startSilentAudio();
    if (!recentBuffering) {
      postCommand("playVideo");
      postCommand("unMute");
      applyVolume(gameVolume);
    }
    if (state === 1 || (state === 3 && recentBuffering)) {
      return;
    }
    const fallbackTimer = window.setTimeout(() => {
      if (lastPlayerStateRef.current !== 1 && !hasRecentBuffering()) {
        postCommand("playVideo");
        postCommand("unMute");
        applyVolume(gameVolume);
        startSilentAudio();
      }
    }, recentBuffering ? 780 : 420);
    return () => window.clearTimeout(fallbackTimer);
  }, [
    applyVolume,
    clipEndSec,
    computeRevealPositionSec,
    gameVolume,
    hasRecentBuffering,
    getFreshPlayerTimeSec,
    isReveal,
    postCommand,
    revealEndsAt,
    startSilentAudio,
    startPlayback,
    trackSessionKey,
  ]);

  useEffect(() => {
    if (waitingToStart) {
      hasStartedPlaybackRef.current = false;
      clearPlaybackWarmupTimers();
      initialAudioSyncPendingRef.current = false;
      clearInitialAudioHoldReleaseTimer();
      if (!trackPreparedRef.current) {
        return;
      }
      postCommand("pauseVideo");
      debugSync("seekTo", {
        reason: "prestart-warmup",
        startPos: clipStartSec,
      });
      postCommand("seekTo", [clipStartSec, true]);
    }
  }, [
    clearInitialAudioHoldReleaseTimer,
    clearPlaybackWarmupTimers,
    clipStartSec,
    debugSync,
    postCommand,
    waitingToStart,
  ]);

  useEffect(() => {
    const handleVisibility = (event?: Event) => {
      if (document.visibilityState !== "visible") {
        resumeNeedsSyncRef.current = true;
        resyncTimersRef.current.forEach((timerId) =>
          window.clearTimeout(timerId),
        );
        resyncTimersRef.current = [];
        return;
      }
      const serverNow = getServerNowMs();
      if (!playerReadyRef.current) return;
      if (startedAt > serverNow) {
        resumeNeedsSyncRef.current = true;
        return;
      }
      startSilentAudio();
      resumeNeedsSyncRef.current = true;
      // loop 若已停在 healthy state，回前景後需重啟以處理補同步
      recoveryLoopKickRef.current?.();
      pendingResumeSyncReasonRef.current =
        event?.type === "focus" ? "visibility-focus" : "visibility";
      const requested = requestPlayerTime("visibility");
      if (!requested && getFreshPlayerTimeSec() !== null) {
        resumeNeedsSyncRef.current = false;
        const didSeek = syncToServerPosition(
          pendingResumeSyncReasonRef.current,
          false,
          DRIFT_TOLERANCE_SEC,
          true,
        );
        if (didSeek) {
          scheduleResumeResync();
          return;
        }
        if (initialAudioSyncPendingRef.current) {
          scheduleInitialAudioHoldRelease(180);
        } else {
          postCommand("playVideo");
          postCommand("unMute");
          applyVolume(gameVolume);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
    };
  }, [
    applyVolume,
    gameVolume,
    getServerNowMs,
    getFreshPlayerTimeSec,
    postCommand,
    requestPlayerTime,
    scheduleInitialAudioHoldRelease,
    scheduleResumeResync,
    startSilentAudio,
    startedAt,
    syncToServerPosition,
  ]);

  const handlePlaybackIframeLoad = useCallback(() => {
    playerReadyRef.current = false;
    trackPreparedRef.current = false;
    lastTrackLoadKeyRef.current = null;
    lastLoadedVideoIdRef.current = null;
    clearPlaybackStartTimer();
    clearPlaybackWarmupTimers();
    clearPostStartDriftTimers();
    if (videoId) {
      setPlayerVideoId(videoId);
    }
    let attempts = 0;
    const bindPlayerEvents = () => {
      postPlayerMessage(
        { event: "listening", id: PLAYER_ID },
        "player event binding",
      );
    };
    const retryBind = () => {
      if (playerReadyRef.current) {
        listeningRetryTimerRef.current = null;
        return;
      }
      if (attempts >= 10) {
        listeningRetryTimerRef.current = null;
        return;
      }
      attempts += 1;
      bindPlayerEvents();
      listeningRetryTimerRef.current = window.setTimeout(retryBind, 350);
    };
    if (listeningRetryTimerRef.current !== null) {
      window.clearTimeout(listeningRetryTimerRef.current);
      listeningRetryTimerRef.current = null;
    }
    bindPlayerEvents();
    listeningRetryTimerRef.current = window.setTimeout(retryBind, 220);
    applyVolume(gameVolume);
  }, [
    applyVolume,
    clearPlaybackStartTimer,
    clearPlaybackWarmupTimers,
    clearPostStartDriftTimers,
    gameVolume,
    postPlayerMessage,
    videoId,
  ]);

  return {
    audioUnlocked,
    isPlayerReady,
    isPlayerPlaying,
    loadedTrackKey,
    playerVideoId,
    iframeRef,
    silentAudioRef,
    handleGestureOverlayTrigger,
    handlePlaybackIframeLoad,
  };
};

export default useGameRoomPlayerSync;

