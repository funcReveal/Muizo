import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  EDIT_AUTOPLAY_STORAGE_KEY,
  EDIT_LOOP_STORAGE_KEY,
  EDIT_MUTE_STORAGE_KEY,
  EDIT_VOLUME_STORAGE_KEY,
  LEGACY_VOLUME_STORAGE_KEY,
} from "../utils/editConstants";

type YTPlayer = YT.Player;
type YTPlayerEvent = YT.PlayerEvent;
type YTPlayerStateEvent = YT.OnStateChangeEvent;

type UseCollectionEditPlayerArgs = {
  selectedVideoId: string | null;
  selectedItemLocalId: string | null;
  selectedItemStartSec: number;
  itemsLoading: boolean;
  collectionsLoading: boolean;
  startSec: number;
  effectiveEnd: number;
  onDurationResolved: (durationSec: number, targetId?: string | null) => void;
};

export function useCollectionEditPlayer({
  selectedVideoId,
  selectedItemLocalId,
  selectedItemStartSec,
  itemsLoading,
  collectionsLoading,
  startSec,
  effectiveEnd,
  onDurationResolved,
}: UseCollectionEditPlayerArgs) {
  const [playerViewportElement, setPlayerViewportElement] =
    useState<HTMLDivElement | null>(null);
  const [playerMountVersion, setPlayerMountVersion] = useState(0);
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const playerMountElementRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const currentVideoItemIdRef = useRef<string | null>(null);
  const selectedVideoIdRef = useRef<string | null>(selectedVideoId);
  const playRequestedRef = useRef(false);
  const shouldSeekToStartRef = useRef(false);
  const selectedStartRef = useRef(0);
  const clipStartRef = useRef(startSec);
  const pendingAutoStartRef = useRef<number | null>(null);
  const pendingPreviewStartRef = useRef<number | null>(null);
  const autoPlaySeekedRef = useRef(false);
  const playbackStartAppliedRef = useRef(false);
  const progressRafRef = useRef<number | null>(null);

  const [playerReadyState, setPlayerReadyState] = useState(false);
  const [readyVideoId, setReadyVideoId] = useState<string | null>(null);
  const [isPlayingState, setIsPlayingState] = useState(false);
  const isPlayingRef = useRef<boolean>(false);

  const [volume, setVolume] = useState(() => {
    if (typeof window === "undefined") return 50;
    const stored =
      window.localStorage.getItem(EDIT_VOLUME_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_VOLUME_STORAGE_KEY);
    const parsed = stored ? Number(stored) : NaN;
    if (!Number.isFinite(parsed)) return 50;
    return Math.min(100, Math.max(0, parsed));
  });

  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(EDIT_MUTE_STORAGE_KEY) === "1";
  });

  const volumeRef = useRef<number>(volume);
  const isMutedRef = useRef<boolean>(isMuted);
  const lastVolumeRef = useRef<number>(volume);
  const lastAppliedPlayerVolumeRef = useRef<number | null>(null);
  const lastAppliedPlayerMutedRef = useRef<boolean | null>(null);

  const [autoPlayOnSwitch, setAutoPlayOnSwitch] = useState(() => {
    if (typeof window === "undefined") return false;
    const saved = window.localStorage.getItem(EDIT_AUTOPLAY_STORAGE_KEY);
    if (saved === "1") return true;
    if (saved === "0") return false;
    return false;
  });

  const [loopEnabled, setLoopEnabled] = useState(() => {
    if (typeof window === "undefined") return true;
    const saved = window.localStorage.getItem(EDIT_LOOP_STORAGE_KEY);
    if (saved === "1") return true;
    if (saved === "0") return false;
    return true;
  });

  const autoPlayRef = useRef(false);
  const [ytReady, setYtReady] = useState(() => {
    if (typeof window === "undefined") return false;
    return Boolean(window.YT?.Player);
  });
  const [currentTimeSec, setCurrentTimeSec] = useState(0);

  useEffect(() => {
    selectedVideoIdRef.current = selectedVideoId;
  }, [selectedVideoId]);

  const ensurePlayerHost = useCallback(() => {
    if (playerShellRef.current || typeof document === "undefined") {
      return;
    }
    const shell = document.createElement("div");
    const mount = document.createElement("div");
    shell.dataset.muizoYoutubePlayerHost = "true";
    shell.style.width = "100%";
    shell.style.height = "100%";
    shell.style.overflow = "hidden";
    shell.style.background = "#0f172a";
    mount.style.width = "100%";
    mount.style.height = "100%";
    shell.appendChild(mount);

    playerShellRef.current = shell;
    playerMountElementRef.current = mount;
    setPlayerMountVersion((version) => version + 1);
  }, []);

  const playerContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node) {
        ensurePlayerHost();
      }
      setPlayerViewportElement(node);
    },
    [ensurePlayerHost],
  );

  useEffect(() => {
    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
      playerShellRef.current = null;
      playerMountElementRef.current = null;
      document
        .querySelectorAll("[data-muizo-youtube-player-host='true']")
        .forEach((node) => node.remove());
    };
  }, []);

  useLayoutEffect(() => {
    const shell = playerShellRef.current;
    if (!shell || !playerViewportElement || !selectedVideoId) return;
    playerViewportElement.replaceChildren(shell);
  }, [playerViewportElement, selectedVideoId]);

  useEffect(() => {
    autoPlayRef.current = autoPlayOnSwitch;
  }, [autoPlayOnSwitch]);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    isPlayingRef.current = isPlayingState;
  }, [isPlayingState]);

  useEffect(() => {
    clipStartRef.current = startSec;
  }, [startSec]);

  const resolvePlaybackStartSec = useCallback((explicitStart?: number) => {
    if (typeof explicitStart === "number" && Number.isFinite(explicitStart)) {
      return explicitStart;
    }

    const pendingStart = pendingAutoStartRef.current;
    if (pendingStart !== null && Number.isFinite(pendingStart)) {
      pendingAutoStartRef.current = null;
      return pendingStart;
    }

    if (shouldSeekToStartRef.current) {
      shouldSeekToStartRef.current = false;
      return selectedStartRef.current;
    }

    return clipStartRef.current;
  }, []);

  const playFromConfiguredStart = useCallback(
    (player: YTPlayer, explicitStart?: number) => {
      const nextStart = resolvePlaybackStartSec(explicitStart);
      selectedStartRef.current = nextStart;
      setCurrentTimeSec(nextStart);
      playbackStartAppliedRef.current = false;

      if (selectedVideoId) {
        player.loadVideoById?.({
          videoId: selectedVideoId,
          startSeconds: Math.floor(nextStart),
        });
      } else {
        player.seekTo?.(nextStart, true);
        player.playVideo?.();
      }

      return nextStart;
    },
    [resolvePlaybackStartSec, selectedVideoId],
  );

  useEffect(() => {
    if (!selectedItemLocalId) {
      currentVideoItemIdRef.current = null;
      return;
    }

    const pendingPreviewStart = pendingPreviewStartRef.current;
    const nextStart =
      pendingPreviewStart !== null && Number.isFinite(pendingPreviewStart)
        ? pendingPreviewStart
        : selectedItemStartSec;

    currentVideoItemIdRef.current = selectedItemLocalId;
    selectedStartRef.current = nextStart;
    pendingAutoStartRef.current = nextStart;
    if (pendingPreviewStart !== null) {
      playRequestedRef.current = true;
      pendingPreviewStartRef.current = null;
    }
    shouldSeekToStartRef.current = true;
    autoPlaySeekedRef.current = false;
    playbackStartAppliedRef.current = false;
  }, [selectedItemLocalId, selectedItemStartSec]);

  useEffect(() => {
    if (ytReady) {
      return;
    }

    let mounted = true;
    const callback = () => {
      if (!mounted) return;
      setYtReady(true);
    };
    const prev = window.onYouTubeIframeAPIReady;

    const existing = document.querySelector(
      "script[data-yt-iframe-api]",
    ) as HTMLScriptElement | null;

    if (existing) {
      window.onYouTubeIframeAPIReady = callback;
      return () => {
        mounted = false;
        if (window.onYouTubeIframeAPIReady === callback) {
          window.onYouTubeIframeAPIReady = prev;
        }
      };
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    tag.async = true;
    tag.dataset.ytIframeApi = "true";
    window.onYouTubeIframeAPIReady = callback;
    document.body.appendChild(tag);

    return () => {
      mounted = false;
      if (window.onYouTubeIframeAPIReady === callback) {
        window.onYouTubeIframeAPIReady = prev;
      }
    };
  }, [ytReady]);

  useEffect(() => {
    if (!ytReady || itemsLoading || collectionsLoading) return;
    const playerMountElement = playerMountElementRef.current;

    if (!selectedVideoId || !playerMountElement) {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
      return;
    }

    playRequestedRef.current = playRequestedRef.current || autoPlayRef.current;

    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    const yt = window.YT;
    if (!yt?.Player) return;

    let active = true;
    const mount = document.createElement("div");
    mount.style.width = "100%";
    mount.style.height = "100%";
    playerMountElement.replaceChildren(mount);

    const player = new yt.Player(mount, {
      videoId: selectedVideoId,
      playerVars: {
        autoplay: 0,
        controls: 1,
        rel: 0,
        playsinline: 1,
        start: Math.floor(selectedStartRef.current),
      },
      events: {
        onReady: (event: YTPlayerEvent) => {
          if (!active) return;
          setPlayerReadyState(true);
          setReadyVideoId(selectedVideoId);
          setCurrentTimeSec(selectedStartRef.current);
          event.target.setVolume?.(isMutedRef.current ? 0 : volumeRef.current);

          const initialStart = Math.floor(selectedStartRef.current);
          if (autoPlayRef.current || playRequestedRef.current) {
            playRequestedRef.current = true;
            event.target.loadVideoById?.({
              videoId: selectedVideoId,
              startSeconds: initialStart,
            });

            const pendingStart = pendingAutoStartRef.current;
            if (pendingStart !== null && Number.isFinite(pendingStart)) {
              window.setTimeout(() => {
                event.target.seekTo?.(pendingStart, true);
              }, 0);
              pendingAutoStartRef.current = null;
            }
          } else {
            playRequestedRef.current = false;
            event.target.cueVideoById?.({
              videoId: selectedVideoId,
              startSeconds: initialStart,
            });
            event.target.pauseVideo?.();
          }

          const boundItemId = currentVideoItemIdRef.current;
          let attempts = 0;
          const trySync = () => {
            if (!active) return;
            const duration = event.target.getDuration?.();
            if (duration && duration > 0) {
              onDurationResolved(duration, boundItemId);
              return;
            }
            attempts += 1;
            if (attempts < 5) {
              window.setTimeout(trySync, 300);
            }
          };
          trySync();
        },

        onStateChange: (event: YTPlayerStateEvent) => {
          if (!active) return;
          const state = window.YT?.PlayerState;
          if (!state) return;

          if (event.data === state.PLAYING) {
            playRequestedRef.current = true;

            if (!playbackStartAppliedRef.current) {
              const targetStart = selectedStartRef.current;
              const current = event.target.getCurrentTime?.();

              if (
                typeof current === "number" &&
                Math.abs(current - targetStart) > 0.3
              ) {
                event.target.seekTo?.(targetStart, true);
              }
              setCurrentTimeSec(targetStart);
              playbackStartAppliedRef.current = true;
              autoPlaySeekedRef.current = true;
            } else if (autoPlayRef.current && !autoPlaySeekedRef.current) {
              autoPlaySeekedRef.current = true;
            }

            setIsPlayingState(true);
          } else if (
            event.data === state.PAUSED ||
            event.data === state.ENDED
          ) {
            playRequestedRef.current = false;
            playbackStartAppliedRef.current = false;
            setIsPlayingState(false);
          }
        },
      },
    });

    playerRef.current = player;

    return () => {
      active = false;
      player.destroy();
      if (playerRef.current === player) {
        playerRef.current = null;
      }
      setPlayerReadyState(false);
      setReadyVideoId(null);
      setIsPlayingState(false);
    };
  }, [
    collectionsLoading,
    itemsLoading,
    onDurationResolved,
    playerMountVersion,
    selectedVideoId,
    ytReady,
  ]);

  const isPlayerReady =
    Boolean(selectedVideoId) &&
    readyVideoId === selectedVideoId &&
    playerReadyState;
  const isPlaying = isPlayerReady && isPlayingState;
  const resolvedCurrentTimeSec = selectedVideoId ? currentTimeSec : 0;

  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;
    if (autoPlayRef.current) return;

    playerRef.current.seekTo?.(startSec, true);
  }, [isPlayerReady, selectedVideoId, startSec]);

  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;

    const player = playerRef.current;

    if (lastAppliedPlayerMutedRef.current !== isMuted) {
      if (isMuted) {
        player.mute?.();
      } else {
        player.unMute?.();
      }
      lastAppliedPlayerMutedRef.current = isMuted;
    }

    if (!isMuted && lastAppliedPlayerVolumeRef.current !== volume) {
      player.setVolume?.(volume);
      lastAppliedPlayerVolumeRef.current = volume;
    }
  }, [isMuted, isPlayerReady, volume]);

  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;

    const syncPlayerVolumeState = () => {
      const player = playerRef.current;
      if (!player) return;

      const nextMuted = player.isMuted?.() ?? false;
      const rawVolume = player.getVolume?.();
      const nextVolume = Number.isFinite(rawVolume)
        ? Math.min(100, Math.max(0, Math.round(rawVolume)))
        : null;

      if (typeof nextVolume === "number" && nextVolume !== volumeRef.current) {
        volumeRef.current = nextVolume;
        lastAppliedPlayerVolumeRef.current = nextVolume;
        setVolume(nextVolume);

        if (nextVolume > 0) {
          lastVolumeRef.current = nextVolume;
        }

        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            EDIT_VOLUME_STORAGE_KEY,
            String(nextVolume),
          );
        }
      }

      if (nextMuted !== isMutedRef.current) {
        isMutedRef.current = nextMuted;
        lastAppliedPlayerMutedRef.current = nextMuted;
        setIsMuted(nextMuted);

        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            EDIT_MUTE_STORAGE_KEY,
            nextMuted ? "1" : "0",
          );
        }
      }
    };

    syncPlayerVolumeState();
    const intervalId = window.setInterval(syncPlayerVolumeState, 250);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isPlayerReady, selectedVideoId]);

  useEffect(() => {
    if (!autoPlayRef.current) return;
    if (!isPlayerReady || !playerRef.current) return;
    if (!selectedItemLocalId) return;

    playRequestedRef.current = true;

    if (!isPlayingRef.current) {
      playFromConfiguredStart(playerRef.current);
    }
  }, [isPlayerReady, playFromConfiguredStart, selectedItemLocalId]);

  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;
    if (!isPlaying) return;

    let mounted = true;
    let lastEmitTs = 0;

    const tick = (ts: number) => {
      if (!mounted) return;

      const player = playerRef.current;
      if (player && typeof player.getCurrentTime === "function") {
        const current = player.getCurrentTime();

        if (ts - lastEmitTs >= 66) {
          lastEmitTs = ts;
          setCurrentTimeSec(current);
        }

        if (isPlaying && current >= effectiveEnd - 0.2) {
          if (loopEnabled) {
            player.seekTo?.(startSec, true);
            if (isPlaying) {
              player.playVideo?.();
            } else {
              player.pauseVideo?.();
            }
          } else {
            player.seekTo?.(effectiveEnd, true);
            player.pauseVideo?.();
          }
        }
      }

      progressRafRef.current = window.requestAnimationFrame(tick);
    };

    progressRafRef.current = window.requestAnimationFrame(tick);

    return () => {
      mounted = false;
      if (progressRafRef.current) {
        window.cancelAnimationFrame(progressRafRef.current);
        progressRafRef.current = null;
      }
    };
  }, [effectiveEnd, isPlayerReady, isPlaying, loopEnabled, startSec]);

  const queuePreviewFromStart = useCallback((sec: number) => {
    selectedStartRef.current = sec;
    pendingAutoStartRef.current = sec;
    pendingPreviewStartRef.current = sec;
    playRequestedRef.current = true;
    setCurrentTimeSec(sec);
  }, []);

  const preparePlaybackStart = useCallback((sec: number) => {
    selectedStartRef.current = sec;
    pendingAutoStartRef.current = sec;
    pendingPreviewStartRef.current = null;
    shouldSeekToStartRef.current = true;
    playRequestedRef.current = false;
    playbackStartAppliedRef.current = false;
    setCurrentTimeSec(sec);
  }, []);

  const previewFromStart = useCallback(
    (sec: number) => {
      selectedStartRef.current = sec;
      pendingAutoStartRef.current = sec;
      pendingPreviewStartRef.current = sec;
      playRequestedRef.current = true;
      setCurrentTimeSec(sec);

      if (!playerRef.current || !isPlayerReady) return;

      pendingPreviewStartRef.current = null;
      shouldSeekToStartRef.current = false;
      playFromConfiguredStart(playerRef.current, sec);
    },
    [isPlayerReady, playFromConfiguredStart],
  );

  const previewBeforeEnd = useCallback(
    (rangeStartSec: number, rangeEndSec: number) => {
      const previewStart = Math.max(rangeStartSec, rangeEndSec - 3);
      setCurrentTimeSec(previewStart);

      if (!playerRef.current || !isPlayerReady) return;

      playRequestedRef.current = true;
      shouldSeekToStartRef.current = false;
      playFromConfiguredStart(playerRef.current, previewStart);
    },
    [isPlayerReady, playFromConfiguredStart],
  );

  const togglePlayback = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    const state = player.getPlayerState?.();
    const playingState = window.YT?.PlayerState?.PLAYING;

    if (playingState !== undefined && state === playingState) {
      player.pauseVideo?.();
      playRequestedRef.current = false;
      playbackStartAppliedRef.current = false;
    } else {
      playRequestedRef.current = true;
      playFromConfiguredStart(player);
    }
  }, [playFromConfiguredStart]);

  useEffect(() => {
    const handleSpaceToggle = (event: KeyboardEvent) => {
      if (event.code !== "Space" && event.key !== " ") return;
      if (event.defaultPrevented || event.repeat) return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (!selectedVideoIdRef.current) return;
      event.preventDefault();
      togglePlayback();
    };

    window.addEventListener("keydown", handleSpaceToggle);
    return () => window.removeEventListener("keydown", handleSpaceToggle);
  }, [togglePlayback]);

  const pausePlayback = useCallback(() => {
    const player = playerRef.current;
    playRequestedRef.current = false;
    playbackStartAppliedRef.current = false;
    if (!player) return;
    player.pauseVideo?.();
    setIsPlayingState(false);
  }, []);

  const handleVolumeChange = useCallback((value: number) => {
    const clamped = Math.min(100, Math.max(0, value));
    volumeRef.current = clamped;

    const player = playerRef.current;
    if (player) {
      if (clamped > 0 && isMutedRef.current) {
        player.unMute?.();
        isMutedRef.current = false;
        setIsMuted(false);
      }
      player.setVolume?.(clamped);
    }

    if (clamped > 0) {
      lastVolumeRef.current = clamped;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(EDIT_VOLUME_STORAGE_KEY, String(clamped));
    }
  }, []);

  const handleVolumeCommit = useCallback(
    (value: number) => {
      const clamped = Math.min(100, Math.max(0, value));
      volumeRef.current = clamped;
      setVolume(clamped);

      if (clamped > 0) {
        lastVolumeRef.current = clamped;
        if (isMuted) {
          isMutedRef.current = false;
          setIsMuted(false);
        }
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(EDIT_VOLUME_STORAGE_KEY, String(clamped));
      }
    },
    [isMuted],
  );

  const handleToggleMute = useCallback(() => {
    const player = playerRef.current;
    const nextMuted = !isMutedRef.current;

    if (nextMuted) {
      const currentAudibleVolume = Math.max(0, volumeRef.current || volume);
      if (currentAudibleVolume > 0) {
        lastVolumeRef.current = currentAudibleVolume;
      }

      player?.mute?.();
      lastAppliedPlayerMutedRef.current = true;
      isMutedRef.current = true;
      setIsMuted(true);
    } else {
      const restored = Math.max(
        10,
        lastVolumeRef.current || volumeRef.current || volume || 10,
      );

      player?.unMute?.();
      player?.setVolume?.(restored);

      lastAppliedPlayerMutedRef.current = false;
      lastAppliedPlayerVolumeRef.current = restored;
      volumeRef.current = restored;
      isMutedRef.current = false;
      setVolume(restored);
      setIsMuted(false);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(EDIT_VOLUME_STORAGE_KEY, String(restored));
      }
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(EDIT_MUTE_STORAGE_KEY, nextMuted ? "1" : "0");
    }
  }, [volume]);

  const handleAutoPlayToggle = useCallback((value: boolean) => {
    setAutoPlayOnSwitch(value);
    autoPlayRef.current = value;

    if (typeof window !== "undefined") {
      window.localStorage.setItem(EDIT_AUTOPLAY_STORAGE_KEY, value ? "1" : "0");
    }
  }, []);

  const handleLoopToggle = useCallback((value: boolean) => {
    setLoopEnabled(value);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(EDIT_LOOP_STORAGE_KEY, value ? "1" : "0");
    }
  }, []);

  const handleProgressChange = useCallback(
    (value: number) => {
      const clamped = Math.min(effectiveEnd, Math.max(startSec, value));
      setCurrentTimeSec(clamped);

      if (playerRef.current) {
        shouldSeekToStartRef.current = false;
        playerRef.current.seekTo?.(clamped, true);
        if (!isPlaying) {
          playerRef.current.pauseVideo?.();
        }
      }
    },
    [effectiveEnd, isPlaying, startSec],
  );

  const getPlayerCurrentTimeSec = useCallback((): number | null => {
    const player = playerRef.current;
    if (!player) return null;

    const t = player.getCurrentTime?.();
    return typeof t === "number" && Number.isFinite(t) ? t : null;
  }, []);

  return {
    playerContainerRef,
    isPlayerReady,
    isPlaying,
    volume,
    isMuted,
    autoPlayOnSwitch,
    loopEnabled,
    currentTimeSec: resolvedCurrentTimeSec,
    setCurrentTimeSec,
    pausePlayback,
    togglePlayback,
    handleVolumeChange,
    handleVolumeCommit,
    handleToggleMute,
    handleAutoPlayToggle,
    handleLoopToggle,
    handleProgressChange,
    getPlayerCurrentTimeSec,
    preparePlaybackStart,
    queuePreviewFromStart,
    previewFromStart,
    previewBeforeEnd,
  };
}
