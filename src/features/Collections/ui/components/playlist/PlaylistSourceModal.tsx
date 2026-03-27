import { Dialog, DialogContent, DialogTitle } from "@mui/material";

type SourceMode = "playlist" | "single";

type PlaylistSourceModalProps = {
  open: boolean;
  mode: SourceMode;
  onClose: () => void;
  onModeChange: (mode: SourceMode) => void;
  playlistUrl: string;
  onChangePlaylistUrl: (value: string) => void;
  onImportPlaylist: () => void;
  playlistLoading: boolean;
  playlistError: string | null;
  playlistAddError: string | null;
  singleTrackUrl: string;
  singleTrackTitle: string;
  singleTrackAnswer: string;
  singleTrackError: string | null;
  singleTrackLoading: boolean;
  isDuplicate: boolean;
  canEditSingleMeta: boolean;
  onSingleTrackUrlChange: (value: string) => void;
  onSingleTrackTitleChange: (value: string) => void;
  onSingleTrackAnswerChange: (value: string) => void;
  onAddSingle: () => void;
};

const tabButtonClass = (active: boolean) =>
  `rounded-full border px-3 py-1.5 text-xs transition-colors ${
    active
      ? "border-[var(--mc-accent)]/70 bg-[var(--mc-accent)]/18 text-[var(--mc-text)]"
      : "border-[var(--mc-border)] bg-[var(--mc-surface)]/55 text-[var(--mc-text-muted)] hover:text-[var(--mc-text)]"
  }`;

const PlaylistSourceModal = ({
  open,
  mode,
  onClose,
  onModeChange,
  playlistUrl,
  onChangePlaylistUrl,
  onImportPlaylist,
  playlistLoading,
  playlistError,
  playlistAddError,
  singleTrackUrl,
  singleTrackTitle,
  singleTrackAnswer,
  singleTrackError,
  singleTrackLoading,
  isDuplicate,
  canEditSingleMeta,
  onSingleTrackUrlChange,
  onSingleTrackTitleChange,
  onSingleTrackAnswerChange,
  onAddSingle,
}: PlaylistSourceModalProps) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        className:
          "!rounded-3xl !border !border-[var(--mc-border)] !bg-[#08111f] !text-[var(--mc-text)]",
      }}
    >
      <DialogTitle className="!px-6 !pt-6 !pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--mc-text-muted)]">
              Source Manager
            </div>
            <div className="mt-1 text-xl font-semibold text-[var(--mc-text)]">
              新增題目來源
            </div>
            <div className="mt-1 text-sm text-[var(--mc-text-muted)]">
              用播放清單整批匯入，或補一首單曲進收藏庫。
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-[var(--mc-border)] px-3 py-1 text-xs text-[var(--mc-text-muted)] hover:text-[var(--mc-text)]"
          >
            關閉
          </button>
        </div>
      </DialogTitle>

      <DialogContent className="!px-6 !pb-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onModeChange("playlist")}
            className={tabButtonClass(mode === "playlist")}
          >
            播放清單匯入
          </button>
          <button
            type="button"
            onClick={() => onModeChange("single")}
            className={tabButtonClass(mode === "single")}
          >
            單曲插入
          </button>
        </div>

        {mode === "playlist" ? (
          <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/40 p-4">
            <div className="text-[11px] text-[var(--mc-text-muted)]">
              貼上 YouTube 播放清單網址，會把可用影片匯入目前收藏庫。
            </div>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={playlistUrl}
                onChange={(e) => onChangePlaylistUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  onImportPlaylist();
                }}
                placeholder="貼上 YouTube 播放清單網址"
                className="min-w-0 flex-1 rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)] px-3 py-2 text-sm text-[var(--mc-text)]"
              />
              <button
                type="button"
                onClick={onImportPlaylist}
                disabled={playlistLoading}
                className="rounded-xl bg-[var(--mc-accent)] px-4 py-2 text-sm font-semibold text-[#1a1207] hover:bg-[var(--mc-accent-2)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {playlistLoading ? "載入中..." : "匯入播放清單"}
              </button>
            </div>
            {playlistAddError && (
              <div className="mt-3 text-sm text-rose-300">
                {playlistAddError}
              </div>
            )}
            {playlistError && (
              <div className="mt-2 text-sm text-rose-300">{playlistError}</div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/40 p-4">
            <div className="text-[11px] text-[var(--mc-text-muted)]">
              貼上 YouTube 連結後可補充單首題目，並手動調整標題與答案。
            </div>
            <div className="mt-3 space-y-3">
              <div className="relative">
                <input
                  value={singleTrackUrl}
                  onChange={(event) => onSingleTrackUrlChange(event.target.value)}
                  placeholder="YouTube link"
                  aria-invalid={isDuplicate}
                  className={`w-full rounded-xl border bg-[var(--mc-surface-strong)] px-3 py-2 text-sm text-[var(--mc-text)] transition-colors ${
                    isDuplicate
                      ? "border-rose-400/70 text-rose-100 placeholder:text-rose-200/70"
                      : "border-[var(--mc-border)]"
                  }`}
                />
                {isDuplicate && (
                  <div className="absolute left-0 top-full z-20 mt-1 rounded-md border border-rose-400/40 bg-rose-950/90 px-2 py-1 text-[10px] text-rose-100 shadow">
                    This video is already in the list.
                  </div>
                )}
              </div>
              <input
                value={singleTrackTitle}
                onChange={(event) => onSingleTrackTitleChange(event.target.value)}
                placeholder="Track title"
                disabled={!canEditSingleMeta}
                className="w-full rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)] px-3 py-2 text-sm text-[var(--mc-text)] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <input
                value={singleTrackAnswer}
                onChange={(event) =>
                  onSingleTrackAnswerChange(event.target.value)
                }
                placeholder="Answer"
                disabled={!canEditSingleMeta}
                className="w-full rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)] px-3 py-2 text-sm text-[var(--mc-text)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
            {singleTrackError && (
              <div className="mt-3 text-sm text-rose-300">
                {singleTrackError}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="text-[11px] text-[var(--mc-text-muted)]">
                {singleTrackLoading ? "正在解析影片資料..." : "準備好後可直接插入清單。"}
              </div>
              <button
                type="button"
                onClick={onAddSingle}
                disabled={isDuplicate}
                className="rounded-xl bg-[var(--mc-accent)] px-4 py-2 text-sm font-semibold text-[#1a1207] hover:bg-[var(--mc-accent-2)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                插入單曲
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlaylistSourceModal;
