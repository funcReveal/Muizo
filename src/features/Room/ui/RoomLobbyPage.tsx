import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import GameRoomPage from "./GameRoomPage";
import GameSettlementPanel, {
  type SettlementQuestionRecap,
} from "./components/GameSettlementPanel";
import RoomLobbyPanel from "./components/RoomLobbyPanel";
import type {
  ChatMessage,
  PlaylistItem,
  RoomParticipant,
  RoomState,
} from "../model/types";
import { useRoom } from "../model/useRoom";

type LastSettlementSnapshot = {
  roundKey: string;
  room: RoomState["room"];
  participants: RoomParticipant[];
  messages: ChatMessage[];
  playlistItems: PlaylistItem[];
  trackOrder: number[];
  playedQuestionCount: number;
  questionRecaps: SettlementQuestionRecap[];
  meClientId?: string;
};

const cloneQuestionRecaps = (recaps: SettlementQuestionRecap[]) =>
  recaps.map((recap) => ({
    ...recap,
    choices: recap.choices.map((choice) => ({ ...choice })),
  }));

const RoomLobbyPage: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const {
    username,
    currentRoom,
    participants,
    messages,
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
  const [lastSettlementSnapshot, setLastSettlementSnapshot] =
    useState<LastSettlementSnapshot | null>(null);
  const [latestQuestionRecaps, setLatestQuestionRecaps] = useState<
    SettlementQuestionRecap[]
  >([]);
  const [showLastSettlement, setShowLastSettlement] = useState(false);
  const roomIdentityRef = useRef<string | null>(null);
  const capturedRoundKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const nextRoomId = currentRoom?.id ?? null;
    if (roomIdentityRef.current === nextRoomId) return;
    roomIdentityRef.current = nextRoomId;
    capturedRoundKeyRef.current = null;
    setShowLastSettlement(false);
    setLatestQuestionRecaps([]);
    setLastSettlementSnapshot(null);
  }, [currentRoom?.id]);

  useEffect(() => {
    if (!currentRoom || !gameState || gameState.status !== "ended") return;
    const roundKey = `${currentRoom.id}:${gameState.startedAt}`;
    const normalizedRecaps = cloneQuestionRecaps(latestQuestionRecaps);
    const isSameRound = capturedRoundKeyRef.current === roundKey;
    const previousRecapCount =
      isSameRound && lastSettlementSnapshot?.roundKey === roundKey
        ? lastSettlementSnapshot.questionRecaps.length
        : -1;
    if (isSameRound && previousRecapCount >= normalizedRecaps.length) return;
    capturedRoundKeyRef.current = roundKey;

    const playedQuestionCount =
      gameState.trackOrder.length || currentRoom.gameSettings?.questionCount || 0;

    setLastSettlementSnapshot({
      roundKey,
      room: {
        ...currentRoom,
        gameSettings: currentRoom.gameSettings
          ? { ...currentRoom.gameSettings }
          : undefined,
        playlist: {
          ...currentRoom.playlist,
          items: currentRoom.playlist.items.map((item) => ({ ...item })),
        },
      },
      participants: participants.map((participant) => ({ ...participant })),
      messages: messages.map((message) => ({ ...message })),
      playlistItems: gamePlaylist.map((item) => ({ ...item })),
      trackOrder: [...gameState.trackOrder],
      playedQuestionCount,
      questionRecaps: normalizedRecaps,
      meClientId: clientId,
    });
  }, [
    clientId,
    currentRoom,
    gamePlaylist,
    gameState,
    lastSettlementSnapshot?.questionRecaps.length,
    lastSettlementSnapshot?.roundKey,
    latestQuestionRecaps,
    messages,
    participants,
  ]);

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
          正在載入房間資訊…
        </div>
      </div>
    );
  }

  if (roomId && routeRoomResolved && !currentRoom) {
    return (
      <div className="w-full md:w-4/5 lg:w-3/5 mx-auto mt-6">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-200">
          <div className="mb-2">
            無法加入房間，可能已關閉或你已離開。
          </div>
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

  if (showLastSettlement && lastSettlementSnapshot) {
    return (
      <div className="flex w-full justify-center">
        <GameSettlementPanel
          room={lastSettlementSnapshot.room}
          participants={lastSettlementSnapshot.participants}
          messages={lastSettlementSnapshot.messages}
          playlistItems={lastSettlementSnapshot.playlistItems}
          trackOrder={lastSettlementSnapshot.trackOrder}
          playedQuestionCount={lastSettlementSnapshot.playedQuestionCount}
          questionRecaps={lastSettlementSnapshot.questionRecaps}
          meClientId={lastSettlementSnapshot.meClientId}
          onBackToLobby={() => setShowLastSettlement(false)}
          onRequestExit={() =>
            handleLeaveRoom(() => navigate("/rooms", { replace: true }))
          }
        />
      </div>
    );
  }

  if (currentRoom && gameState && isGameView) {
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
          onSettlementRecapChange={setLatestQuestionRecaps}
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
          messages={messages}
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
          hasLastSettlement={Boolean(lastSettlementSnapshot)}
          onOpenLastSettlement={() => setShowLastSettlement(true)}
          onOpenGame={() => {
            setShowLastSettlement(false);
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
                setStatusText("已複製邀請連結");
              } catch {
                setStatusText("複製邀請連結失敗");
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
