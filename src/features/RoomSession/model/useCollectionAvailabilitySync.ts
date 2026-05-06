import { useCallback } from "react";

import {
  extractCollectionAvailabilityPatchFromPlaylist,
  extractCollectionAvailabilityPatchFromRoom,
  type CollectionAvailabilityPatch,
} from "./playlistAvailability";
import type { RoomState, RoomSummary } from "./types";

type CollectionAvailabilityPatchSource = "room" | "playlist" | "summary";

type PatchCollectionAvailability = (
  input: CollectionAvailabilityPatch & {
    source?: CollectionAvailabilityPatchSource;
  },
) => void;

export const useCollectionAvailabilitySync = (
  patchCollectionAvailability: PatchCollectionAvailability,
) => {
  const syncCollectionAvailabilityFromRoom = useCallback(
    (
      room: RoomState["room"] | RoomSummary | null | undefined,
      source: "room" | "summary" = "room",
    ) => {
      const patch = extractCollectionAvailabilityPatchFromRoom(room);
      if (patch) {
        patchCollectionAvailability({ ...patch, source });
      }
    },
    [patchCollectionAvailability],
  );

  const syncCollectionAvailabilityFromPlaylist = useCallback(
    (playlist: RoomState["room"]["playlist"] | null | undefined) => {
      const patch = extractCollectionAvailabilityPatchFromPlaylist(playlist);
      if (patch) {
        patchCollectionAvailability({ ...patch, source: "playlist" });
      }
    },
    [patchCollectionAvailability],
  );

  const syncCollectionAvailabilityFromRooms = useCallback(
    (rooms: Array<RoomState["room"] | RoomSummary> | null | undefined) => {
      if (!rooms?.length) return;

      for (const room of rooms) {
        const patch = extractCollectionAvailabilityPatchFromRoom(room);
        if (patch) {
          patchCollectionAvailability({ ...patch, source: "summary" });
        }
      }
    },
    [patchCollectionAvailability],
  );

  return {
    syncCollectionAvailabilityFromRoom,
    syncCollectionAvailabilityFromPlaylist,
    syncCollectionAvailabilityFromRooms,
  };
};
