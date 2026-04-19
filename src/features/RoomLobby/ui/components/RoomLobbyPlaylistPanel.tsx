import React, { useCallback } from "react";
import { Box, Typography } from "@mui/material";
import LibraryMusicRoundedIcon from "@mui/icons-material/LibraryMusicRounded";
import { List as VirtualList, type RowComponentProps } from "react-window";

import type { PlaylistItem } from "@features/RoomSession";
import useAutoHideScrollbar from "@shared/hooks/useAutoHideScrollbar";

interface RoomLobbyPlaylistPanelProps {
  playlistProgress: { received: number; total: number; ready: boolean };
  playlistItems: PlaylistItem[];
  playlistListShellStyle: React.CSSProperties;
  playlistListViewportStyle: React.CSSProperties;
  rowCount: number;
  playlistRowHeight: number;
  playlistRowProps: Record<string, never>;
  playlistRowComponent: (props: RowComponentProps) => React.ReactElement;
  showHeader?: boolean;
}

const RoomLobbyPlaylistPanel = React.memo(function RoomLobbyPlaylistPanel({
  playlistProgress,
  playlistItems,
  playlistListShellStyle,
  playlistListViewportStyle,
  rowCount,
  playlistRowHeight,
  playlistRowProps,
  playlistRowComponent,
  showHeader = true,
}: RoomLobbyPlaylistPanelProps) {
  const playlistViewportRef = useAutoHideScrollbar<HTMLDivElement>();
  const handlePlaylistListRef = useCallback((instance: {
    element: HTMLDivElement | null;
  } | null) => {
    playlistViewportRef(instance?.element ?? null);
  }, [playlistViewportRef]);

  return (
    <Box className="room-lobby-playlist-panel">
      {showHeader ? (
        <div className="room-lobby-panel-head room-lobby-panel-head--playlist room-lobby-playlist-head">
          <div className="room-lobby-panel-title room-lobby-panel-title--playlist">
            <LibraryMusicRoundedIcon fontSize="small" />
            <Typography variant="subtitle2" className="text-slate-200">
              播放清單
            </Typography>
          </div>
          <div className="room-lobby-panel-counter">
            {playlistProgress.total > 0
              ? playlistProgress.total
              : playlistItems.length}
          </div>
        </div>
      ) : null}
      {playlistItems.length === 0 ? (
        <div className="room-lobby-playlist-shell" style={playlistListShellStyle}>
          <div className="flex h-full min-h-[140px] items-center justify-center rounded border border-slate-800 bg-slate-900/60 px-3">
            <Typography
              variant="body2"
              className="text-slate-500"
              align="center"
            >
              目前沒有歌曲
            </Typography>
          </div>
        </div>
      ) : (
        <div className="room-lobby-playlist-shell" style={playlistListShellStyle}>
          <div className="h-full min-h-0 w-full overflow-hidden rounded border border-slate-800 bg-slate-900/60">
            <VirtualList
              className="mq-autohide-scrollbar"
              listRef={handlePlaylistListRef}
              style={playlistListViewportStyle}
              rowCount={rowCount}
              rowHeight={playlistRowHeight}
              rowProps={playlistRowProps}
              rowComponent={playlistRowComponent}
            />
          </div>
        </div>
      )}
    </Box>
  );
});

export default RoomLobbyPlaylistPanel;
