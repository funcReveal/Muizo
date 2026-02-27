import { Alert, Box, Button, TextField } from "@mui/material";
import {
  Groups2Rounded,
  LibraryMusicRounded,
  LockRounded,
  MusicNoteRounded,
  PublicRounded,
} from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { USERNAME_MAX } from "../../Room/model/roomConstants";
import type { RoomSummary } from "../../Room/model/types";
import { useRoom } from "../../Room/model/useRoom";

const TEXT = {
  invalidInviteLink: "無效的邀請連結",
  checkingInviteRoom: "正在檢查邀請房間是否存在...",
  inviteRoomMissing: "受邀房間不存在或已關閉",
  inviteKicker: "房間邀請",
  inviteTitlePrefix: "你受邀加入",
  roomInfo: "房間資訊",
  players: "玩家人數",
  playlist: "題庫歌曲",
  questions: "出題數",
  visibility: "房間狀態",
  needPassword: "需要密碼",
  publicRoom: "公開房間",
  identityKicker: "進入設定",
  identityTitle: "選擇身份即可入場",
  identityDesc:
    "你可以使用訪客暱稱快速加入，或使用 Google 登入取得完整功能。",
  guestLabel: "訪客暱稱",
  guestPlaceholder: "例如：Night DJ",
  guestAction: "以訪客身份繼續",
  or: "或",
  googleAction: "使用 Google 登入",
  joinNow: "直接加入房間",
  currentIdentity: "目前身份",
  passwordLabel: "房間密碼",
  passwordPlaceholder: "輸入房間密碼",
  battleReady: "戰局準備中",
};

const InvitedPage: React.FC = () => {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const {
    authLoading,
    authUser,
    loginWithGoogle,
    username,
    usernameInput,
    rooms,
    currentRoom,
    joinPasswordInput,
    inviteNotFound,
    setUsernameInput,
    setJoinPasswordInput,
    setInviteRoomId,
    fetchRoomById,
    handleJoinRoom,
    handleSetUsername,
  } = useRoom();

  const [inviteRoomApi, setInviteRoomApi] = useState<{
    roomId: string;
    room: RoomSummary | null;
  } | null>(null);

  useEffect(() => {
    setInviteRoomId(roomId ?? null);
    return () => setInviteRoomId(null);
  }, [roomId, setInviteRoomId]);

  useEffect(() => {
    let active = true;
    if (!roomId) return;
    void fetchRoomById(roomId).then((room) => {
      if (!active) return;
      setInviteRoomApi({ roomId, room });
    });
    return () => {
      active = false;
    };
  }, [roomId, fetchRoomById]);

  useEffect(() => {
    if (currentRoom?.id) {
      navigate(`/rooms/${currentRoom.id}`, { replace: true });
    }
  }, [currentRoom?.id, navigate]);

  const inviteRoom = useMemo(() => {
    const apiRoom =
      inviteRoomApi && inviteRoomApi.roomId === roomId
        ? inviteRoomApi.room
        : null;
    if (apiRoom) return apiRoom;
    return roomId ? (rooms.find((room) => room.id === roomId) ?? null) : null;
  }, [inviteRoomApi, roomId, rooms]);

  const hasIdentity = Boolean(username || authUser);
  const isRoomChecking = Boolean(roomId) && inviteRoomApi?.roomId !== roomId;
  const roomMissing =
    Boolean(roomId) && !isRoomChecking && (inviteNotFound || !inviteRoom);
  const identityLabel = authUser?.display_name || username || "Guest";

  if (!roomId) {
    return (
      <div className="flex w-full min-h-[calc(100dvh-210px)] items-start justify-center">
        <Box className="w-full max-w-2xl">
          <Alert severity="error" variant="outlined">
            {TEXT.invalidInviteLink}
          </Alert>
        </Box>
      </div>
    );
  }

  if (isRoomChecking) {
    return (
      <div className="flex w-full min-h-[calc(100dvh-210px)] items-start justify-center">
        <Box className="w-full max-w-2xl">
          <Alert severity="info" variant="outlined">
            {TEXT.checkingInviteRoom}
          </Alert>
        </Box>
      </div>
    );
  }

  if (roomMissing || !inviteRoom) {
    return (
      <div className="flex w-full min-h-[calc(100dvh-210px)] items-start justify-center">
        <Box className="w-full max-w-2xl">
          <Alert severity="error" variant="outlined">
            {TEXT.inviteRoomMissing}
          </Alert>
        </Box>
      </div>
    );
  }

  return (
    <div className="relative flex w-full min-h-[calc(100dvh-210px)] justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0" />
      <div className="grid w-full max-w-6xl items-stretch gap-4 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden rounded-3xl border border-[var(--mc-border)] bg-[linear-gradient(165deg,rgba(245,158,11,0.16),rgba(17,24,39,0.78)_46%,rgba(11,10,8,0.96))] p-6 shadow-[0_24px_90px_-48px_rgba(245,158,11,0.4)]">
          <div className="text-[11px] uppercase tracking-[0.28em] text-[var(--mc-text-muted)]">
            {TEXT.inviteKicker}
          </div>
          <h2 className="mt-2 text-[clamp(1.7rem,3.4vw,2.45rem)] font-semibold leading-tight text-[var(--mc-text)]">
            {TEXT.inviteTitlePrefix}
            <span className="block mt-1 text-[var(--mc-accent)]">
              {inviteRoom.name}
            </span>
          </h2>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] text-emerald-200">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-300" />
            {TEXT.battleReady}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/70 p-3">
              <div className="flex items-center gap-2 text-[var(--mc-text-muted)]">
                <Groups2Rounded sx={{ fontSize: 18 }} />
                <span className="text-xs">{TEXT.players}</span>
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--mc-text)]">
                {inviteRoom.playerCount}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/70 p-3">
              <div className="flex items-center gap-2 text-[var(--mc-text-muted)]">
                <LibraryMusicRounded sx={{ fontSize: 18 }} />
                <span className="text-xs">{TEXT.playlist}</span>
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--mc-text)]">
                {inviteRoom.playlistCount}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/70 p-3">
              <div className="flex items-center gap-2 text-[var(--mc-text-muted)]">
                <MusicNoteRounded sx={{ fontSize: 18 }} />
                <span className="text-xs">{TEXT.questions}</span>
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--mc-text)]">
                {inviteRoom.gameSettings?.questionCount ?? "-"}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/70 p-3">
              <div className="flex items-center gap-2 text-[var(--mc-text-muted)]">
                {inviteRoom.hasPassword ? (
                  <LockRounded sx={{ fontSize: 18 }} />
                ) : (
                  <PublicRounded sx={{ fontSize: 18 }} />
                )}
                <span className="text-xs">{TEXT.visibility}</span>
              </div>
              <div className="mt-2 text-lg font-semibold text-[var(--mc-text)]">
                {inviteRoom.hasPassword ? TEXT.needPassword : TEXT.publicRoom}
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(15,23,42,0.84),rgba(11,10,8,0.92))] p-6 shadow-[0_24px_80px_-52px_rgba(56,189,248,0.45)]">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.2),transparent_64%)]" />
          {!hasIdentity ? (
            <div className="grid gap-3">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--mc-text-muted)]">
                {TEXT.identityKicker}
              </div>
              <h3 className="text-xl font-semibold text-[var(--mc-text)]">
                {TEXT.identityTitle}
              </h3>
              <p className="text-sm text-[var(--mc-text-muted)]">
                {TEXT.identityDesc}
              </p>

              <div className="pt-2 text-[11px] uppercase tracking-[0.2em] text-[var(--mc-text-muted)]">
                {TEXT.guestLabel}
              </div>
              <TextField
                size="small"
                value={usernameInput}
                onChange={(event) =>
                  setUsernameInput(event.target.value.slice(0, USERNAME_MAX))
                }
                placeholder={TEXT.guestPlaceholder}
                inputProps={{ maxLength: USERNAME_MAX }}
              />
              <Button
                variant="outlined"
                onClick={handleSetUsername}
                sx={{
                  borderColor: "rgba(245, 158, 11, 0.4)",
                  color: "var(--mc-text)",
                  "&:hover": {
                    borderColor: "rgba(245, 158, 11, 0.7)",
                    backgroundColor: "rgba(245, 158, 11, 0.08)",
                  },
                }}
              >
                {TEXT.guestAction}
              </Button>
              <div className="text-center text-xs text-[var(--mc-text-muted)]">
                {TEXT.or}
              </div>
              <Button
                variant="contained"
                onClick={loginWithGoogle}
                disabled={authLoading}
                sx={{
                  background:
                    "linear-gradient(90deg, rgba(56,189,248,0.9), rgba(245,158,11,0.9))",
                  color: "#0b0a08",
                  fontWeight: 700,
                  boxShadow: "0 10px 24px rgba(56,189,248,0.25)",
                  "&:hover": {
                    background:
                      "linear-gradient(90deg, rgba(56,189,248,1), rgba(245,158,11,1))",
                  },
                }}
              >
                {TEXT.googleAction}
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              <div className="text-[11px] uppercase tracking-[0.24em] text-[var(--mc-text-muted)]">
                {TEXT.identityKicker}
              </div>
              <h3 className="text-xl font-semibold text-[var(--mc-text)]">
                {TEXT.joinNow}
              </h3>
              <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/65 px-3 py-2 text-sm text-[var(--mc-text)]">
                <span className="mr-2 text-[var(--mc-text-muted)]">
                  {TEXT.currentIdentity}
                </span>
                <span className="font-semibold">{identityLabel}</span>
              </div>
              {inviteRoom.hasPassword && (
                <TextField
                  size="small"
                  value={joinPasswordInput}
                  label={TEXT.passwordLabel}
                  placeholder={TEXT.passwordPlaceholder}
                  onChange={(event) => {
                    const next = event.target.value;
                    if (!/^[a-zA-Z0-9]*$/.test(next)) return;
                    setJoinPasswordInput(next);
                  }}
                  inputProps={{ inputMode: "text", pattern: "[A-Za-z0-9]*" }}
                />
              )}
              <Button
                variant="contained"
                onClick={() =>
                  handleJoinRoom(inviteRoom.id, inviteRoom.hasPassword)
                }
                sx={{
                  background:
                    "linear-gradient(90deg, rgba(245,158,11,0.95), rgba(234,179,8,0.95))",
                  color: "#0b0a08",
                  fontWeight: 700,
                  boxShadow: "0 12px 26px rgba(245,158,11,0.24)",
                  "&:hover": {
                    background:
                      "linear-gradient(90deg, rgba(245,158,11,1), rgba(234,179,8,1))",
                  },
                }}
              >
                {TEXT.joinNow}
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default InvitedPage;
