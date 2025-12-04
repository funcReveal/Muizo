import React from "react";
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { PlaylistItem } from "../types";

interface CreateRoomDialogProps {
  open: boolean;
  onClose: () => void;
  roomName: string;
  roomPassword: string;
  questionCount: number;
  playlistUrl: string;
  playlistItems: PlaylistItem[];
  playlistError: string | null;
  playlistLoading: boolean;
  playlistStage: "input" | "preview";
  playlistLocked: boolean;
  onRoomNameChange: (value: string) => void;
  onRoomPasswordChange: (value: string) => void;
  onQuestionCountChange: (value: number) => void;
  onPlaylistUrlChange: (value: string) => void;
  onFetchPlaylist: () => void;
  onResetPlaylist: () => void;
  onCreateRoom: () => void;
}

const CreateRoomDialog: React.FC<CreateRoomDialogProps> = ({
  open,
  onClose,
  roomName,
  roomPassword,
  questionCount,
  playlistUrl,
  playlistItems,
  playlistError,
  playlistLoading,
  // playlistStage,
  playlistLocked,
  onRoomNameChange,
  onRoomPasswordChange,
  onQuestionCountChange,
  onPlaylistUrlChange,
  onFetchPlaylist,
  onResetPlaylist,
  onCreateRoom,
}) => {
  const canCreate = Boolean(roomName.trim() && playlistItems.length > 0);
  // const showPlaylistInput = playlistStage === "input";

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>建立房間</DialogTitle>
      <DialogContent dividers className="space-y-3">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            label="房間名稱"
            value={roomName}
            onChange={(e) => onRoomNameChange(e.target.value)}
          />
          <TextField
            size="small"
            label="密碼（選填）"
            value={roomPassword}
            onChange={(e) => onRoomPasswordChange(e.target.value)}
          />
          <TextField
            size="small"
            label="題數"
            type="number"
            inputProps={{ min: 1, max: 50 }}
            value={questionCount}
            onChange={(e) => onQuestionCountChange(Number(e.target.value) || 0)}
          />
        </Stack>

        <Divider sx={{ mb: "20px" }} />

        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              fullWidth
              size="small"
              label="YouTube 播放清單網址"
              placeholder="https://www.youtube.com/playlist?list=..."
              value={playlistUrl}
              onChange={(e) => onPlaylistUrlChange(e.target.value)}
              disabled={playlistLoading || playlistLocked}
            />
            <Button
              variant="contained"
              onClick={onFetchPlaylist}
              disabled={!playlistUrl || playlistLoading || playlistLocked}
            >
              {playlistLoading ? "載入中..." : "載入清單"}
            </Button>
            {playlistLocked && (
              <Button variant="outlined" onClick={onResetPlaylist}>
                重選清單
              </Button>
            )}
          </Stack>
          {playlistLoading && <LinearProgress />}
          {playlistError && (
            <Typography variant="body2" color="error">
              {playlistError}
            </Typography>
          )}
          {playlistItems.length > 0 && (
            <div className="space-y-1 text-xs text-slate-300">
              <Typography variant="subtitle2">
                已載入 {playlistItems.length} 首歌曲
              </Typography>
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-200/10 rounded border border-slate-200/10 bg-slate-900/40">
                {playlistItems.map((item, idx) => (
                  <div
                    key={`${item.title}-${idx}`}
                    className="px-3 py-2 flex items-center justify-between gap-2"
                  >
                    <div className="text-left">
                      <p className="text-slate-100">{item.title}</p>
                      <p className="text-[11px] text-slate-400">
                        {item.uploader ?? "Unknown"}
                        {item.duration ? ` · ${item.duration}` : ""}
                      </p>
                    </div>
                    <Chip size="small" label={idx + 1} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          取消
        </Button>
        <Button
          variant="contained"
          onClick={onCreateRoom}
          disabled={!canCreate}
        >
          建立房間
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateRoomDialog;
