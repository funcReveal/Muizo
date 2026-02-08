import React from "react";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { PlaylistItem, RoomSummary } from "../../model/types";
import QuestionCountControls from "./QuestionCountControls";
import RoomAccessSettingsFields from "./RoomAccessSettingsFields";

interface RoomCreationSectionProps {
  roomName: string;
  roomVisibility: "public" | "private";
  roomPassword: string;
  playlistUrl: string;
  playlistItems: PlaylistItem[];
  playlistLoading: boolean;
  playlistError: string | null;
  playlistStage: "input" | "preview";
  playlistLocked: boolean;
  rooms: RoomSummary[];
  username: string | null;
  currentRoomId: string | null;
  joinPassword: string;
  playlistProgress: { received: number; total: number; ready: boolean };
  questionCount: number;
  onQuestionCountChange: (value: number) => void;
  questionMin?: number;
  questionMax?: number;
  questionStep?: number;
  questionControlsEnabled?: boolean;
  questionLimitLabel?: string;
  showRoomList?: boolean;
  youtubePlaylists?: { id: string; title: string; itemCount: number }[];
  youtubePlaylistsLoading?: boolean;
  youtubePlaylistsError?: string | null;
  collections?: Array<{
    id: string;
    title: string;
    description?: string | null;
    visibility?: "private" | "public";
  }>;
  collectionsLoading?: boolean;
  collectionsError?: string | null;
  selectedCollectionId?: string | null;
  collectionItemsLoading?: boolean;
  collectionItemsError?: string | null;
  isGoogleAuthed?: boolean;
  onGoogleLogin?: () => void;
  onRoomNameChange: (value: string) => void;
  onRoomVisibilityChange: (value: "public" | "private") => void;
  onRoomPasswordChange: (value: string) => void;
  onJoinPasswordChange: (value: string) => void;
  onPlaylistUrlChange: (value: string) => void;
  onFetchPlaylist: () => void;
  onResetPlaylist: () => void;
  onFetchYoutubePlaylists?: () => void;
  onImportYoutubePlaylist?: (playlistId: string) => void;
  onFetchCollections?: (scope?: "owner" | "public") => void;
  onSelectCollection?: (collectionId: string | null) => void;
  onLoadCollectionItems?: (
    collectionId: string,
    options?: { readToken?: string | null },
  ) => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string, hasPassword: boolean) => void;
}

type PlaylistSourceMode =
  | "link"
  | "youtube"
  | "publicCollection"
  | "privateCollection";

const RoomCreationSection: React.FC<RoomCreationSectionProps> = (props) => {
  const {
    roomName,
    roomVisibility,
    roomPassword,
    playlistUrl,
    playlistItems,
    playlistLoading,
    playlistError,
    playlistLocked,
    username,
    playlistProgress,
    questionCount,
    onQuestionCountChange,
    questionMin = 1,
    questionMax = 100,
    questionStep = 5,
    questionControlsEnabled = true,
    questionLimitLabel,
    youtubePlaylists = [],
    youtubePlaylistsLoading = false,
    youtubePlaylistsError = null,
    collections = [],
    collectionsLoading = false,
    collectionsError = null,
    selectedCollectionId = null,
    collectionItemsLoading = false,
    collectionItemsError = null,
    isGoogleAuthed = false,
    onGoogleLogin,
    onRoomNameChange,
    onRoomVisibilityChange,
    onRoomPasswordChange,
    onPlaylistUrlChange,
    onFetchPlaylist,
    onResetPlaylist,
    onFetchYoutubePlaylists,
    onImportYoutubePlaylist,
    onFetchCollections,
    onSelectCollection,
    onLoadCollectionItems,
    onCreateRoom,
  } = props;

  const [sourceMode, setSourceMode] = React.useState<PlaylistSourceMode>("link");
  const [selectedYoutubeId, setSelectedYoutubeId] = React.useState("");

  const hasFetchedYoutubeRef = React.useRef(false);
  const hasFetchedCollectionsRef = React.useRef<{ public: boolean; owner: boolean }>(
    {
      public: false,
      owner: false,
    },
  );

  const canCreateRoom = Boolean(username && roomName.trim() && playlistItems.length > 0);
  const previewItems = React.useMemo(() => playlistItems.slice(0, 80), [playlistItems]);

  React.useEffect(() => {
    if (!selectedYoutubeId && youtubePlaylists.length > 0) {
      setSelectedYoutubeId(youtubePlaylists[0].id);
    }
  }, [selectedYoutubeId, youtubePlaylists]);

  React.useEffect(() => {
    if (sourceMode !== "youtube") return;
    if (!isGoogleAuthed || !onFetchYoutubePlaylists) return;
    if (hasFetchedYoutubeRef.current) return;
    hasFetchedYoutubeRef.current = true;
    void onFetchYoutubePlaylists();
  }, [isGoogleAuthed, onFetchYoutubePlaylists, sourceMode]);

  React.useEffect(() => {
    if (!onFetchCollections) return;
    if (sourceMode === "publicCollection" && !hasFetchedCollectionsRef.current.public) {
      hasFetchedCollectionsRef.current.public = true;
      void onFetchCollections("public");
    }
    if (
      sourceMode === "privateCollection" &&
      isGoogleAuthed &&
      !hasFetchedCollectionsRef.current.owner
    ) {
      hasFetchedCollectionsRef.current.owner = true;
      void onFetchCollections("owner");
    }
  }, [isGoogleAuthed, onFetchCollections, sourceMode]);

  const sourceStatus = React.useMemo(() => {
    if (sourceMode === "link") {
      if (playlistLoading) return "正在載入播放清單...";
      if (playlistError) return playlistError;
      if (playlistItems.length > 0) return `已載入 ${playlistItems.length} 首歌曲`;
      return "貼上 YouTube 播放清單連結後，按「載入清單」。";
    }

    if (sourceMode === "youtube") {
      if (!isGoogleAuthed) return "請先登入 Google，才能讀取你的播放清單。";
      if (youtubePlaylistsLoading) return "正在讀取你的 YouTube 播放清單...";
      if (youtubePlaylistsError) return youtubePlaylistsError;
      if (youtubePlaylists.length === 0) return "尚未找到可用的 YouTube 播放清單。";
      return `已找到 ${youtubePlaylists.length} 個 YouTube 播放清單`;
    }

    if (sourceMode === "privateCollection" && !isGoogleAuthed) {
      return "私人收藏庫需要先登入 Google。";
    }
    if (collectionItemsLoading) return "正在載入收藏內容...";
    if (collectionsLoading) return "正在讀取收藏庫清單...";
    if (collectionItemsError) return collectionItemsError;
    if (collectionsError) return collectionsError;
    if (collections.length === 0) return "目前沒有可用收藏庫。";
    if (selectedCollectionId) return "已選擇收藏庫，按「載入收藏」即可套用。";
    return "請先選擇一個收藏庫。";
  }, [
    collectionItemsError,
    collectionItemsLoading,
    collections.length,
    collectionsError,
    collectionsLoading,
    isGoogleAuthed,
    playlistError,
    playlistItems.length,
    playlistLoading,
    selectedCollectionId,
    sourceMode,
    youtubePlaylists.length,
    youtubePlaylistsError,
    youtubePlaylistsLoading,
  ]);

  const sourceStatusTone: "error" | "info" =
    (sourceMode === "link" && Boolean(playlistError)) ||
    (sourceMode === "youtube" && Boolean(youtubePlaylistsError)) ||
    ((sourceMode === "publicCollection" || sourceMode === "privateCollection") &&
      Boolean(collectionItemsError || collectionsError))
      ? "error"
      : "info";

  const handleApplyYoutube = () => {
    if (!selectedYoutubeId || !onImportYoutubePlaylist) return;
    void onImportYoutubePlaylist(selectedYoutubeId);
  };

  const handleApplyCollection = () => {
    if (!selectedCollectionId || !onLoadCollectionItems) return;
    void onLoadCollectionItems(selectedCollectionId);
  };

  const refreshYouTube = () => {
    if (!onFetchYoutubePlaylists) return;
    hasFetchedYoutubeRef.current = true;
    void onFetchYoutubePlaylists();
  };

  const refreshCollections = (scope: "public" | "owner") => {
    if (!onFetchCollections) return;
    hasFetchedCollectionsRef.current[scope] = true;
    void onFetchCollections(scope);
  };

  return (
    <Stack spacing={2.5}>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="room-create-step-card">
          <div className="room-create-step-head">
            <div>
              <span className="room-create-step-index">STEP 01</span>
              <Typography variant="h5" className="room-create-step-title">
                基本設定
              </Typography>
              <Typography variant="body2" className="room-create-muted">
                設定房間名稱、權限與題數。
              </Typography>
            </div>
            <Chip
              size="small"
              className="room-create-visibility-chip"
              label={roomVisibility === "private" ? "私人" : "公開"}
            />
          </div>

          <TextField
            size="small"
            label="房間名稱"
            value={roomName}
            onChange={(event) => onRoomNameChange(event.target.value)}
            placeholder="例如：阿哲的房間"
            fullWidth
            className="room-create-field"
          />

          <RoomAccessSettingsFields
            visibility={roomVisibility}
            password={roomPassword}
            onVisibilityChange={onRoomVisibilityChange}
            onPasswordChange={onRoomPasswordChange}
            onPasswordClear={() => onRoomPasswordChange("")}
            allowPasswordWhenPublic={false}
            showClearButton={Boolean(roomPassword)}
          />

          <div className="room-create-question-card">
            <div className="room-create-question-head">
              <Typography variant="subtitle1" className="room-create-step-title">
                題數設定
              </Typography>
              <span className="room-create-question-badge">目前 {questionCount} 題</span>
            </div>
            <QuestionCountControls
              value={questionCount}
              min={questionMin}
              max={questionMax}
              step={questionStep}
              disabled={!questionControlsEnabled}
              compact
              onChange={onQuestionCountChange}
            />
            {questionLimitLabel && (
              <Typography variant="caption" className="room-create-muted">
                {questionLimitLabel}
              </Typography>
            )}
          </div>
        </div>

        <div className="room-create-step-card">
          <div className="room-create-step-head">
            <div>
              <span className="room-create-step-index">STEP 02</span>
              <Typography variant="h5" className="room-create-step-title">
                播放清單
              </Typography>
              <Typography variant="body2" className="room-create-muted">
                選擇來源並載入歌曲，清單會固定在預覽區，不再把畫面往下推。
              </Typography>
            </div>
            {playlistLocked && <Chip size="small" color="success" label="已鎖定" />}
          </div>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant={sourceMode === "link" ? "contained" : "outlined"}
              onClick={() => setSourceMode("link")}
            >
              貼上連結
            </Button>
            <Button
              size="small"
              variant={sourceMode === "youtube" ? "contained" : "outlined"}
              onClick={() => setSourceMode("youtube")}
            >
              我的播放清單
            </Button>
            <Button
              size="small"
              variant={sourceMode === "publicCollection" ? "contained" : "outlined"}
              onClick={() => setSourceMode("publicCollection")}
            >
              公開收藏庫
            </Button>
            <Button
              size="small"
              variant={sourceMode === "privateCollection" ? "contained" : "outlined"}
              onClick={() => setSourceMode("privateCollection")}
            >
              私人收藏庫
            </Button>
          </Stack>

          {sourceMode === "link" && (
            <Stack spacing={1.25}>
              {playlistLocked && (
                <Alert
                  severity="info"
                  action={
                    <Button size="small" color="inherit" onClick={onResetPlaylist}>
                      重選來源
                    </Button>
                  }
                >
                  播放清單已鎖定。如要更換來源，請先按「重選來源」。
                </Alert>
              )}
              <Stack direction="row" spacing={1.25} alignItems="center">
                <TextField
                  size="small"
                  fullWidth
                  label="YouTube 播放清單網址"
                  value={playlistUrl}
                  onChange={(event) => onPlaylistUrlChange(event.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=..."
                  disabled={playlistLocked}
                />
                <Button
                  variant="contained"
                  onClick={onFetchPlaylist}
                  disabled={playlistLoading || playlistLocked || !playlistUrl.trim()}
                >
                  載入清單
                </Button>
              </Stack>
            </Stack>
          )}

          {sourceMode === "youtube" && (
            <Stack spacing={1.25}>
              {!isGoogleAuthed ? (
                <Button variant="outlined" onClick={onGoogleLogin}>
                  登入 Google
                </Button>
              ) : (
                <>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Button variant="outlined" onClick={refreshYouTube}>
                      重新整理
                    </Button>
                    {youtubePlaylistsLoading && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={14} />
                        <Typography variant="caption" className="room-create-muted">
                          讀取中
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                    <FormControl size="small" fullWidth>
                      <InputLabel id="room-create-youtube-playlist">選擇播放清單</InputLabel>
                      <Select
                        labelId="room-create-youtube-playlist"
                        label="選擇播放清單"
                        value={selectedYoutubeId}
                        onChange={(event) => setSelectedYoutubeId(String(event.target.value))}
                      >
                        {youtubePlaylists.map((playlist) => (
                          <MenuItem key={playlist.id} value={playlist.id}>
                            {playlist.title} ({playlist.itemCount})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Button
                      variant="contained"
                      onClick={handleApplyYoutube}
                      disabled={!selectedYoutubeId || playlistLoading}
                    >
                      載入我的清單
                    </Button>
                  </Stack>
                </>
              )}
            </Stack>
          )}

          {(sourceMode === "publicCollection" || sourceMode === "privateCollection") && (
            <Stack spacing={1.25}>
              {sourceMode === "privateCollection" && !isGoogleAuthed ? (
                <Button variant="outlined" onClick={onGoogleLogin}>
                  登入 Google
                </Button>
              ) : (
                <>
                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Button
                      variant="outlined"
                      onClick={() =>
                        refreshCollections(sourceMode === "privateCollection" ? "owner" : "public")
                      }
                    >
                      重新整理收藏庫
                    </Button>
                    {collectionsLoading && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={14} />
                        <Typography variant="caption" className="room-create-muted">
                          讀取中
                        </Typography>
                      </Stack>
                    )}
                  </Stack>

                  <div className="room-create-collection-list">
                    {collections.length === 0 ? (
                      <Typography variant="body2" className="room-create-muted">
                        目前沒有可用收藏庫。
                      </Typography>
                    ) : (
                      collections.map((item) => {
                        const selected = selectedCollectionId === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`room-create-collection-item${selected ? " is-selected" : ""}`}
                            onClick={() => onSelectCollection?.(item.id)}
                          >
                            <span className="title">{item.title}</span>
                            <span className="meta">
                              {item.visibility === "private" ? "私人" : "公開"}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <Button
                    variant="contained"
                    onClick={handleApplyCollection}
                    disabled={!selectedCollectionId || playlistLoading || collectionItemsLoading}
                  >
                    載入收藏
                  </Button>
                </>
              )}
            </Stack>
          )}

          <Alert severity={sourceStatusTone}>{sourceStatus}</Alert>

          {playlistLoading && playlistProgress.total > 0 && (
            <Stack spacing={0.75}>
              <LinearProgress
                variant="determinate"
                value={Math.min(
                  100,
                  Math.round((playlistProgress.received / playlistProgress.total) * 100),
                )}
              />
              <Typography variant="caption" className="room-create-muted">
                已接收 {playlistProgress.received} / {playlistProgress.total}
              </Typography>
            </Stack>
          )}

          <Divider />

          <Stack spacing={1} className="room-create-preview-wrap">
            <Typography variant="subtitle1" className="room-create-step-title">
              歌曲預覽
            </Typography>
            {playlistItems.length === 0 ? (
              <div className="room-create-preview-empty">尚未載入歌曲</div>
            ) : (
              <>
                <div className="room-create-preview-list">
                  {previewItems.map((item, index) => (
                    <div key={`${item.url}-${index}`} className="room-create-preview-item">
                      <img
                        src={item.thumbnail || "https://via.placeholder.com/96x54?text=Music"}
                        alt={item.title}
                        className="room-create-preview-thumb"
                        loading="lazy"
                      />
                      <div className="room-create-preview-text">
                        <div className="title">{item.title}</div>
                        <div className="meta">
                          {item.uploader || "未知上傳者"}
                          {item.duration ? ` · ${item.duration}` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {playlistItems.length > previewItems.length && (
                  <Typography variant="caption" className="room-create-muted">
                    已顯示前 {previewItems.length} 首，完整清單可在房間內查看。
                  </Typography>
                )}
              </>
            )}
          </Stack>
        </div>
      </div>

      <Button
        variant="contained"
        size="large"
        onClick={onCreateRoom}
        disabled={!canCreateRoom || playlistLoading}
        className="room-create-submit"
      >
        建立房間
      </Button>
    </Stack>
  );
};

export default RoomCreationSection;
