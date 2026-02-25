import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import GameRoomPage from "./GameRoomPage";
import GameSettlementPanel, {
  type SettlementQuestionRecap,
} from "./components/GameSettlementPanel";
import RoomLobbyPanel from "./components/RoomLobbyPanel";
import type {
  ChatMessage,
  RoomSettlementHistorySummary,
  RoomSettlementSnapshot,
} from "../model/types";
import { useRoom } from "../model/useRoom";

const SETTLEMENT_REVIEW_MESSAGE_ID_PREFIX = "settlement-review:";
const SETTLEMENT_SESSION_CACHE_KEY_PREFIX = "mq:settlement-cache:v1:";

const cloneSettlementRecaps = (recaps: SettlementQuestionRecap[]) =>
  recaps.map((item) => ({
    ...item,
    choices: item.choices.map((choice) => ({ ...choice })),
  }));

type SettlementSessionCachePayload = {
  summaries: RoomSettlementHistorySummary[];
  replays: Record<string, RoomSettlementSnapshot>;
};

const buildSettlementSummaryFromSnapshot = (
  snapshot: RoomSettlementSnapshot,
): RoomSettlementHistorySummary => ({
  matchId: `${snapshot.room.id}:${snapshot.roundNo}`,
  roundKey: snapshot.roundKey,
  roundNo: snapshot.roundNo,
  roomId: snapshot.room.id,
  roomName: snapshot.room.name,
  startedAt: snapshot.startedAt,
  endedAt: snapshot.endedAt,
  status: "ended",
  playerCount: snapshot.participants.length,
  questionCount: snapshot.playedQuestionCount,
  summaryJson: null,
});

const getSettlementSessionCacheKey = (
  roomId: string,
  clientId: string,
  joinedAtMs: number,
) => `${SETTLEMENT_SESSION_CACHE_KEY_PREFIX}${roomId}:${clientId}:${joinedAtMs}`;

const readSettlementSessionCache = (
  key: string,
): SettlementSessionCachePayload | null => {
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SettlementSessionCachePayload> | null;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      summaries: Array.isArray(parsed.summaries)
        ? (parsed.summaries as RoomSettlementHistorySummary[])
        : [],
      replays:
        parsed.replays && typeof parsed.replays === "object"
          ? (parsed.replays as Record<string, RoomSettlementSnapshot>)
          : {},
    };
  } catch {
    return null;
  }
};

const writeSettlementSessionCache = (
  key: string,
  payload: SettlementSessionCachePayload,
) => {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Best-effort cache only. Quota errors should not break the room UI.
  }
};

const clearSettlementSessionCacheForRoomClient = (roomId: string, clientId: string) => {
  try {
    const prefix = `${SETTLEMENT_SESSION_CACHE_KEY_PREFIX}${roomId}:${clientId}:`;
    const toRemove: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        toRemove.push(key);
      }
    }
    toRemove.forEach((key) => window.sessionStorage.removeItem(key));
  } catch {
    // ignore
  }
};

const RoomLobbyPage: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const {
    username,
    currentRoom,
    participants,
    messages,
    settlementHistory,
    messageInput,
    setMessageInput,
    playlistViewItems,
    playlistHasMore,
    playlistLoadingMore,
    playlistProgress,
    playlistSuggestions,
    playlistUrl,
    playlistItems,
    playlistError,
    playlistLoading,
    setPlaylistUrl,
    collections,
    collectionsLoading,
    collectionsError,
    collectionItemsLoading,
    collectionItemsError,
    selectedCollectionId,
    authUser,
    youtubePlaylists,
    youtubePlaylistsLoading,
    youtubePlaylistsError,
    fetchYoutubePlaylists,
    importYoutubePlaylist,
    gameState,
    isGameView,
    setIsGameView,
    gamePlaylist,
    clientId,
    routeRoomResolved,
    setStatusText,
    hostRoomPassword,
    serverOffsetMs,
    setRouteRoomId,
    handleLeaveRoom,
    handleSendMessage,
    loadMorePlaylist,
    handleStartGame,
    handleSubmitChoice,
    handleUpdateRoomSettings,
    handleKickPlayer,
    handleTransferHost,
    handleSuggestPlaylist,
    handleApplySuggestionSnapshot,
    handleChangePlaylist,
    handleFetchPlaylistByUrl,
    fetchCollections,
    selectCollection,
    loadCollectionItems,
    fetchSettlementHistorySummaries,
    fetchSettlementReplay,
  } = useRoom();

  const [activeSettlementRoundKey, setActiveSettlementRoundKey] = useState<string | null>(null);
  const [loadingSettlementRoundKey, setLoadingSettlementRoundKey] = useState<string | null>(
    null,
  );
  const [settlementHistorySummaries, setSettlementHistorySummaries] = useState<
    RoomSettlementHistorySummary[]
  >([]);
  const [settlementReplayByRoundKey, setSettlementReplayByRoundKey] = useState<
    Record<string, RoomSettlementSnapshot>
  >({});
  const [settlementCacheHydrated, setSettlementCacheHydrated] = useState(false);
  const [settlementSummaryListLoaded, setSettlementSummaryListLoaded] = useState(false);
  const [settlementRecapsByRoundKey, setSettlementRecapsByRoundKey] = useState<
    Record<string, SettlementQuestionRecap[]>
  >({});
  const autoOpenedEndedRoundRef = useRef<string | null>(null);
  const prevGameStatusRef = useRef<"playing" | "ended" | null>(null);
  const latestLiveRecapsRef = useRef<SettlementQuestionRecap[]>([]);
  const liveRoundStartedAtRef = useRef<number | null>(null);
  const lastTopSettlementRoundKeyRef = useRef<string | null>(null);
  const pendingAutoOpenSettlementRef = useRef<{
    previousTopRoundKey: string | null;
  } | null>(null);
  const lastJoinedRoomIdRef = useRef<string | null>(null);
  const settlementSummaryListRequestRef = useRef<Promise<RoomSettlementHistorySummary[]> | null>(
    null,
  );
  const selfParticipantJoinedAt = useMemo(
    () => participants.find((participant) => participant.clientId === clientId)?.joinedAt ?? null,
    [clientId, participants],
  );

  const settlementSessionCacheKey =
    currentRoom?.id && clientId && typeof selfParticipantJoinedAt === "number"
      ? getSettlementSessionCacheKey(currentRoom.id, clientId, selfParticipantJoinedAt)
      : null;

  useEffect(() => {
    autoOpenedEndedRoundRef.current = null;
    prevGameStatusRef.current = null;
    latestLiveRecapsRef.current = [];
    liveRoundStartedAtRef.current = null;
    lastTopSettlementRoundKeyRef.current = null;
    pendingAutoOpenSettlementRef.current = null;
    settlementSummaryListRequestRef.current = null;
    const timer = window.setTimeout(() => {
      setActiveSettlementRoundKey(null);
      setLoadingSettlementRoundKey(null);
      setSettlementHistorySummaries([]);
      setSettlementReplayByRoundKey({});
      setSettlementRecapsByRoundKey({});
      setSettlementCacheHydrated(false);
      setSettlementSummaryListLoaded(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentRoom?.id]);

  useEffect(() => {
    if (currentRoom?.id) {
      lastJoinedRoomIdRef.current = currentRoom.id;
    }
  }, [currentRoom?.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!settlementSessionCacheKey) {
        setSettlementCacheHydrated(true);
        return;
      }
      const cached = readSettlementSessionCache(settlementSessionCacheKey);
      if (cached) {
        setSettlementHistorySummaries(cached.summaries);
        setSettlementReplayByRoundKey(cached.replays);
        setSettlementSummaryListLoaded(cached.summaries.length > 0);
      }
      setSettlementCacheHydrated(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [settlementSessionCacheKey]);

  useEffect(() => {
    if (!settlementSessionCacheKey || !settlementCacheHydrated) return;
    writeSettlementSessionCache(settlementSessionCacheKey, {
      summaries: settlementHistorySummaries,
      replays: settlementReplayByRoundKey,
    });
  }, [
    settlementCacheHydrated,
    settlementHistorySummaries,
    settlementReplayByRoundKey,
    settlementSessionCacheKey,
  ]);

  useEffect(() => {
    if (gameState?.status !== "playing") return;
    if (liveRoundStartedAtRef.current === gameState.startedAt) return;
    liveRoundStartedAtRef.current = gameState.startedAt;
    latestLiveRecapsRef.current = [];
  }, [gameState?.startedAt, gameState?.status]);

  const liveRoundKey = useMemo(() => {
    if (!currentRoom?.id || !gameState?.startedAt) return null;
    return `${currentRoom.id}:${gameState.startedAt}`;
  }, [currentRoom?.id, gameState?.startedAt]);

  const roomScopedSettlementHistory = useMemo(
    () =>
      currentRoom?.id
        ? settlementHistory.filter((item) => item.room.id === currentRoom.id)
        : [],
    [currentRoom?.id, settlementHistory],
  );

  const roomScopedSettlementHistorySummaries = useMemo(
    () =>
      currentRoom?.id
        ? settlementHistorySummaries.filter((item) => item.roomId === currentRoom.id)
        : [],
    [currentRoom?.id, settlementHistorySummaries],
  );

  const roomScopedSettlementReplayByRoundKey = useMemo(() => {
    if (!currentRoom?.id) return {} as Record<string, RoomSettlementSnapshot>;
    const next: Record<string, RoomSettlementSnapshot> = {};
    for (const [roundKey, snapshot] of Object.entries(settlementReplayByRoundKey)) {
      if (snapshot.room.id === currentRoom.id) {
        next[roundKey] = snapshot;
      }
    }
    return next;
  }, [currentRoom?.id, settlementReplayByRoundKey]);

  useEffect(() => {
    if (!currentRoom?.id || roomScopedSettlementHistory.length === 0) return;
    const liveSummaries = roomScopedSettlementHistory.map(buildSettlementSummaryFromSnapshot);
    const timer = window.setTimeout(() => {
      setSettlementReplayByRoundKey((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const snapshot of roomScopedSettlementHistory) {
          if (next[snapshot.roundKey] === snapshot) continue;
          next[snapshot.roundKey] = snapshot;
          changed = true;
        }
        return changed ? next : prev;
      });
      setSettlementHistorySummaries((prev) => {
        const map = new Map(prev.map((item) => [item.roundKey, item] as const));
        let changed = false;
        for (const summary of liveSummaries) {
          const current = map.get(summary.roundKey);
          if (
            current &&
            current.matchId === summary.matchId &&
            current.endedAt === summary.endedAt &&
            current.playerCount === summary.playerCount &&
            current.questionCount === summary.questionCount
          ) {
            continue;
          }
          map.set(summary.roundKey, summary);
          changed = true;
        }
        if (!changed) return prev;
        return Array.from(map.values()).sort(
          (a, b) => b.endedAt - a.endedAt || b.roundNo - a.roundNo,
        );
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [currentRoom?.id, roomScopedSettlementHistory]);

  const ensureSettlementSummaryListLoaded = useCallback(async () => {
    if (!currentRoom?.id) return [] as RoomSettlementHistorySummary[];
    if (roomScopedSettlementHistorySummaries.length > 0) return roomScopedSettlementHistorySummaries;
    if (settlementSummaryListLoaded) return roomScopedSettlementHistorySummaries;
    if (settlementSummaryListRequestRef.current) {
      return await settlementSummaryListRequestRef.current;
    }

    const request = fetchSettlementHistorySummaries({ limit: 50 })
      .then(({ items }) => {
        setSettlementSummaryListLoaded(true);
        if (items.length > 0) {
          setSettlementHistorySummaries((prev) => {
            const merged = new Map<string, RoomSettlementHistorySummary>();
            prev.forEach((item) => merged.set(item.roundKey, item));
            items.forEach((item) => merged.set(item.roundKey, item));
            return Array.from(merged.values()).sort(
              (a, b) => b.endedAt - a.endedAt || b.roundNo - a.roundNo,
            );
          });
        }
        return items;
      })
      .catch((error) => {
        setSettlementSummaryListLoaded(true);
        throw error;
      })
      .finally(() => {
        settlementSummaryListRequestRef.current = null;
      });

    settlementSummaryListRequestRef.current = request;
    return await request;
  }, [
    currentRoom?.id,
    fetchSettlementHistorySummaries,
    roomScopedSettlementHistorySummaries,
    settlementSummaryListLoaded,
  ]);

  const openSettlementReviewByRoundKey = useCallback(
    async (roundKey: string) => {
      setActiveSettlementRoundKey(roundKey);
      if (
        roomScopedSettlementReplayByRoundKey[roundKey] ||
        roomScopedSettlementHistory.some((item) => item.roundKey === roundKey)
      ) {
        return;
      }

      let summary =
        roomScopedSettlementHistorySummaries.find((item) => item.roundKey === roundKey) ?? null;
      if (!summary) {
        try {
          const loaded = await ensureSettlementSummaryListLoaded();
          summary =
            loaded.find((item) => item.roundKey === roundKey) ??
            roomScopedSettlementHistorySummaries.find((item) => item.roundKey === roundKey) ??
            null;
        } catch (error) {
          setStatusText(
            error instanceof Error ? error.message : "讀取對戰回顧失敗，請稍後再試",
          );
          setActiveSettlementRoundKey(null);
          return;
        }
      }

      if (!summary) {
        setStatusText("找不到對戰回顧");
        setActiveSettlementRoundKey(null);
        return;
      }

      setLoadingSettlementRoundKey(roundKey);
      try {
        const snapshot = await fetchSettlementReplay(summary.matchId);
        setSettlementReplayByRoundKey((prev) => ({
          ...prev,
          [snapshot.roundKey]: snapshot,
        }));
        if (snapshot.roundKey !== roundKey) {
          setActiveSettlementRoundKey(snapshot.roundKey);
        }
      } catch (error) {
        setStatusText(error instanceof Error ? error.message : "讀取對戰回顧失敗");
        setActiveSettlementRoundKey(null);
      } finally {
        setLoadingSettlementRoundKey((prev) => (prev === roundKey ? null : prev));
      }
    },
    [
      ensureSettlementSummaryListLoaded,
      fetchSettlementReplay,
      roomScopedSettlementHistory,
      roomScopedSettlementReplayByRoundKey,
      roomScopedSettlementHistorySummaries,
      setStatusText,
    ],
  );

  const handleSettlementRecapChange = useCallback(
    (recaps: SettlementQuestionRecap[]) => {
      if (!liveRoundKey) return;
      setSettlementRecapsByRoundKey((prev) => {
        if (recaps.length === 0) {
          latestLiveRecapsRef.current = [];
          if (!(liveRoundKey in prev)) return prev;
          const next = { ...prev };
          delete next[liveRoundKey];
          return next;
        }
        const nextRecaps = cloneSettlementRecaps(recaps);
        latestLiveRecapsRef.current = nextRecaps;
        const current = prev[liveRoundKey];
        if (
          current &&
          current.length === nextRecaps.length &&
          current.every(
            (item, idx) =>
              item.key === nextRecaps[idx]?.key &&
              item.myResult === nextRecaps[idx]?.myResult &&
              item.myChoiceIndex === nextRecaps[idx]?.myChoiceIndex,
          )
        ) {
          return prev;
        }
        return {
          ...prev,
          [liveRoundKey]: nextRecaps,
        };
      });
    },
    [liveRoundKey],
  );

  useEffect(() => {
    const topSnapshot = roomScopedSettlementHistory[0];
    if (!topSnapshot) return;
    if (topSnapshot.roundKey === lastTopSettlementRoundKeyRef.current) return;
    lastTopSettlementRoundKeyRef.current = topSnapshot.roundKey;
    const liveRecaps = latestLiveRecapsRef.current;
    if (liveRecaps.length === 0) return;
    setSettlementRecapsByRoundKey((prev) => {
      const current = prev[topSnapshot.roundKey];
      if (
        current &&
        current.length === liveRecaps.length &&
        current.every(
          (item, idx) =>
            item.key === liveRecaps[idx]?.key &&
            item.myResult === liveRecaps[idx]?.myResult &&
            item.myChoiceIndex === liveRecaps[idx]?.myChoiceIndex,
        )
      ) {
        return prev;
      }
      return {
        ...prev,
        [topSnapshot.roundKey]: cloneSettlementRecaps(liveRecaps),
      };
    });
  }, [roomScopedSettlementHistory]);

  useEffect(() => {
    const nextStatus = gameState?.status ?? null;
    if (prevGameStatusRef.current === "playing" && nextStatus === "ended") {
      pendingAutoOpenSettlementRef.current = {
        previousTopRoundKey: roomScopedSettlementHistory[0]?.roundKey ?? null,
      };
    }
    prevGameStatusRef.current = nextStatus;
  }, [gameState?.status, roomScopedSettlementHistory]);

  useEffect(() => {
    if (!currentRoom || gameState?.status !== "ended") return;
    const pending = pendingAutoOpenSettlementRef.current;
    if (!pending) return;
    const snapshot = roomScopedSettlementHistory[0] ?? null;
    if (!snapshot) return;
    if (snapshot.roundKey === pending.previousTopRoundKey) return;
    if (autoOpenedEndedRoundRef.current === snapshot.roundKey) {
      pendingAutoOpenSettlementRef.current = null;
      return;
    }

    autoOpenedEndedRoundRef.current = snapshot.roundKey;
    pendingAutoOpenSettlementRef.current = null;
    if (isGameView) {
      setIsGameView(false);
    }
    setStatusText("遊戲已結束，正在開啟結算頁面");
    const timer = window.setTimeout(() => {
      setActiveSettlementRoundKey(snapshot.roundKey);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    currentRoom,
    gameState?.status,
    isGameView,
    roomScopedSettlementHistory,
    setIsGameView,
    setStatusText,
  ]);

  const resolvedActiveSettlementRoundKey = useMemo(() => {
    if (!activeSettlementRoundKey) return null;
    const nextRoomId = currentRoom?.id;
    if (!nextRoomId) return null;
    if (!activeSettlementRoundKey.startsWith(`${nextRoomId}:`)) return null;
    return activeSettlementRoundKey;
  }, [activeSettlementRoundKey, currentRoom]);

  const activeSettlementSnapshot = useMemo<RoomSettlementSnapshot | null>(() => {
    if (!resolvedActiveSettlementRoundKey) return null;
    return (
      roomScopedSettlementHistory.find((item) => item.roundKey === resolvedActiveSettlementRoundKey) ??
      roomScopedSettlementReplayByRoundKey[resolvedActiveSettlementRoundKey] ??
      null
    );
  }, [
    resolvedActiveSettlementRoundKey,
    roomScopedSettlementHistory,
    roomScopedSettlementReplayByRoundKey,
  ]);

  const activeSettlementQuestionRecaps = useMemo(() => {
    if (!activeSettlementSnapshot) return undefined;
    const snapshotRecaps = (
      activeSettlementSnapshot as RoomSettlementSnapshot & {
        questionRecaps?: SettlementQuestionRecap[];
      }
    ).questionRecaps;
    if (Array.isArray(snapshotRecaps) && snapshotRecaps.length > 0) {
      return snapshotRecaps;
    }
    return settlementRecapsByRoundKey[activeSettlementSnapshot.roundKey];
  }, [activeSettlementSnapshot, settlementRecapsByRoundKey]);

  const latestSettlementSnapshot = roomScopedSettlementHistory[0] ?? null;

  const latestSettlementSummary = useMemo<RoomSettlementHistorySummary | null>(() => {
    if (!latestSettlementSnapshot) return null;
    return {
      matchId: `${latestSettlementSnapshot.room.id}:${latestSettlementSnapshot.roundNo}`,
      roundKey: latestSettlementSnapshot.roundKey,
      roundNo: latestSettlementSnapshot.roundNo,
      roomId: latestSettlementSnapshot.room.id,
      roomName: latestSettlementSnapshot.room.name,
      startedAt: latestSettlementSnapshot.startedAt,
      endedAt: latestSettlementSnapshot.endedAt,
      status: "ended",
      playerCount: latestSettlementSnapshot.participants.length,
      questionCount: latestSettlementSnapshot.playedQuestionCount,
      summaryJson: null,
    };
  }, [latestSettlementSnapshot]);

  const mergedSettlementSummaries = useMemo(() => {
    const next = new Map<string, RoomSettlementHistorySummary>();
    roomScopedSettlementHistorySummaries.forEach((item) => {
      next.set(item.roundKey, item);
    });
    if (latestSettlementSummary) {
      next.set(latestSettlementSummary.roundKey, latestSettlementSummary);
    }
    return Array.from(next.values()).sort(
      (a, b) => a.endedAt - b.endedAt || a.roundNo - b.roundNo,
    );
  }, [latestSettlementSummary, roomScopedSettlementHistorySummaries]);


  const settlementReviewMessages = useMemo<ChatMessage[]>(() => {
    if (!currentRoom?.id) return [];
    return mergedSettlementSummaries.map((snapshot) => ({
        id: `${SETTLEMENT_REVIEW_MESSAGE_ID_PREFIX}${snapshot.roundKey}`,
        roomId: currentRoom.id,
        userId: "system:settlement-review",
        username: "系統",
        content: `對戰回顧：第 ${snapshot.roundNo} 局`,
        timestamp: snapshot.endedAt,
      }));
  }, [currentRoom, mergedSettlementSummaries]);

  const lobbyMessages = useMemo(() => {
    if (settlementReviewMessages.length === 0) return messages;
    return [...messages, ...settlementReviewMessages].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
  }, [messages, settlementReviewMessages]);

  useEffect(() => {
    setRouteRoomId(roomId ?? null);
    return () => setRouteRoomId(null);
  }, [roomId, setRouteRoomId]);

  useEffect(() => {
    if (currentRoom?.id && roomId && currentRoom.id !== roomId) {
      navigate(`/rooms/${currentRoom.id}`, { replace: true });
    }
  }, [currentRoom?.id, roomId, navigate]);

  useEffect(() => {
    if (!activeSettlementRoundKey) return;
    if (gameState?.status !== "playing") return;
    const timer = window.setTimeout(() => {
      setActiveSettlementRoundKey(null);
      if (!isGameView) {
        setIsGameView(true);
      }
      setStatusText("新對戰即將開始，已切回遊戲畫面");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    activeSettlementRoundKey,
    gameState?.status,
    isGameView,
    setIsGameView,
    setStatusText,
  ]);

  const removeSettlementCacheForRoom = useCallback(
    (targetRoomId: string | null) => {
      if (!targetRoomId || !clientId) return;
      clearSettlementSessionCacheForRoomClient(targetRoomId, clientId);
    },
    [clientId],
  );

  const leaveRoomAndNavigate = useCallback(() => {
    const targetRoomId = currentRoom?.id ?? roomId ?? lastJoinedRoomIdRef.current;
    setActiveSettlementRoundKey(null);
    handleLeaveRoom(() => {
      removeSettlementCacheForRoom(targetRoomId ?? null);
      navigate("/rooms", { replace: true });
    });
  }, [currentRoom?.id, handleLeaveRoom, navigate, removeSettlementCacheForRoom, roomId]);

  useEffect(() => {
    if (currentRoom) return;
    if (!routeRoomResolved) return;
    if (!lastJoinedRoomIdRef.current) return;
    removeSettlementCacheForRoom(lastJoinedRoomIdRef.current);
    lastJoinedRoomIdRef.current = null;
  }, [currentRoom, removeSettlementCacheForRoom, routeRoomResolved]);

  if (roomId && username && !currentRoom && !routeRoomResolved) {
    return (
      <div className="mx-auto mt-6 w-full max-w-[1080px] min-w-0">
        <div className="relative overflow-hidden rounded-[26px] border border-[var(--mc-border)] bg-[radial-gradient(circle_at_16%_18%,rgba(245,158,11,0.14),transparent_42%),radial-gradient(circle_at_84%_14%,rgba(234,179,8,0.08),transparent_46%),linear-gradient(180deg,rgba(12,10,8,0.96),rgba(7,6,4,0.98))] p-6 text-[var(--mc-text)] shadow-[0_30px_90px_-62px_rgba(245,158,11,0.65)] sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(245,158,11,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="relative grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="min-w-0 rounded-2xl border border-amber-200/12 bg-[color-mix(in_srgb,var(--mc-surface-strong)_80%,black_20%)] p-5">
              <div className="flex items-center gap-3">
                <div className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-amber-300/35 bg-amber-300/10 shadow-[0_0_24px_-10px_rgba(245,158,11,0.9)]">
                  <span className="absolute inset-1 rounded-[10px] border border-amber-200/20" />
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-amber-200/85 border-t-transparent" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--mc-text-muted)]">
                    Room Connect
                  </div>
                  <div className="truncate text-base font-semibold text-[var(--mc-text)] sm:text-lg">
                    正在進入房間，請稍後
                  </div>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-[var(--mc-text-muted)]">
                正在同步房間狀態、播放清單與目前對戰資訊。完成後會自動切換到房間畫面。
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex min-w-0 max-w-full items-center rounded-full border border-[var(--mc-border)] bg-[var(--mc-surface)]/75 px-3 py-1 text-xs text-[var(--mc-text-muted)]">
                  房號：<span className="ml-1 truncate text-[var(--mc-text)]">{roomId}</span>
                </span>
                <span className="inline-flex min-w-0 max-w-full items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100/90">
                  玩家：<span className="ml-1 truncate text-amber-50">{username}</span>
                </span>
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-[var(--mc-border)] bg-[color-mix(in_srgb,var(--mc-surface)_88%,black_12%)] p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs tracking-[0.2em] text-[var(--mc-text-muted)]">
                  連線進度
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-[11px] text-emerald-100/90">
                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
                  處理中
                </div>
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-2/3 animate-pulse rounded-full bg-[linear-gradient(90deg,rgba(245,158,11,0.75),rgba(250,204,21,0.95),rgba(251,191,36,0.7))]" />
              </div>

              <div className="mt-5 space-y-3 text-sm text-[var(--mc-text-muted)]">
                {[
                  "建立連線並驗證身份",
                  "讀取房間資料與玩家名單",
                  "同步最近狀態與顯示畫面",
                ].map((step, index) => (
                  <div
                    key={step}
                    className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] px-3 py-2"
                  >
                    <span
                      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-amber-200/20 bg-amber-300/10 text-[11px] font-semibold text-amber-100"
                      style={{
                        animation: "pulse 1.6s ease-in-out infinite",
                        animationDelay: `${index * 0.18}s`,
                      }}
                    >
                      {index + 1}
                    </span>
                    <span className="truncate">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (roomId && routeRoomResolved && !currentRoom) {
    return (
      <div className="mx-auto mt-6 w-full max-w-[1080px] min-w-0">
        <div className="relative overflow-hidden rounded-[26px] border border-[var(--mc-border)] bg-[radial-gradient(circle_at_14%_16%,rgba(245,158,11,0.14),transparent_42%),radial-gradient(circle_at_88%_10%,rgba(234,179,8,0.08),transparent_46%),linear-gradient(180deg,rgba(20,17,13,0.96),rgba(9,8,6,0.98))] p-6 text-[var(--mc-text)] shadow-[0_35px_80px_-60px_rgba(245,158,11,0.55)] sm:p-8">
          <div className="pointer-events-none absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(245,158,11,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-3 rounded-2xl border border-[var(--mc-border)] bg-[color-mix(in_srgb,var(--mc-surface-strong)_88%,black_12%)] px-4 py-3">
                <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/28 bg-amber-300/10">
                  <span className="absolute h-5 w-5 rounded-full border border-amber-200/55" />
                  <span className="absolute h-[2px] w-4 rotate-45 rounded-full bg-amber-200/70" />
                  <span className="absolute h-1.5 w-1.5 rounded-full bg-amber-200" />
                </span>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--mc-text-muted)]">
                    Room Check
                  </div>
                  <div className="text-sm font-semibold text-[var(--mc-text)] sm:text-base">
                    房間連線失敗
                  </div>
                </div>
              </div>

              <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[var(--mc-text)] sm:text-3xl">
                找不到這個房間
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--mc-text-muted)] sm:text-[15px]">
                這個房間可能已關閉、房號錯誤，或邀請連結已失效。你可以返回大廳重新加入房間，或建立一個新的房間開始對戰。
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex max-w-full items-center rounded-full border border-[var(--mc-border)] bg-[var(--mc-surface)]/70 px-3 py-1 text-xs text-[var(--mc-text-muted)]">
                  房號：<span className="ml-1 truncate text-[var(--mc-text)]">{roomId}</span>
                </span>
                <span className="inline-flex items-center rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100/90">
                  狀態：未找到或已關閉
                </span>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--mc-accent)]/65 bg-[var(--mc-accent)]/18 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mc-text)] transition hover:border-[var(--mc-accent)] hover:bg-[var(--mc-accent)]/28"
                  onClick={() => navigate("/rooms", { replace: true })}
                >
                  返回大廳
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-full border border-[var(--mc-border)] bg-[var(--mc-surface)]/70 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mc-text)] transition hover:border-amber-200/25 hover:bg-[var(--mc-surface-strong)]/85"
                  onClick={() => navigate("/rooms/create")}
                >
                  建立房間
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--mc-border)] bg-[color-mix(in_srgb,var(--mc-surface)_86%,black_14%)] p-4 sm:p-5">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--mc-text-muted)]">
                可能原因
              </div>
              <ul className="mt-3 space-y-3 text-sm leading-6 text-[var(--mc-text-muted)]">
                <li className="rounded-xl border border-[var(--mc-border)]/70 bg-black/15 px-3 py-2">
                  房主已離開並關閉房間
                </li>
                <li className="rounded-xl border border-[var(--mc-border)]/70 bg-black/15 px-3 py-2">
                  邀請連結對應的房號已過期
                </li>
                <li className="rounded-xl border border-[var(--mc-border)]/70 bg-black/15 px-3 py-2">
                  複製連結時房號被截斷或修改
                </li>
              </ul>
              <div className="mt-4 rounded-xl border border-amber-300/18 bg-amber-300/8 px-3 py-2 text-xs leading-5 text-amber-100/85">
                建議從「房間大廳」重新整理列表後再加入，避免使用已失效的舊連結。
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentRoom && gameState && isGameView && gameState.status === "playing") {
    return (
      <div className="flex w-full min-w-0 justify-center">
        <GameRoomPage
          room={currentRoom}
          gameState={gameState}
          playlist={gamePlaylist}
          onBackToLobby={() => setIsGameView(false)}
          onExitGame={() =>
            leaveRoomAndNavigate()
          }
          onSubmitChoice={handleSubmitChoice}
          participants={participants}
          meClientId={clientId}
          messages={messages}
          messageInput={messageInput}
          onMessageChange={setMessageInput}
          onSendMessage={handleSendMessage}
          username={username}
          serverOffsetMs={serverOffsetMs}
          onSettlementRecapChange={handleSettlementRecapChange}
        />
      </div>
    );
  }

  if (activeSettlementSnapshot) {
    return (
      <div className="flex w-full min-w-0 justify-center">
        <GameSettlementPanel
          room={activeSettlementSnapshot.room}
          participants={activeSettlementSnapshot.participants}
          messages={activeSettlementSnapshot.messages}
          playlistItems={activeSettlementSnapshot.playlistItems ?? []}
          trackOrder={activeSettlementSnapshot.trackOrder}
          playedQuestionCount={activeSettlementSnapshot.playedQuestionCount}
          startedAt={activeSettlementSnapshot.startedAt}
          endedAt={activeSettlementSnapshot.endedAt}
          meClientId={clientId}
          questionRecaps={activeSettlementQuestionRecaps}
          onBackToLobby={() => setActiveSettlementRoundKey(null)}
          onRequestExit={() =>
            leaveRoomAndNavigate()
          }
        />
      </div>
    );
  }

  if (
    resolvedActiveSettlementRoundKey &&
    loadingSettlementRoundKey === resolvedActiveSettlementRoundKey
  ) {
    return (
      <div className="flex w-full min-w-0 justify-center">
        <div className="w-full max-w-[1200px] rounded-[24px] border border-slate-700/80 bg-slate-950/90 px-6 py-10 text-center text-slate-200">
          正在讀取對戰回顧...
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 flex-row justify-center">
      {currentRoom?.id && username && (
        <RoomLobbyPanel
          currentRoom={currentRoom}
          participants={participants}
          messages={lobbyMessages}
          username={username}
          roomPassword={hostRoomPassword}
          messageInput={messageInput}
          playlistItems={playlistViewItems}
          playlistHasMore={playlistHasMore}
          playlistLoadingMore={playlistLoadingMore}
          playlistProgress={playlistProgress}
          playlistSuggestions={playlistSuggestions}
          playlistUrl={playlistUrl}
          playlistItemsForChange={playlistItems}
          playlistError={playlistError}
          playlistLoading={playlistLoading}
          collections={collections}
          collectionsLoading={collectionsLoading}
          collectionsError={collectionsError}
          collectionItemsLoading={collectionItemsLoading}
          collectionItemsError={collectionItemsError}
          isGoogleAuthed={Boolean(authUser)}
          selectedCollectionId={selectedCollectionId}
          youtubePlaylists={youtubePlaylists}
          youtubePlaylistsLoading={youtubePlaylistsLoading}
          youtubePlaylistsError={youtubePlaylistsError}
          isHost={currentRoom.hostClientId === clientId}
          gameState={gameState}
          canStartGame={playlistProgress.ready}
          onLeave={() =>
            leaveRoomAndNavigate()
          }
          onInputChange={setMessageInput}
          onSend={handleSendMessage}
          onLoadMorePlaylist={loadMorePlaylist}
          onStartGame={handleStartGame}
          onUpdateRoomSettings={handleUpdateRoomSettings}
          hasLastSettlement={Boolean(
            latestSettlementSnapshot ||
              mergedSettlementSummaries.length > 0
          )}
          onOpenLastSettlement={() => {
            if (latestSettlementSnapshot) {
              setActiveSettlementRoundKey(latestSettlementSnapshot.roundKey);
              return;
            }
            void (async () => {
              const summaries =
                mergedSettlementSummaries.length > 0
                  ? mergedSettlementSummaries
                  : await ensureSettlementSummaryListLoaded();
              const latest = [...summaries].sort(
                (a, b) => b.endedAt - a.endedAt || b.roundNo - a.roundNo,
              )[0];
              if (!latest) {
                setStatusText("目前沒有可查看的對戰回顧");
                return;
              }
              await openSettlementReviewByRoundKey(latest.roundKey);
            })().catch((error) => {
              setStatusText(
                error instanceof Error ? error.message : "讀取對戰回顧失敗，請稍後再試",
              );
            });
          }}
          onOpenSettlementByRoundKey={(roundKey) => {
            void openSettlementReviewByRoundKey(roundKey);
          }}
          onOpenGame={() => {
            setActiveSettlementRoundKey(null);
            setIsGameView(true);
          }}
          onKickPlayer={handleKickPlayer}
          onTransferHost={handleTransferHost}
          onSuggestPlaylist={handleSuggestPlaylist}
          onApplySuggestionSnapshot={handleApplySuggestionSnapshot}
          onChangePlaylist={handleChangePlaylist}
          onPlaylistUrlChange={setPlaylistUrl}
          onFetchPlaylistByUrl={handleFetchPlaylistByUrl}
          onFetchCollections={fetchCollections}
          onSelectCollection={selectCollection}
          onLoadCollectionItems={loadCollectionItems}
          onFetchYoutubePlaylists={fetchYoutubePlaylists}
          onImportYoutubePlaylist={importYoutubePlaylist}
          onInvite={async () => {
            const url = new URL(window.location.href);
            url.pathname = `/invited/${currentRoom.id}`;
            url.search = "";
            const inviteText = url.toString();
            if (navigator.clipboard?.writeText) {
              try {
                await navigator.clipboard.writeText(inviteText);
                setStatusText("邀請連結已複製");
              } catch {
                setStatusText("無法複製邀請連結");
              }
            } else {
              setStatusText(inviteText);
            }
          }}
        />
      )}
    </div>
  );
};

export default RoomLobbyPage;
