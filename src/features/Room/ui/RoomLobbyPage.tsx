import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import GameRoomPage from "./GameRoomPage";
import GameSettlementPanel, {
  type SettlementQuestionRecap,
} from "./components/GameSettlementPanel";
import RoomLobbyPanel from "./components/RoomLobbyPanel";
import type { ChatMessage, RoomSettlementSnapshot } from "../model/types";
import { useRoom } from "../model/useRoom";

const SETTLEMENT_REVIEW_MESSAGE_ID_PREFIX = "settlement-review:";

const cloneSettlementRecaps = (recaps: SettlementQuestionRecap[]) =>
  recaps.map((item) => ({
    ...item,
    choices: item.choices.map((choice) => ({ ...choice })),
  }));

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
  } = useRoom();

  const [activeSettlementRoundKey, setActiveSettlementRoundKey] = useState<string | null>(null);
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

  useEffect(() => {
    autoOpenedEndedRoundRef.current = null;
    prevGameStatusRef.current = null;
    latestLiveRecapsRef.current = [];
    liveRoundStartedAtRef.current = null;
    lastTopSettlementRoundKeyRef.current = null;
    pendingAutoOpenSettlementRef.current = null;
  }, [currentRoom?.id]);

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
    const topSnapshot = settlementHistory[0];
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
  }, [settlementHistory]);

  useEffect(() => {
    const nextStatus = gameState?.status ?? null;
    if (prevGameStatusRef.current === "playing" && nextStatus === "ended") {
      pendingAutoOpenSettlementRef.current = {
        previousTopRoundKey: settlementHistory[0]?.roundKey ?? null,
      };
    }
    prevGameStatusRef.current = nextStatus;
  }, [gameState?.status, settlementHistory]);

  useEffect(() => {
    if (!currentRoom || gameState?.status !== "ended") return;
    const pending = pendingAutoOpenSettlementRef.current;
    if (!pending) return;
    const snapshot = settlementHistory[0] ?? null;
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
    setStatusText("遊戲已結束，顯示結算畫面");
    const timer = window.setTimeout(() => {
      setActiveSettlementRoundKey(snapshot.roundKey);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    currentRoom,
    gameState?.status,
    isGameView,
    settlementHistory,
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
      settlementHistory.find((item) => item.roundKey === resolvedActiveSettlementRoundKey) ??
      null
    );
  }, [resolvedActiveSettlementRoundKey, settlementHistory]);

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

  const latestSettlementSnapshot = settlementHistory[0] ?? null;

  const settlementReviewMessages = useMemo<ChatMessage[]>(() => {
    if (!currentRoom?.id) return [];
    return settlementHistory
      .slice()
      .sort((a, b) => a.endedAt - b.endedAt)
      .map((snapshot) => ({
        id: `${SETTLEMENT_REVIEW_MESSAGE_ID_PREFIX}${snapshot.roundKey}`,
        roomId: currentRoom.id,
        userId: "system:settlement-review",
        username: "系統",
        content: `對戰回顧：第 ${snapshot.roundNo} 局`,
        timestamp: snapshot.endedAt,
      }));
  }, [currentRoom, settlementHistory]);

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
      setStatusText("新對戰即將開始，已關閉回顧畫面");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    activeSettlementRoundKey,
    gameState?.status,
    isGameView,
    setIsGameView,
    setStatusText,
  ]);

  if (roomId && username && !currentRoom && !routeRoomResolved) {
    return (
      <div className="w-full md:w-4/5 lg:w-3/5 mx-auto mt-6">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
          正在連線並嘗試恢復房間...
        </div>
      </div>
    );
  }

  if (roomId && routeRoomResolved && !currentRoom) {
    return (
      <div className="w-full md:w-4/5 lg:w-3/5 mx-auto mt-6">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
          <div className="mb-2">房間不存在或已關閉，請返回房間列表。</div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--mc-accent)]/60 bg-[var(--mc-accent)]/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--mc-text)] transition hover:border-[var(--mc-accent)] hover:bg-[var(--mc-accent)]/30"
            onClick={() => navigate("/rooms", { replace: true })}
          >
            返回房間列表
          </button>
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
            handleLeaveRoom(() => navigate("/rooms", { replace: true }))
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
          playlistItems={activeSettlementSnapshot.playlistItems}
          trackOrder={activeSettlementSnapshot.trackOrder}
          playedQuestionCount={activeSettlementSnapshot.playedQuestionCount}
          startedAt={activeSettlementSnapshot.startedAt}
          endedAt={activeSettlementSnapshot.endedAt}
          meClientId={clientId}
          questionRecaps={activeSettlementQuestionRecaps}
          onBackToLobby={() => setActiveSettlementRoundKey(null)}
          onRequestExit={() =>
            handleLeaveRoom(() => navigate("/rooms", { replace: true }))
          }
        />
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
            handleLeaveRoom(() => navigate("/rooms", { replace: true }))
          }
          onInputChange={setMessageInput}
          onSend={handleSendMessage}
          onLoadMorePlaylist={loadMorePlaylist}
          onStartGame={handleStartGame}
          onUpdateRoomSettings={handleUpdateRoomSettings}
          hasLastSettlement={Boolean(latestSettlementSnapshot)}
          onOpenLastSettlement={() =>
            latestSettlementSnapshot
              ? setActiveSettlementRoundKey(latestSettlementSnapshot.roundKey)
              : undefined
          }
          onOpenSettlementByRoundKey={(roundKey) =>
            setActiveSettlementRoundKey(roundKey)
          }
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
