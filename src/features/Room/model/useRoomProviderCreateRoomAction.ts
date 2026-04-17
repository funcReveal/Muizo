import {
  useCallback,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";

import { trackEvent } from "../../../shared/analytics/track";
import { ensureFreshAuthToken } from "../../../shared/auth/token";
import { apiFetchRooms } from "./roomApi";
import type { RoomCreateSourceMode } from "./RoomContext";
import {
  CHUNK_SIZE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PLAYBACK_EXTENSION_MODE,
  DEFAULT_ROOM_MAX_PLAYERS,
  PLAYER_MAX,
  PLAYER_MIN,
  QUESTION_MIN,
} from "./roomConstants";
import {
  applyGameSettingsPatch,
  buildUploadPlaylistItems,
  formatAckError,
} from "./roomProviderUtils";
import {
  clampPlayDurationSec,
  clampQuestionCount,
  clampRevealDurationSec,
  clampStartOffsetSec,
  getQuestionMax,
} from "./roomUtils";
import type {
  Ack,
  ClientSocket,
  GameState,
  PlaylistItem,
  PlaylistSourceType,
  RoomParticipant,
  RoomState,
  RoomSummary,
} from "./types";

type PlaylistProgressState = {
  received: number;
  total: number;
  ready: boolean;
};

interface UseRoomProviderCreateRoomActionParams {
  apiUrl: string;
  getSocket: () => ClientSocket | null;
  username: string | null;
  authToken: string | null;
  refreshAuthToken: () => Promise<string | null>;
  setStatusText: (value: string | null) => void;
  createRoomInFlightRef: RefObject<boolean>;
  releaseCreateRoomLockRef: RefObject<(() => void) | null>;
  setIsCreatingRoom: Dispatch<SetStateAction<boolean>>;
  roomNameInput: string;
  roomVisibilityInput: "public" | "private";
  roomCreateSourceMode: RoomCreateSourceMode;
  roomPasswordInput: string;
  roomMaxPlayersInput: string;
  questionCount: number;
  playDurationSec: number;
  revealDurationSec: number;
  startOffsetSec: number;
  allowCollectionClipTiming: boolean;
  playlistItems: PlaylistItem[];
  lastFetchedPlaylistId: string | null;
  lastFetchedPlaylistTitle: string | null;
  clientId: string;
  fetchPlaylistPage: (
    roomId: string,
    page: number,
    pageSize?: number,
    opts?: { reset?: boolean },
  ) => void;
  lockSessionClientId: (nextClientId: string) => void;
  persistRoomId: (id: string | null) => void;
  persistRoomSessionToken: (token: string | null) => void;
  seedPresenceParticipants: (
    roomId: string | null | undefined,
    nextParticipants: RoomParticipant[],
  ) => void;
  mergeCachedParticipantPing: (
    nextParticipants: RoomParticipant[],
    previousParticipants: RoomParticipant[],
  ) => RoomParticipant[];
  syncServerOffset: (serverNow: number) => void;
  saveRoomPassword: (roomId: string, password: string | null) => void;
  currentRoomIdRef: RefObject<string | null>;
  setCurrentRoom: Dispatch<SetStateAction<RoomState["room"] | null>>;
  setParticipants: Dispatch<SetStateAction<RoomParticipant[]>>;
  setMessages: Dispatch<SetStateAction<RoomState["messages"]>>;
  setSettlementHistory: Dispatch<
    SetStateAction<RoomState["settlementHistory"]>
  >;
  setPlaylistProgress: Dispatch<SetStateAction<PlaylistProgressState>>;
  setGameState: Dispatch<SetStateAction<GameState | null>>;
  setIsGameView: Dispatch<SetStateAction<boolean>>;
  setGamePlaylist: Dispatch<SetStateAction<PlaylistItem[]>>;
  setRooms: Dispatch<SetStateAction<RoomSummary[]>>;
  setHostRoomPassword: Dispatch<SetStateAction<string | null>>;
  setRoomNameInput: Dispatch<SetStateAction<string>>;
  setRoomMaxPlayersInput: Dispatch<SetStateAction<string>>;
}

export const useRoomProviderCreateRoomAction = ({
  apiUrl,
  getSocket,
  username,
  authToken,
  refreshAuthToken,
  setStatusText,
  createRoomInFlightRef,
  releaseCreateRoomLockRef,
  setIsCreatingRoom,
  roomNameInput,
  roomVisibilityInput,
  roomCreateSourceMode,
  roomPasswordInput,
  roomMaxPlayersInput,
  questionCount,
  playDurationSec,
  revealDurationSec,
  startOffsetSec,
  allowCollectionClipTiming,
  playlistItems,
  lastFetchedPlaylistId,
  lastFetchedPlaylistTitle,
  fetchPlaylistPage,
  lockSessionClientId,
  persistRoomId,
  persistRoomSessionToken,
  seedPresenceParticipants,
  mergeCachedParticipantPing,
  syncServerOffset,
  saveRoomPassword,
  currentRoomIdRef,
  setCurrentRoom,
  setParticipants,
  setMessages,
  setSettlementHistory,
  setPlaylistProgress,
  setGameState,
  setIsGameView,
  setGamePlaylist,
  setRooms,
  setHostRoomPassword,
  setRoomNameInput,
  setRoomMaxPlayersInput,
}: UseRoomProviderCreateRoomActionParams) => {
  const questionMin = QUESTION_MIN;

  const resolvePlaylistSourceType = (
    sourceMode: RoomCreateSourceMode,
  ): PlaylistSourceType => {
    switch (sourceMode) {
      case "publicCollection":
        return "public_collection";
      case "privateCollection":
        return "private_collection";
      case "youtube":
        return "youtube_google_import";
      case "link":
      default:
        return "youtube_pasted_link";
    }
  };

  const getDefaultRoomName = (nextUsername: string | null) =>
    nextUsername ? `${nextUsername}'s room` : "新房間";

  const runWithTimeout = useCallback(
    async <T>(task: Promise<T>, timeoutMs: number, fallback: T) => {
      let timer: number | null = null;
      try {
        return await Promise.race<T>([
          task,
          new Promise<T>((resolve) => {
            timer = window.setTimeout(() => resolve(fallback), timeoutMs);
          }),
        ]);
      } finally {
        if (timer !== null) {
          window.clearTimeout(timer);
        }
      }
    },
    [],
  );

  const handleCreateRoom = useCallback(async () => {
    const socket = getSocket();
    if (!socket || !username) {
      setStatusText("請先設定使用者名稱");
      return;
    }

    if (createRoomInFlightRef.current) {
      setStatusText("正在建立房間，請稍候。");
      return;
    }

    createRoomInFlightRef.current = true;
    setIsCreatingRoom(true);
    setStatusText(null);

    const releaseCreateRoomLock = () => {
      createRoomInFlightRef.current = false;
      setIsCreatingRoom(false);
      releaseCreateRoomLockRef.current = null;
    };

    releaseCreateRoomLockRef.current = releaseCreateRoomLock;

    if (authToken) {
      const token = await runWithTimeout(
        ensureFreshAuthToken({
          token: authToken,
          refreshAuthToken,
        }),
        5_000,
        null,
      );

      if (!token) {
        setStatusText("登入狀態已失效，請重新登入。");
        releaseCreateRoomLock();
        return;
      }
    }

    const trimmed = roomNameInput.trim();
    const trimmedPin = roomPasswordInput.trim();
    const trimmedMaxPlayers = roomMaxPlayersInput.trim();

    if (!trimmed) {
      setStatusText("請先輸入房間名稱。");
      releaseCreateRoomLock();
      return;
    }

    if (playlistItems.length === 0 || !lastFetchedPlaylistId) {
      setStatusText("請先準備題庫內容，才能建立房間。");
      releaseCreateRoomLock();
      return;
    }

    if (playlistItems.length < questionMin) {
      setStatusText(`題庫至少需要 ${questionMin} 題，才能建立房間。`);
      releaseCreateRoomLock();
      return;
    }

    if (trimmedMaxPlayers && !/^\d+$/.test(trimmedMaxPlayers)) {
      setStatusText("最大玩家數必須是數字");
      releaseCreateRoomLock();
      return;
    }

    const desiredMaxPlayers = trimmedMaxPlayers
      ? Number(trimmedMaxPlayers)
      : DEFAULT_ROOM_MAX_PLAYERS;

    if (desiredMaxPlayers < PLAYER_MIN || desiredMaxPlayers > PLAYER_MAX) {
      setStatusText(`最大人數需介於 ${PLAYER_MIN} - ${PLAYER_MAX} 人之間 `);
      releaseCreateRoomLock();
      return;
    }

    const desiredVisibility = roomVisibilityInput;

    if (trimmedPin && !/^\d{4}$/.test(trimmedPin)) {
      setStatusText("PIN 需為 4 位數字。");
      releaseCreateRoomLock();
      return;
    }

    const desiredPin = trimmedPin || null;
    const nextQuestionCount = clampQuestionCount(
      questionCount,
      getQuestionMax(playlistItems.length),
    );
    const nextPlayDurationSec = clampPlayDurationSec(playDurationSec);
    const nextRevealDurationSec = clampRevealDurationSec(revealDurationSec);
    const nextStartOffsetSec = clampStartOffsetSec(startOffsetSec);
    const nextAllowCollectionClipTiming = Boolean(allowCollectionClipTiming);

    trackEvent("room_create_click", {
      source_mode: roomCreateSourceMode,
      room_visibility: desiredVisibility,
      player_limit: desiredMaxPlayers,
      question_count: nextQuestionCount,
      reveal_duration_sec: nextRevealDurationSec,
      playlist_count: playlistItems.length,
    });

    const uploadId =
      crypto.randomUUID?.() ??
      `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;

    const uploadItems = buildUploadPlaylistItems(playlistItems, {
      playDurationSec: nextPlayDurationSec,
      startOffsetSec: nextStartOffsetSec,
      allowCollectionClipTiming: nextAllowCollectionClipTiming,
    });

    const firstChunk = uploadItems.slice(0, CHUNK_SIZE);
    const remaining = uploadItems.slice(CHUNK_SIZE);
    const isLast = remaining.length === 0;

    const payload = {
      roomName: trimmed,
      username,
      pin: desiredPin ?? undefined,
      visibility: desiredVisibility,
      maxPlayers: desiredMaxPlayers,
      gameSettings: {
        questionCount: nextQuestionCount,
        playDurationSec: nextPlayDurationSec,
        revealDurationSec: nextRevealDurationSec,
        startOffsetSec: nextStartOffsetSec,
        allowCollectionClipTiming: nextAllowCollectionClipTiming,
        playbackExtensionMode: DEFAULT_PLAYBACK_EXTENSION_MODE,
      },
      playlist: {
        uploadId,
        id: lastFetchedPlaylistId,
        title: lastFetchedPlaylistTitle ?? undefined,
        sourceType: resolvePlaylistSourceType(roomCreateSourceMode),
        totalCount: uploadItems.length,
        items: firstChunk,
        isLast,
        pageSize: DEFAULT_PAGE_SIZE,
      },
    };

    const createStartedAt = Date.now();

    let createResolved = false;
    let createFinalized = false;

    const finalizeCreate = () => {
      if (createFinalized) return;
      createFinalized = true;
      releaseCreateRoomLock();
    };

    const buildPlaylistProgressFromState = (
      state: RoomState,
    ): PlaylistProgressState => ({
      received: state.room.playlist.receivedCount,
      total: state.room.playlist.totalCount,
      ready: state.room.playlist.ready,
    });

    const isPlaylistUploadComplete = (progress: PlaylistProgressState) =>
      progress.total > 0 &&
      progress.received >= progress.total &&
      progress.ready;

    const applyJoinedStateForCreatedRoom = (
      state: RoomState,
      options?: { playlistProgressOverride?: PlaylistProgressState },
    ) => {
      syncServerOffset(state.serverNow);

      const roomWithSettings = applyGameSettingsPatch(state.room, {
        questionCount: nextQuestionCount,
        playDurationSec: nextPlayDurationSec,
        revealDurationSec: nextRevealDurationSec,
        startOffsetSec: nextStartOffsetSec,
        allowCollectionClipTiming: nextAllowCollectionClipTiming,
        playbackExtensionMode: DEFAULT_PLAYBACK_EXTENSION_MODE,
      });

      const roomWithFinalPlaylist =
        options?.playlistProgressOverride !== undefined
          ? {
              ...roomWithSettings,
              playlist: {
                ...roomWithSettings.playlist,
                receivedCount: options.playlistProgressOverride.received,
                totalCount: options.playlistProgressOverride.total,
                ready: options.playlistProgressOverride.ready,
              },
            }
          : roomWithSettings;

      setCurrentRoom(roomWithFinalPlaylist);
      setParticipants((prev) =>
        mergeCachedParticipantPing(state.participants, prev),
      );
      seedPresenceParticipants(state.room.id, state.participants);
      setMessages(state.messages);
      setSettlementHistory(state.settlementHistory ?? []);
      persistRoomSessionToken(state.roomSessionToken ?? null);
      persistRoomId(state.room.id);
      lockSessionClientId(state.selfClientId);

      const nextPlaylistProgress =
        options?.playlistProgressOverride ??
        buildPlaylistProgressFromState(state);

      setPlaylistProgress(nextPlaylistProgress);
      setGameState(state.gameState ?? null);
      setIsGameView(false);
      setGamePlaylist([]);
      fetchPlaylistPage(state.room.id, 1, state.room.playlist.pageSize, {
        reset: true,
      });
    };

    const emitUploadPlaylistChunk = (
      roomId: string,
      chunk: PlaylistItem[],
      isLastChunk: boolean,
    ) =>
      new Promise<{
        receivedCount: number;
        totalCount: number;
        ready: boolean;
      }>((resolve, reject) => {
        let settled = false;

        const ackTimeout = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          reject(new Error("uploadPlaylistChunk ack timeout"));
        }, 5_000);

        socket.emit(
          "uploadPlaylistChunk",
          {
            roomId,
            uploadId,
            items: chunk,
            isLast: isLastChunk,
          },
          (
            ack: Ack<{
              receivedCount: number;
              totalCount: number;
              ready: boolean;
            }>,
          ) => {
            if (settled) return;
            settled = true;
            window.clearTimeout(ackTimeout);

            if (!ack) {
              reject(new Error("uploadPlaylistChunk missing ack"));
              return;
            }

            if (!ack.ok) {
              reject(new Error(ack.error || "uploadPlaylistChunk failed"));
              return;
            }

            resolve(ack.data);
          },
        );
      });

    const uploadRemainingPlaylistChunks = async (
      roomId: string,
      initialProgress: PlaylistProgressState,
    ): Promise<PlaylistProgressState> => {
      let latestProgress = initialProgress;
      setPlaylistProgress(latestProgress);

      if (remaining.length === 0) {
        return latestProgress;
      }

      for (let i = 0; i < remaining.length; i += CHUNK_SIZE) {
        const chunk = remaining.slice(i, i + CHUNK_SIZE);
        const isLastChunk = i + CHUNK_SIZE >= remaining.length;

        let uploaded = false;
        let lastError: unknown = null;

        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            const result = await emitUploadPlaylistChunk(
              roomId,
              chunk,
              isLastChunk,
            );

            latestProgress = {
              received: result.receivedCount,
              total: result.totalCount,
              ready: result.ready,
            };

            setPlaylistProgress(latestProgress);
            setStatusText(
              `正在同步題庫到房間（${latestProgress.received}/${latestProgress.total}）...`,
            );

            uploaded = true;
            lastError = null;
            break;
          } catch (error) {
            lastError = error;

            if (attempt === 2) {
              break;
            }

            await new Promise<void>((resolve) =>
              window.setTimeout(resolve, 400 * (attempt + 1)),
            );
          }
        }

        if (!uploaded) {
          throw lastError instanceof Error
            ? lastError
            : new Error("uploadPlaylistChunk failed");
        }
      }

      return latestProgress;
    };

    const rollbackCreatedRoom = async (roomId: string) => {
      await new Promise<void>((resolve) => {
        let settled = false;

        const timeout = window.setTimeout(() => {
          if (settled) return;
          settled = true;
          resolve();
        }, 2_000);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        socket.emit("leaveRoom", { roomId }, (_ack: Ack<null>) => {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          resolve();
        });
      });
    };

    const commitCreatedRoom = (
      state: RoomState,
      finalPlaylistProgress: PlaylistProgressState,
    ) => {
      applyJoinedStateForCreatedRoom(state, {
        playlistProgressOverride: finalPlaylistProgress,
      });
      saveRoomPassword(state.room.id, desiredPin);
      setHostRoomPassword(desiredPin);
      setRoomNameInput(getDefaultRoomName(username));
      setRoomMaxPlayersInput(String(DEFAULT_ROOM_MAX_PLAYERS));

      trackEvent("room_create_success", {
        room_id: state.room.id,
        source_mode: roomCreateSourceMode,
        room_visibility: desiredVisibility,
        player_limit: desiredMaxPlayers,
        question_count: nextQuestionCount,
        playlist_count: uploadItems.length,
      });

      setStatusText(null);
      finalizeCreate();
    };

    const tryRecoverCreatedRoomFromList = async () => {
      if (createResolved || !createRoomInFlightRef.current) return false;
      if (currentRoomIdRef.current) {
        createResolved = true;
        finalizeCreate();
        return true;
      }
      if (!apiUrl) return false;

      try {
        const roomsResult = await runWithTimeout(
          apiFetchRooms(apiUrl),
          4_000,
          null,
        );
        if (!roomsResult) return false;

        const { ok, payload } = roomsResult;
        if (!ok) return false;

        const nextRooms = ((payload?.rooms ?? payload) as RoomSummary[]) ?? [];
        if (Array.isArray(nextRooms)) {
          setRooms(nextRooms);
        }

        if (currentRoomIdRef.current) {
          createResolved = true;
          finalizeCreate();
          return true;
        }

        const createdWindowStart = createStartedAt - 30_000;
        const createdWindowEnd = Date.now() + 5_000;

        const candidate = nextRooms
          .filter((room) => {
            if ((room.name ?? "").trim() !== trimmed) return false;
            if ((room.hasPin ?? room.hasPassword) !== Boolean(desiredPin)) {
              return false;
            }
            if (
              typeof room.playlistCount === "number" &&
              room.playlistCount > 0 &&
              room.playlistCount !== uploadItems.length
            ) {
              return false;
            }
            if (
              typeof room.gameSettings?.questionCount === "number" &&
              room.gameSettings.questionCount !== nextQuestionCount
            ) {
              return false;
            }
            if (
              room.visibility &&
              (room.visibility === "public" || room.visibility === "private") &&
              room.visibility !== desiredVisibility
            ) {
              return false;
            }
            if (
              room.maxPlayers !== undefined &&
              (room.maxPlayers ?? null) !== desiredMaxPlayers
            ) {
              return false;
            }
            if (
              typeof room.createdAt === "number" &&
              (room.createdAt < createdWindowStart ||
                room.createdAt > createdWindowEnd)
            ) {
              return false;
            }
            return true;
          })
          .sort((a, b) => b.createdAt - a.createdAt)[0];

        if (!candidate) return false;

        const tryJoinCandidate = async () =>
          await new Promise<boolean>((resolve) => {
            socket.emit(
              "joinRoom",
              {
                roomCode: candidate.roomCode,
                username,
                pin: desiredPin ?? undefined,
              },
              async (joinAck: Ack<RoomState>) => {
                if (!joinAck?.ok) {
                  resolve(false);
                  return;
                }

                createResolved = true;

                const state = joinAck.data;
                const initialProgress = buildPlaylistProgressFromState(state);
                setPlaylistProgress(initialProgress);
                setStatusText(
                  initialProgress.ready
                    ? "正在完成房間初始化..."
                    : `正在同步題庫到房間（${initialProgress.received}/${initialProgress.total}）...`,
                );

                try {
                  const finalPlaylistProgress =
                    await uploadRemainingPlaylistChunks(
                      state.room.id,
                      initialProgress,
                    );

                  if (!isPlaylistUploadComplete(finalPlaylistProgress)) {
                    throw new Error("playlist upload incomplete");
                  }

                  commitCreatedRoom(state, finalPlaylistProgress);
                  resolve(true);
                } catch (error) {
                  console.error(error);
                  await rollbackCreatedRoom(state.room.id);
                  setStatusText(
                    "建立房間失敗：題庫同步未完成，已取消本次建立。",
                  );
                  finalizeCreate();
                  resolve(false);
                }
              },
            );
          });

        const retryIntervalsMs = [0, 350, 800];

        for (
          let joinAttempt = 0;
          joinAttempt < retryIntervalsMs.length;
          joinAttempt += 1
        ) {
          if (createResolved || !createRoomInFlightRef.current) return false;

          if (joinAttempt === 0) {
            setStatusText("已找到房間，正在自動加入。");
          } else {
            setStatusText(
              `已找到房間，正在重試自動加入（${joinAttempt + 1}/${retryIntervalsMs.length}）。`,
            );
            await new Promise<void>((resolve) =>
              window.setTimeout(resolve, retryIntervalsMs[joinAttempt]),
            );
            if (createResolved || !createRoomInFlightRef.current) return false;
          }

          const recovered = await tryJoinCandidate();
          if (recovered) return true;
        }

        return false;
      } catch (error) {
        console.error(error);
        return false;
      }
    };

    const submitCreateRoom = (attempt: 0 | 1) => {
      const timeoutMs = attempt === 0 ? 4_000 : 6_000;

      const ackTimeout = window.setTimeout(() => {
        if (createResolved || !createRoomInFlightRef.current) return;

        if (attempt === 0) {
          setStatusText("建立房間逾時，正在嘗試自動加入。");
          void tryRecoverCreatedRoomFromList().then((recovered) => {
            if (recovered || createResolved || !createRoomInFlightRef.current) {
              return;
            }
            setStatusText("建立房間逾時，正在重試。");
            submitCreateRoom(1);
          });
          return;
        }

        setStatusText("建立房間再次逾時，正在嘗試自動加入。");
        void tryRecoverCreatedRoomFromList().then((recovered) => {
          if (recovered || createResolved || !createRoomInFlightRef.current) {
            return;
          }
          setStatusText("建立房間逾時，請稍後重試。");
          finalizeCreate();
        });
      }, timeoutMs);

      socket.emit("createRoom", payload, async (ack: Ack<RoomState>) => {
        window.clearTimeout(ackTimeout);

        if (createResolved) return;

        if (!ack) {
          if (attempt === 0) {
            setStatusText("建立房間失敗，正在重試。");
            submitCreateRoom(1);
            return;
          }
          setStatusText("建立房間失敗：伺服器沒有回應。");
          finalizeCreate();
          return;
        }

        if (!ack.ok) {
          setStatusText(formatAckError("建立房間失敗", ack.error));
          finalizeCreate();
          return;
        }

        createResolved = true;

        const state = ack.data;
        const initialProgress = buildPlaylistProgressFromState(state);

        setPlaylistProgress(initialProgress);
        setStatusText(
          initialProgress.ready
            ? "正在完成房間初始化..."
            : `正在同步題庫到房間（${initialProgress.received}/${initialProgress.total}）...`,
        );

        try {
          const finalPlaylistProgress = await uploadRemainingPlaylistChunks(
            state.room.id,
            initialProgress,
          );

          if (!isPlaylistUploadComplete(finalPlaylistProgress)) {
            throw new Error("playlist upload incomplete");
          }

          commitCreatedRoom(state, finalPlaylistProgress);
        } catch (error) {
          console.error(error);
          await rollbackCreatedRoom(state.room.id);
          setStatusText("房間建立失敗：題庫同步未完成，已取消本次建立。");
          finalizeCreate();
        }
      });
    };

    submitCreateRoom(0);
  }, [
    allowCollectionClipTiming,
    authToken,
    createRoomInFlightRef,
    currentRoomIdRef,
    fetchPlaylistPage,
    getSocket,
    lastFetchedPlaylistId,
    lastFetchedPlaylistTitle,
    lockSessionClientId,
    mergeCachedParticipantPing,
    persistRoomId,
    playDurationSec,
    playlistItems,
    questionCount,
    questionMin,
    refreshAuthToken,
    releaseCreateRoomLockRef,
    revealDurationSec,
    roomCreateSourceMode,
    roomMaxPlayersInput,
    roomNameInput,
    roomPasswordInput,
    roomVisibilityInput,
    saveRoomPassword,
    seedPresenceParticipants,
    setCurrentRoom,
    setGamePlaylist,
    setGameState,
    setHostRoomPassword,
    setIsCreatingRoom,
    setIsGameView,
    setMessages,
    setParticipants,
    setPlaylistProgress,
    setRooms,
    setRoomMaxPlayersInput,
    setRoomNameInput,
    setSettlementHistory,
    setStatusText,
    startOffsetSec,
    syncServerOffset,
    persistRoomSessionToken,
    username,
    apiUrl,
    runWithTimeout,
  ]);

  return { handleCreateRoom };
};

export default useRoomProviderCreateRoomAction;
