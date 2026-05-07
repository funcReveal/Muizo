import { describe, expect, it } from "vitest";

import type { CollectionEntry } from "./CollectionContentContext";
import {
  COLLECTION_AVAILABILITY_PATCH_TTL_MS,
  normalizeAvailabilityPatchInput,
  patchCollectionAvailabilityIntoList,
  patchCollectionAvailabilityListWithMap,
  patchCollectionSummary,
} from "./useCollectionContentState";
import { extractCollectionAvailabilityPatchFromRoom } from "@features/RoomSession/model/playlistAvailability";

const collection = (
  id: string,
  itemCount: number,
  playableItemCount: number | null,
): CollectionEntry => ({
  id,
  title: id,
  visibility: "private",
  item_count: itemCount,
  playable_item_count: playableItemCount,
});

describe("collection availability patching", () => {
  it("patches stale collection cache from backend room summary", () => {
    const collectionId = "collection-a";
    const patch = extractCollectionAvailabilityPatchFromRoom({
      playlistId: collectionId,
      playlistSourceType: "private_collection",
      playlistCount: 4,
      playlistTotalCount: 11,
      playlistPlayableCount: 4,
    });

    expect(patch).toEqual({
      collectionId,
      itemCount: 11,
      playableItemCount: 4,
    });

    const normalizedPatch = normalizeAvailabilityPatchInput({
      ...patch!,
      source: "summary",
      patchedAt: 1000,
    });

    const [patched] = patchCollectionAvailabilityIntoList(
      [collection(collectionId, 11, 6)],
      normalizedPatch!,
    );

    expect(patched.item_count).toBe(11);
    expect(patched.playable_item_count).toBe(4);
  });

  it("keeps fresh authoritative patch when a later collection fetch returns old counts", () => {
    const patch = normalizeAvailabilityPatchInput({
      collectionId: "collection-a",
      itemCount: 11,
      playableItemCount: 4,
      source: "summary",
      patchedAt: Date.now(),
    });

    const [patched] = patchCollectionAvailabilityListWithMap(
      [collection("collection-a", 11, 6)],
      { "collection-a": patch! },
    );

    expect(patched.item_count).toBe(11);
    expect(patched.playable_item_count).toBe(4);
  });

  it("does not apply patches to other collections", () => {
    const patch = normalizeAvailabilityPatchInput({
      collectionId: "collection-a",
      itemCount: 11,
      playableItemCount: 4,
      source: "summary",
      patchedAt: Date.now(),
    });

    const [unchanged] = patchCollectionAvailabilityIntoList(
      [collection("collection-b", 11, 6)],
      patch!,
    );

    expect(unchanged.item_count).toBe(11);
    expect(unchanged.playable_item_count).toBe(6);
  });

  it("trusts backend patch when itemCount differs from old cache", () => {
    const patched = patchCollectionSummary(collection("collection-a", 10, 6), {
      collectionId: "collection-a",
      itemCount: 11,
      playableItemCount: 4,
      source: "summary",
      patchedAt: Date.now(),
    });

    expect(patched.item_count).toBe(11);
    expect(patched.playable_item_count).toBe(4);
  });

  it("does not apply expired availability patches to new fetch results", () => {
    const expiredPatch = normalizeAvailabilityPatchInput({
      collectionId: "collection-a",
      itemCount: 11,
      playableItemCount: 4,
      source: "summary",
      patchedAt: Date.now() - COLLECTION_AVAILABILITY_PATCH_TTL_MS - 1,
    });

    const [fromFetch] = patchCollectionAvailabilityListWithMap(
      [collection("collection-a", 11, 6)],
      { "collection-a": expiredPatch! },
    );

    expect(fromFetch.playable_item_count).toBe(6);
  });
});
