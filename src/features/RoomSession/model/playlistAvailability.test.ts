import { describe, expect, it } from "vitest";

import {
  formatCollectionAvailabilityMetricLabel,
  formatPlaylistAvailabilityMetricLabel,
  resolveCollectionAvailabilityCounts,
  resolveCollectionPlayableRequirement,
} from "./playlistAvailability";

describe("playlist availability labels", () => {
  it("formats collection availability with playable count only", () => {
    expect(
      formatCollectionAvailabilityMetricLabel({
        item_count: 11,
        playable_item_count: 4,
      }),
    ).toBe("4題");
  });

  it("falls back to total count when collection playable count is unknown", () => {
    expect(
      formatCollectionAvailabilityMetricLabel({
        item_count: 11,
        playable_item_count: null,
      }),
    ).toBe("11題");
  });

  it("formats room playlist availability with playable count only", () => {
    expect(
      formatPlaylistAvailabilityMetricLabel({
        playlistTotalCount: 11,
        playlistPlayableCount: 4,
      }),
    ).toBe("4題");
  });

  it("clamps collection playable count to total count", () => {
    expect(
      resolveCollectionAvailabilityCounts({
        item_count: 11,
        playable_item_count: 20,
      }),
    ).toMatchObject({
      playable: 11,
      total: 11,
      unavailable: 0,
    });
  });

  it("returns the shared minimum collection playable reason", () => {
    expect(
      resolveCollectionPlayableRequirement({
        item_count: 11,
        playable_item_count: 4,
      }),
    ).toMatchObject({
      disabled: true,
      reason: "低於 20 題，不能用於題庫",
      detail: "目前只有 4 題可遊玩",
    });
  });
});
