import {
  MIN_COLLECTION_PLAYABLE_COUNT,
  QUESTION_MAX,
} from "@domain/room/constants";
import type { PlaylistSourceType } from "./types";

export type PlaylistAvailabilityInput = {
  playlistCount?: number | null;
  playlistTotalCount?: number | null;
  playlistPlayableCount?: number | null;
  playlistId?: string | null;
  playlistSourceType?: PlaylistSourceType | null;
  playlist?: {
    id?: string | null;
    sourceType?: PlaylistSourceType | null;
    totalCount?: number | null;
    playableCount?: number | null;
  } | null;
};

export type CollectionAvailabilityPatch = {
  collectionId: string;
  itemCount?: number | null;
  playableItemCount?: number | null;
};

const toSafeCount = (value: unknown): number | null => {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.max(0, Math.floor(value));
};

export const isCollectionSourceType = (
  sourceType: PlaylistSourceType | null | undefined,
): sourceType is "public_collection" | "private_collection" =>
  sourceType === "public_collection" || sourceType === "private_collection";

export const resolvePlaylistAvailabilityCounts = (
  source: PlaylistAvailabilityInput | null | undefined,
) => {
  const total =
    toSafeCount(source?.playlistTotalCount) ??
    toSafeCount(source?.playlist?.totalCount) ??
    toSafeCount(source?.playlistCount) ??
    0;

  const playableRaw =
    toSafeCount(source?.playlistPlayableCount) ??
    toSafeCount(source?.playlist?.playableCount) ??
    toSafeCount(source?.playlistCount) ??
    total;

  const playable = Math.min(playableRaw, total);

  return {
    playable,
    total,
    unavailable: Math.max(0, total - playable),
    hasAvailability:
      source?.playlistPlayableCount !== undefined &&
      source?.playlistPlayableCount !== null
        ? true
        : source?.playlist?.playableCount !== undefined &&
          source?.playlist?.playableCount !== null,
  };
};

export const formatPlaylistAvailabilityLabel = (
  source: PlaylistAvailabilityInput | null | undefined,
): string => {
  const counts = resolvePlaylistAvailabilityCounts(source);
  return `${counts.playable} 題`;
};

export const formatPlaylistAvailabilityTooltip = (
  source: PlaylistAvailabilityInput | null | undefined,
): string => {
  const counts = resolvePlaylistAvailabilityCounts(source);
  return counts.unavailable > 0
    ? `共 ${counts.total} 題，目前 ${counts.playable} 題可遊玩，${counts.unavailable} 題暫時無法播放。建立房間、推薦與更換題庫時，只會使用可遊玩的題目。`
    : `共 ${counts.total} 題，目前 ${counts.playable} 題可遊玩。`;
};

export const resolveQuestionLimitFromAvailability = (
  source: PlaylistAvailabilityInput | null | undefined,
) => {
  const counts = resolvePlaylistAvailabilityCounts(source);

  if (counts.playable <= 0) {
    return {
      ...counts,
      max: 0,
      canStart: false,
      reason: "目前沒有可播放題目",
    };
  }

  return {
    ...counts,
    max: Math.min(QUESTION_MAX, counts.playable),
    canStart: true,
    reason: null,
  };
};

export const formatPlaylistAvailabilityMetricLabel = (
  source: PlaylistAvailabilityInput | null | undefined,
): string => {
  const counts = resolvePlaylistAvailabilityCounts(source);
  return `${counts.playable}題`;
};

export type CollectionAvailabilityInput = {
  item_count?: number | null;
  playable_item_count?: number | null;
};

export const resolveCollectionAvailabilityCounts = (
  collection: CollectionAvailabilityInput | null | undefined,
) => {
  const total = toSafeCount(collection?.item_count) ?? 0;
  const playableRaw = toSafeCount(collection?.playable_item_count) ?? total;
  const playable = Math.min(playableRaw, total);

  return {
    playable,
    total,
    unavailable: Math.max(0, total - playable),
  };
};

export const formatCollectionAvailabilityLabel = (
  collection: CollectionAvailabilityInput | null | undefined,
): string => {
  const counts = resolveCollectionAvailabilityCounts(collection);
  return `${counts.playable} 題`;
};

export const formatCollectionAvailabilityTooltip = (
  collection: CollectionAvailabilityInput | null | undefined,
): string => {
  const counts = resolveCollectionAvailabilityCounts(collection);
  return counts.unavailable > 0
    ? `共 ${counts.total} 題，目前 ${counts.playable} 題可遊玩，${counts.unavailable} 題暫時無法播放。建立房間、推薦與更換題庫時，只會使用可遊玩的題目。`
    : `共 ${counts.total} 題，目前 ${counts.playable} 題可遊玩。`;
};

export const resolveQuestionLimitFromCollection = (
  collection: CollectionAvailabilityInput | null | undefined,
) => {
  const counts = resolveCollectionAvailabilityCounts(collection);

  if (counts.playable <= 0) {
    return {
      ...counts,
      max: 0,
      canStart: false,
      reason: "目前沒有可播放題目",
    };
  }

  return {
    ...counts,
    max: Math.min(QUESTION_MAX, counts.playable),
    canStart: true,
    reason: null,
  };
};

export const formatCollectionAvailabilityMetricLabel = (
  collection: CollectionAvailabilityInput | null | undefined,
): string => {
  const counts = resolveCollectionAvailabilityCounts(collection);
  return `${counts.playable}題`;
};

export const resolveCollectionPlayableRequirement = (
  collection: CollectionAvailabilityInput | null | undefined,
) => {
  const counts = resolveCollectionAvailabilityCounts(collection);
  const meetsMinimum = counts.playable >= MIN_COLLECTION_PLAYABLE_COUNT;

  return {
    ...counts,
    meetsMinimum,
    disabled: !meetsMinimum,
    reason: meetsMinimum
      ? null
      : `低於 ${MIN_COLLECTION_PLAYABLE_COUNT} 題，不能用於題庫`,
    detail: meetsMinimum
      ? null
      : `目前只有 ${counts.playable} 題可遊玩`,
  };
};

export const extractCollectionAvailabilityPatchFromPlaylist = (
  playlist: PlaylistAvailabilityInput["playlist"] | null | undefined,
): CollectionAvailabilityPatch | null => {
  if (!isCollectionSourceType(playlist?.sourceType ?? null)) return null;
  const collectionId = playlist?.id?.trim();
  if (!collectionId) return null;

  const itemCount = toSafeCount(playlist?.totalCount);
  const playableItemCount = toSafeCount(playlist?.playableCount);
  if (itemCount === null && playableItemCount === null) return null;

  return {
    collectionId,
    ...(itemCount !== null ? { itemCount } : {}),
    ...(playableItemCount !== null ? { playableItemCount } : {}),
  };
};

export const extractCollectionAvailabilityPatchFromRoom = (
  room: PlaylistAvailabilityInput | null | undefined,
): CollectionAvailabilityPatch | null => {
  const playlistPatch = extractCollectionAvailabilityPatchFromPlaylist(
    room?.playlist,
  );
  if (playlistPatch) return playlistPatch;

  const sourceType = room?.playlistSourceType ?? null;
  if (!isCollectionSourceType(sourceType)) return null;

  const collectionId = room?.playlistId?.trim();
  if (!collectionId) return null;

  const itemCount =
    toSafeCount(room?.playlistTotalCount) ?? toSafeCount(room?.playlistCount);
  const playableItemCount =
    toSafeCount(room?.playlistPlayableCount) ?? toSafeCount(room?.playlistCount);
  if (itemCount === null && playableItemCount === null) return null;

  return {
    collectionId,
    ...(itemCount !== null ? { itemCount } : {}),
    ...(playableItemCount !== null ? { playableItemCount } : {}),
  };
};
