import { describe, expect, it } from "vitest";

import type { RoomSettlementHistorySummary } from "@features/RoomSession";
import {
  getHistorySummaryPlaylistDisplayTitle,
  getHistorySummaryPlaylistItemCount,
  getHistorySummaryPlaylistSourceLabel,
  getHistorySummaryPlaylistSourceType,
  isCollectionHistorySummary,
  isYouTubeHistorySummary,
} from "../historySummaryAdapter";

const summary = (
  overrides: Partial<RoomSettlementHistorySummary>,
): RoomSettlementHistorySummary => ({
  matchId: "match-1",
  roundKey: "round-1",
  roundNo: 1,
  roomId: "room-1",
  roomName: "Room",
  startedAt: 1_700_000_000_000,
  endedAt: 1_700_000_030_000,
  status: "ended",
  playerCount: 4,
  questionCount: 10,
  ...overrides,
});

describe("historySummaryAdapter", () => {
  it("prefers top-level playlist metadata over summaryJson", () => {
    const item = summary({
      playlistTitle: " Top Level ",
      playlistSourceType: "private_collection",
      playlistItemCount: 12.8,
      summaryJson: {
        playlistTitle: "JSON Level",
        playlistSourceType: "youtube_pasted_link",
        playlistItemCount: 99,
      },
    });

    expect(getHistorySummaryPlaylistDisplayTitle(item)).toBe("Top Level");
    expect(getHistorySummaryPlaylistSourceType(item)).toBe(
      "private_collection",
    );
    expect(getHistorySummaryPlaylistItemCount(item)).toBe(12);
  });

  it("falls back to summaryJson metadata for older records", () => {
    const item = summary({
      summaryJson: {
        playlistTitle: "Legacy Playlist",
        playlistSourceType: "youtube_google_import",
        playlistItemCount: 8,
      },
    });

    expect(getHistorySummaryPlaylistDisplayTitle(item)).toBe(
      "Legacy Playlist",
    );
    expect(getHistorySummaryPlaylistSourceType(item)).toBe(
      "youtube_google_import",
    );
    expect(getHistorySummaryPlaylistSourceLabel(item)).toBe("YouTube 清單");
    expect(isYouTubeHistorySummary(item)).toBe(true);
    expect(isCollectionHistorySummary(item)).toBe(false);
  });

  it("normalizes missing or invalid metadata", () => {
    const item = summary({
      summaryJson: {
        playlistTitle: " ",
        playlistSourceType: "bad-source",
        playlistItemCount: -1,
      },
    });

    expect(getHistorySummaryPlaylistDisplayTitle(item)).toBe("未命名播放清單");
    expect(getHistorySummaryPlaylistSourceType(item)).toBeNull();
    expect(getHistorySummaryPlaylistSourceLabel(item)).toBe("未知來源");
    expect(getHistorySummaryPlaylistItemCount(item)).toBeNull();
  });
});
