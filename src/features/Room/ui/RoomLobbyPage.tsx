import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import GameRoomPage from "./GameRoomPage";
import GameSettlementPanel from "./components/GameSettlementPanel";
import RoomLobbyPanel from "./components/RoomLobbyPanel";
import type { ChatMessage, RoomSettlementSnapshot } from "../model/types";
import { useRoom } from "../model/useRoom";

const SETTLEMENT_REVIEW_MESSAGE_ID_PREFIX = "settlement-review:";

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
  const autoOpenedEndedRoundRef = useRef<string | null>(null);
  const prevGameStatusRef = useRef<"playing" | "ended" | null>(null);
  const pendingAutoOpenSettlementRef = useRef<{
    previousTopRoundKey: string | null;
  } | null>(null);

  useEffect(() => {
    autoOpenedEndedRoundRef.current = null;
    prevGameStatusRef.current = null;
    pendingAutoOpenSettlementRef.current = null;
  }, [currentRoom?.id]);

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

  if (activeSettlementSnapshot) {
    return (
      <div className="flex w-full justify-center">
        <GameSettlementPanel
          room={activeSettlementSnapshot.room}
          participants={activeSettlementSnapshot.participants}
          messages={activeSettlementSnapshot.messages}
          playlistItems={activeSettlementSnapshot.playlistItems}
          trackOrder={activeSettlementSnapshot.trackOrder}
          playedQuestionCount={activeSettlementSnapshot.playedQuestionCount}
          meClientId={clientId}
          onBackToLobby={() => setActiveSettlementRoundKey(null)}
          onRequestExit={() =>
            handleLeaveRoom(() => navigate("/rooms", { replace: true }))
          }
        />
      </div>
    );
  }

  if (currentRoom && gameState && isGameView && gameState.status === "playing") {
    return (
      <div className="flex w-full justify-center">
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
