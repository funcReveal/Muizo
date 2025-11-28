import { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SERVER_URL = "http://217.142.240.18:3000";

type Ack<T> = { ok: true; data: T } | { ok: false; error: string };

interface RoomParticipant {
  socketId: string;
  username: string;
}

interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: number;
}

interface RoomSummary {
  id: string;
  name: string;
  playerCount: number;
  createdAt: number;
}

interface RoomState {
  room: RoomSummary;
  participants: RoomParticipant[];
  messages: ChatMessage[];
}

// Client -> Server
interface ClientToServerEvents {
  createRoom: (
    payload: { roomName: string; username: string },
    callback?: (ack: Ack<RoomState>) => void
  ) => void;
  joinRoom: (
    payload: { roomId: string; username: string },
    callback?: (ack: Ack<RoomState>) => void
  ) => void;
  leaveRoom: (
    payload: { roomId: string },
    callback?: (ack: Ack<null>) => void
  ) => void;
  sendMessage: (
    payload: { roomId: string; content: string },
    callback?: (ack: Ack<ChatMessage>) => void
  ) => void;
  listRooms: (callback?: (ack: Ack<RoomSummary[]>) => void) => void;
}

interface ServerToClientEvents {
  roomsUpdated: (rooms: RoomSummary[]) => void;
  joinedRoom: (state: RoomState) => void;
  userJoined: (payload: {
    roomId: string;
    participant: RoomParticipant;
  }) => void;
  userLeft: (payload: { roomId: string; socketId: string }) => void;
  messageAdded: (payload: { roomId: string; message: ChatMessage }) => void;
}

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const formatTime = (timestamp: number) => {
  const d = new Date(timestamp);
  return d.toLocaleTimeString();
};

const RoomChatPage: React.FC = () => {
  const [usernameInput, setUsernameInput] = useState("");
  const [username, setUsername] = useState<string | null>(null);

  const [isConnected, setIsConnected] = useState(false);

  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [roomNameInput, setRoomNameInput] = useState("");
  const [currentRoom, setCurrentRoom] = useState<RoomSummary | null>(null);
  const [participants, setParticipants] = useState<RoomParticipant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [statusText, setStatusText] = useState<string | null>(null);

  // socket 用 ref，不用 state（避免 effect 警告）
  const socketRef = useRef<ClientSocket | null>(null);
  // 目前所在房間 id，用來避免 listener 用到舊的 currentRoom
  const currentRoomIdRef = useRef<string | null>(null);

  const displayUsername = useMemo(() => username ?? "(not set)", [username]);

  // 設定 username
  const handleSetUsername = () => {
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setStatusText("請先輸入使用者名稱");
      return;
    }
    setUsername(trimmed);
    setStatusText(null);
  };

  // currentRoom 改變時，同步更新 ref
  useEffect(() => {
    currentRoomIdRef.current = currentRoom?.id ?? null;
  }, [currentRoom]);

  // 建立 Socket.IO 連線（只依賴 username）
  useEffect(() => {
    if (!username) return;

    const s: ClientSocket = io(SERVER_URL, {
      transports: ["websocket"],
    });

    socketRef.current = s;

    s.on("connect", () => {
      setIsConnected(true);
      setStatusText("Connected to server");
      console.log("[client] connected with id =", s.id);

      // 連線時拿一次房間列表
      s.emit("listRooms", (ack) => {
        if (ack && ack.ok) {
          setRooms(ack.data);
        }
      });
    });

    s.on("disconnect", () => {
      console.log("[client] disconnected");
      setIsConnected(false);
      setStatusText("Disconnected from server");
      setCurrentRoom(null);
      setParticipants([]);
      setMessages([]);
      currentRoomIdRef.current = null;
    });

    // 房間列表更新
    s.on("roomsUpdated", (updatedRooms) => {
      setRooms(updatedRooms);
    });

    // 自己成功進入某個房間（建立 or 加入）
    s.on("joinedRoom", (state) => {
      console.log("[client] joinedRoom state =", state);
      setCurrentRoom(state.room);
      setParticipants(state.participants);
      setMessages(state.messages);
      currentRoomIdRef.current = state.room.id;
      setStatusText(`Joined room: ${state.room.name}`);
    });

    // 有人加入房間
    s.on("userJoined", ({ roomId, participant }) => {
      if (roomId !== currentRoomIdRef.current) return;
      setParticipants((prev) => {
        const exists = prev.some((p) => p.socketId === participant.socketId);
        if (exists) return prev;
        return [...prev, participant];
      });
    });

    // 有人離開房間
    s.on("userLeft", ({ roomId, socketId }) => {
      if (roomId !== currentRoomIdRef.current) return;
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    // 新訊息
    s.on("messageAdded", ({ roomId, message }) => {
      if (roomId !== currentRoomIdRef.current) return;
      setMessages((prev) => [...prev, message]);
    });

    return () => {
      s.removeAllListeners();
      s.disconnect();
      socketRef.current = null;
      currentRoomIdRef.current = null;
    };
  }, [username]);

  const getSocket = () => socketRef.current;

  // 建房（建立後自己就進房）
  const handleCreateRoom = () => {
    const s = getSocket();
    if (!s || !username) {
      setStatusText("尚未連線或尚未設定使用者名稱");
      return;
    }
    const trimmed = roomNameInput.trim();
    if (!trimmed) {
      setStatusText("請輸入房間名稱");
      return;
    }

    s.emit("createRoom", { roomName: trimmed, username }, (ack) => {
      if (!ack) return;
      if (ack.ok) {
        const state = ack.data;
        setCurrentRoom(state.room);
        setParticipants(state.participants);
        setMessages(state.messages);
        currentRoomIdRef.current = state.room.id;
        setRoomNameInput("");
        setStatusText(`房間建立成功：${state.room.name}`);
      } else {
        setStatusText(`建立房間失敗：${ack.error}`);
      }
    });
  };

  // 加入房間
  const handleJoinRoom = (roomId: string) => {
    const s = getSocket();
    if (!s || !username) {
      setStatusText("尚未連線或尚未設定使用者名稱");
      return;
    }

    s.emit("joinRoom", { roomId, username }, (ack) => {
      if (!ack) return;
      if (ack.ok) {
        const state = ack.data;
        setCurrentRoom(state.room);
        setParticipants(state.participants);
        setMessages(state.messages);
        currentRoomIdRef.current = state.room.id;
        setStatusText(`加入房間：${state.room.name}`);
      } else {
        setStatusText(`加入房間失敗：${ack.error}`);
      }
    });
  };

  // 離開房間
  const handleLeaveRoom = () => {
    const s = getSocket();
    if (!s || !currentRoom) return;

    s.emit("leaveRoom", { roomId: currentRoom.id }, (ack) => {
      if (!ack) return;
      if (ack.ok) {
        setCurrentRoom(null);
        setParticipants([]);
        setMessages([]);
        currentRoomIdRef.current = null;
        setStatusText("已離開房間");
      } else {
        setStatusText(`離開房間失敗：${ack.error}`);
      }
    });
  };

  // 房內發送訊息
  const handleSendMessage = () => {
    const s = getSocket();
    if (!s || !currentRoom) {
      setStatusText("尚未加入任何房間");
      return;
    }
    const trimmed = messageInput.trim();
    if (!trimmed) return;

    console.log(
      "[client] sendMessage using socket",
      s.id,
      "room =",
      currentRoom
    );

    s.emit(
      "sendMessage",
      { roomId: currentRoom.id, content: trimmed },
      (ack) => {
        if (!ack) return;
        if (!ack.ok) {
          console.log("[client] sendMessage failed ack =", ack);
          setStatusText(`訊息發送失敗：${ack.error}`);
        }
        // 成功的情況由 messageAdded 再同步
      }
    );

    setMessageInput("");
  };

  // ----- UI -----

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="mb-3 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold bg-gradient-to-r from-sky-400 to-violet-400 bg-clip-text text-transparent">
            MusicQuiz – Rooms & Chat
          </h1>
          <p className="text-sm text-slate-400">
            Create a room, invite friends, and chat in real time.
          </p>
        </div>
        <div className="text-right text-xs text-slate-400 space-y-1">
          <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-slate-900/80 border border-slate-700">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            <span className="text-slate-300">{SERVER_URL}</span>
          </div>
          <div>
            Status:{" "}
            <span
              className={
                isConnected
                  ? "ml-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-500/40"
                  : "ml-1 inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-300 border border-red-500/40"
              }
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {isConnected ? "Connected" : "Disconnected"}
            </span>
          </div>
          <div>
            Username:{" "}
            <span className="font-medium text-slate-200">
              {displayUsername}
            </span>
          </div>
        </div>
      </header>

      {/* Step 1: 設定 username */}
      {!username && (
        <div className="border border-slate-700 rounded-xl p-4 bg-slate-900/70 shadow-inner shadow-slate-900/80 mb-2">
          <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 text-sky-300 text-xs font-bold">
              1
            </span>
            請先設定你的暱稱
          </h2>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-slate-900 border border-slate-700 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-500/60"
              placeholder="例如：Hikari..."
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
            />
            <button
              onClick={handleSetUsername}
              className="px-4 py-2 text-sm rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-sm shadow-sky-900/60 transition-colors"
            >
              Confirm
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            You need a username before creating or joining rooms.
          </p>
        </div>
      )}

      <div className="flex gap-4">
        {/* Left: 房間列表 + 建房 */}
        {!currentRoom?.id && username && (
          <>
            <section className="border border-slate-700 rounded-xl p-4 bg-slate-900/60 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-sky-400 to-violet-400" />
                  建立房間
                </h2>
              </div>

              <div className="space-y-3">
                {/* 建房區塊 */}
                <div className="flex gap-2">
                  <input
                    className="flex-1 px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/60 disabled:opacity-50"
                    placeholder="房間名稱，如：Quiz Room #1"
                    value={roomNameInput}
                    onChange={(e) => setRoomNameInput(e.target.value)}
                    disabled={!username}
                  />
                  <button
                    onClick={handleCreateRoom}
                    disabled={!username}
                    className="px-4 py-2 text-sm rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-sm shadow-emerald-900/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    建立房間
                  </button>
                </div>
              </div>
            </section>

            <div className="mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/70 divide-y divide-slate-800">
              {rooms.length === 0 ? (
                <div className="p-4 text-xs text-slate-500 text-center">
                  目前沒有房間，試著建立一個吧。
                </div>
              ) : (
                rooms.map((room) => {
                  const isCurrent = currentRoom?.id === room.id;
                  return (
                    <div
                      key={room.id}
                      className={`px-3 py-2.5 flex items-center justify-between text-sm transition-colors ${
                        isCurrent
                          ? "bg-slate-900/90 border-l-2 border-l-sky-400"
                          : "hover:bg-slate-900/70"
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-100 flex items-center gap-2">
                          {room.name}
                          {isCurrent && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 border border-sky-500/40">
                              Current
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Players: {room.playerCount} ·{" "}
                          {new Date(room.createdAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={!username}
                        className="px-3 py-1.5 text-xs rounded-lg bg-sky-500 hover:bg-sky-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        加入
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Right: 房間內聊天 + 成員 + 離開房間 */}
        {currentRoom?.id && (
          <section className=" flex flex-col w-full border border-slate-700 rounded-xl p-4 bg-slate-900/60 backdrop-blur-sm min-h-[320px]">
            <div className="flex items-center justify-between mb-3 ">
              <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <span className="h-1.5 w-6 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" />
                房間聊天
                {currentRoom ? (
                  <span className="ml-2 text-xs text-slate-400">
                    – {currentRoom.name}
                  </span>
                ) : null}
              </h2>

              {currentRoom && (
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {participants.length} player
                    {participants.length !== 1 ? "s" : ""}
                  </span>
                  <button
                    onClick={handleLeaveRoom}
                    className="px-2.5 py-1 rounded-lg border border-slate-600 text-slate-200 hover:bg-slate-800 text-[11px] font-medium"
                  >
                    離開房間
                  </button>
                </div>
              )}
            </div>

            {/* 成員列表 */}
            <div className="mb-2 text-xs text-slate-300 flex items-start gap-1">
              <span className="font-semibold mt-[2px]">成員：</span>
              <div className="flex-1">
                {participants.length === 0 ? (
                  <span className="text-slate-500">（目前沒有成員）</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {participants.map((p) => {
                      const isSelf = p.username === username;
                      return (
                        <span
                          key={p.socketId}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 border text-[11px] ${
                            isSelf
                              ? "bg-sky-500/15 border-sky-400/60 text-sky-200"
                              : "bg-slate-800/60 border-slate-600 text-slate-200"
                          }`}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                          {p.username}
                          {isSelf && <span className="opacity-80">（你）</span>}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* 聊天訊息列表 */}
            <div className="flex-1 rounded-lg border border-slate-800 bg-slate-950/70 p-3 mb-3 overflow-y-auto space-y-2">
              {messages.length === 0 ? (
                <div className="text-xs text-slate-500 text-center">
                  目前沒有訊息，送出第一則訊息吧。
                </div>
              ) : (
                messages.map((msg) => {
                  const isSelf = msg.username === username;
                  return (
                    <div
                      key={msg.id}
                      className={`flex text-xs ${
                        isSelf ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                          isSelf
                            ? "bg-sky-700 text-slate-50 rounded-br-sm"
                            : "bg-slate-700 text-slate-100 rounded-bl-sm"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-0.5">
                          <span className="font-semibold text-[11px]">
                            {msg.username}
                            {isSelf && "（你）"}
                          </span>
                          <span className="text-[10px] opacity-70">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        <div className="text-[12px] leading-snug text-left">
                          {msg.content}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 輸入區 */}
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 text-sm rounded-lg bg-slate-950 border border-slate-700 outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400/60"
                placeholder="輸入訊息後按 Enter 或按下 Send"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <button
                onClick={handleSendMessage}
                className="px-4 py-2 text-sm rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-sm shadow-sky-900/60"
              >
                Send
              </button>
            </div>
          </section>
        )}
      </div>

      {statusText && (
        <div className="text-xs text-slate-400 mt-1">Status: {statusText}</div>
      )}
    </div>
  );
};

export default RoomChatPage;
