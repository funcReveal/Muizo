import { Button, Drawer, IconButton, Typography } from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HistoryEduRoundedIcon from "@mui/icons-material/HistoryEduRounded";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";

import {
  getHistorySummaryPlaylistDisplayTitle,
  getHistorySummaryPlaylistSourceLabel,
  getHistorySummaryPlaylistSourceType,
} from "@features/Settlement/model/historySummaryAdapter";
import type {
  RoomSettlementHistorySummary,
  RoomSettlementSnapshot,
} from "@features/RoomSession";
import useAutoHideScrollbar from "@shared/hooks/useAutoHideScrollbar";
import type { LobbySettlementStats } from "./roomLobbyDisplayUtils";

type BattleHistoryStats = LobbySettlementStats & {
  maxCombo: number | null;
};

type RoomBattleHistoryDrawerProps = {
  open: boolean;
  isMobile: boolean;
  summaries: RoomSettlementHistorySummary[];
  latestRoundKey: string | null;
  loadingRoundKey: string | null;
  replayLoadingRoundKey: string | null;
  showInitialLoading: boolean;
  hasMore: boolean;
  loadingMore: boolean;
  snapshotsByRoundKey: Record<string, RoomSettlementSnapshot>;
  statsByRoundKey: Record<string, BattleHistoryStats | undefined>;
  onClose: () => void;
  onLoadMore: () => void;
  onOpenReplay: (summary: RoomSettlementHistorySummary) => void;
  onOpenSettlement: (roundKey: string) => void;
};

const getFirstHistoryPlaylistItem = (
  snapshot: RoomSettlementSnapshot | null | undefined,
) => {
  const items = snapshot?.playlistItems ?? snapshot?.room.playlist.items ?? [];
  return items.find((item) => item.thumbnail) ?? items[0] ?? null;
};

const resolveHistoryPlaylistArtwork = (
  summary: RoomSettlementHistorySummary,
  snapshot: RoomSettlementSnapshot | null | undefined,
) => {
  const sourceType = getHistorySummaryPlaylistSourceType(summary);
  const firstItem = getFirstHistoryPlaylistItem(snapshot);
  const shouldUseFirstTrackCover =
    sourceType === "youtube_pasted_link" ||
    sourceType === "youtube_google_import";
  const roomCoverSourceId = snapshot?.room.playlistCoverSourceId?.trim();
  const roomCover =
    snapshot?.room.playlistCoverThumbnailUrl ??
    (roomCoverSourceId
      ? `https://i.ytimg.com/vi/${roomCoverSourceId}/hqdefault.jpg`
      : null);
  const thumbnail = shouldUseFirstTrackCover
    ? firstItem?.thumbnail ?? roomCover
    : roomCover ?? firstItem?.thumbnail ?? null;
  const coverTitle =
    (shouldUseFirstTrackCover
      ? firstItem?.title
      : snapshot?.room.playlistCoverTitle) ??
    firstItem?.title ??
    getHistorySummaryPlaylistDisplayTitle(summary);

  return {
    title: getHistorySummaryPlaylistDisplayTitle(summary),
    coverTitle,
    thumbnail,
    sourceLabel: getHistorySummaryPlaylistSourceLabel(summary),
  };
};

const formatHistoryEndedAt = (timestamp: number) =>
  new Date(timestamp).toLocaleString("zh-TW", { hour12: false });

export default function RoomBattleHistoryDrawer({
  open,
  isMobile,
  summaries,
  latestRoundKey,
  loadingRoundKey,
  replayLoadingRoundKey,
  showInitialLoading,
  hasMore,
  loadingMore,
  snapshotsByRoundKey,
  statsByRoundKey,
  onClose,
  onLoadMore,
  onOpenReplay,
  onOpenSettlement,
}: RoomBattleHistoryDrawerProps) {
  const historyListRef = useAutoHideScrollbar<HTMLDivElement>();

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      PaperProps={{
        className: "room-battle-history-drawer",
        sx: {
          width: isMobile ? "100%" : 440,
          maxWidth: "100vw",
          height: "100dvh",
          overflow: "hidden",
        },
      }}
    >
      <div className="room-battle-history-shell">
        <div className="room-battle-history-head">
          <div className="room-battle-history-title-wrap">
            <h2 className="room-battle-history-title">對戰歷史</h2>
          </div>
          <IconButton
            size="small"
            color="inherit"
            className="room-battle-history-close"
            onClick={onClose}
            aria-label="關閉對戰歷史"
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </div>
        <div
          ref={historyListRef}
          className="room-battle-history-list mq-autohide-scrollbar"
        >
          {showInitialLoading ? (
            <div className="room-battle-history-empty room-battle-history-empty--loading">
              <div
                className="room-battle-history-loader"
                role="status"
                aria-live="polite"
              >
                <div className="room-battle-history-loader__headline">
                  <span
                    className="room-battle-history-sync-strip__dot"
                    aria-hidden="true"
                  />
                  <span>讀取房間歷史中...</span>
                </div>
                <span
                  className="room-battle-history-loader__rail"
                  aria-hidden="true"
                >
                  <span className="room-battle-history-loader__rail-fill" />
                </span>
                <div
                  className="room-battle-history-loader__chips"
                  aria-hidden="true"
                >
                  <span />
                  <span />
                  <span />
                </div>
                <div
                  className="room-battle-history-loader__ghosts"
                  aria-hidden="true"
                >
                  <span />
                  <span />
                </div>
              </div>
            </div>
          ) : summaries.length === 0 ? (
            <div className="room-battle-history-empty">
              <HistoryEduRoundedIcon fontSize="small" />
              <span>目前沒有可查看的房間歷史。</span>
            </div>
          ) : (
            summaries.map((summary) => {
              const stats = statsByRoundKey[summary.roundKey];
              const isLatest = summary.roundKey === latestRoundKey;
              const isLoading = loadingRoundKey === summary.roundKey;
              const historySnapshot = snapshotsByRoundKey[summary.roundKey];
              const playlistArtwork = resolveHistoryPlaylistArtwork(
                summary,
                historySnapshot,
              );

              return (
                <div
                  key={summary.roundKey}
                  className={`room-battle-history-item ${
                    isLatest ? "is-latest" : ""
                  }`}
                >
                  <div className="room-battle-history-item-head">
                    <div className="room-battle-history-source">
                      <div className="room-battle-history-source-cover">
                        {playlistArtwork.thumbnail ? (
                          <img
                            src={playlistArtwork.thumbnail}
                            alt={playlistArtwork.coverTitle}
                            loading="lazy"
                          />
                        ) : (
                          <LibraryMusicRoundedIcon fontSize="small" />
                        )}
                      </div>
                      <div className="room-battle-history-source-copy">
                        <Typography
                          variant="subtitle2"
                          className="room-battle-history-playlist-title"
                        >
                          {playlistArtwork.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          className="room-battle-history-source-meta"
                        >
                          {playlistArtwork.sourceLabel}
                        </Typography>
                      </div>
                    </div>
                    <div className="room-battle-history-time-wrap">
                      <Typography
                        variant="caption"
                        className="room-battle-history-time"
                      >
                        {formatHistoryEndedAt(summary.endedAt)}
                      </Typography>
                    </div>
                  </div>

                  <div className="room-battle-history-metrics">
                    <span>
                      名次
                      <strong>{stats?.rank ?? "-"}</strong>
                    </span>
                    <span>
                      分數
                      <strong>
                        {typeof stats?.score === "number"
                          ? stats.score.toLocaleString()
                          : "-"}
                      </strong>
                    </span>
                    <span>
                      最高連擊
                      <strong>
                        {typeof stats?.maxCombo === "number"
                          ? `x${Math.max(0, Math.round(stats.maxCombo))}`
                          : "-"}
                      </strong>
                    </span>
                  </div>

                  <div className="room-battle-history-actions">
                    <Button
                      size="small"
                      variant="outlined"
                      color="info"
                      className="room-battle-history-action room-battle-history-action--detail"
                      disabled={replayLoadingRoundKey === summary.roundKey}
                      onClick={() => {
                        onOpenReplay(summary);
                      }}
                    >
                      {replayLoadingRoundKey === summary.roundKey
                        ? "載入詳情..."
                        : "查看詳情"}
                    </Button>
                    {isLatest ? (
                      <Button
                        size="small"
                        variant="outlined"
                        color="info"
                        className="room-battle-history-action room-battle-history-action--replay"
                        disabled={isLoading}
                        onClick={() => {
                          onOpenSettlement(summary.roundKey);
                        }}
                      >
                        {isLoading ? "載入中..." : "結算頁面"}
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
        {hasMore && (
          <div className="flex justify-center pb-1">
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              className="room-battle-history-load-more"
              disabled={loadingMore}
              onClick={onLoadMore}
            >
              {loadingMore ? "載入更多中..." : "載入更多"}
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
