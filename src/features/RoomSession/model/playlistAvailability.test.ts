import { describe, expect, it } from "vitest";

import {
  formatCollectionAvailabilityMetricLabel,
  formatPlaylistAvailabilityMetricLabel,
  resolveCollectionAvailabilityCounts,
} from "./playlistAvailability";

describe("playlist availability labels", () => {
  it("formats collection availability as playable over total with question suffix", () => {
    expect(
      formatCollectionAvailabilityMetricLabel({
        item_count: 11,
        playable_item_count: 4,
      }),
    ).toBe("4/11題");
  });

  it("falls back to total count when collection playable count is unknown", () => {
    expect(
      formatCollectionAvailabilityMetricLabel({
        item_count: 11,
        playable_item_count: null,
      }),
    ).toBe("11/11題");
  });

  it("formats room playlist availability with the same compact metric", () => {
    expect(
      formatPlaylistAvailabilityMetricLabel({
        playlistTotalCount: 11,
        playlistPlayableCount: 4,
      }),
    ).toBe("4/11題");
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
});
