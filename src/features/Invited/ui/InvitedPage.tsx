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
  invalidInviteLink: "\u7121\u6548\u7684\u9080\u8acb\u9023\u7d50",
  checkingInviteRoom:
    "\u6b63\u5728\u6aa2\u67e5\u9080\u8acb\u623f\u9593\u662f\u5426\u5b58\u5728...",
  inviteRoomMissing:
    "\u53d7\u9080\u623f\u9593\u4e0d\u5b58\u5728\u6216\u5df2\u95dc\u9589",
  inviteKicker: "\u623f\u9593\u9080\u8acb",
  inviteTitlePrefix: "\u4f60\u53d7\u9080\u52a0\u5165",
  roomInfo: "\u623f\u9593\u8cc7\u8a0a",
  players: "\u73a9\u5bb6\u4eba\u6578",
  playlist: "\u984c\u5eab\u6b4c\u66f2",
  questions: "\u51fa\u984c\u6578",
  visibility: "\u623f\u9593\u72c0\u614b",
  needPassword: "\u9700\u8981\u5bc6\u78bc",
  publicRoom: "\u516c\u958b\u623f\u9593",
  identityKicker: "\u9032\u5165\u8a2d\u5b9a",
  identityTitle: "\u9078\u64c7\u8eab\u4efd\u5373\u53ef\u5165\u5834",
  identityDesc:
    "\u4f60\u53ef\u4ee5\u4f7f\u7528\u8a2a\u5ba2\u66b1\u7a31\u5feb\u901f\u52a0\u5165\uff0c\u6216\u4f7f\u7528 Google \u767b\u5165\u53d6\u5f97\u5b8c\u6574\u529f\u80fd\u3002",
  guestLabel: "\u8a2a\u5ba2\u66b1\u7a31",
  guestPlaceholder: "\u4f8b\u5982\uff1aNight DJ",
  guestAction: "\u4ee5\u8a2a\u5ba2\u8eab\u4efd\u7e7c\u7e8c",
  or: "\u6216",
  googleAction: "\u4f7f\u7528 Google \u767b\u5165",
  joinNow: "\u76f4\u63a5\u52a0\u5165\u623f\u9593",
  currentIdentity: "\u76ee\u524d\u8eab\u4efd",
  passwordLabel: "\u623f\u9593\u5bc6\u78bc",
  passwordPlaceholder: "\u8f38\u5165\u623f\u9593\u5bc6\u78bc",
  battleReady: "\u6230\u5c40\u6e96\u5099\u4e2d",
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
