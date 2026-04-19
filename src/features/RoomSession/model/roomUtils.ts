import {
  DEFAULT_PLAY_DURATION_SEC,
  DEFAULT_REVEAL_DURATION_SEC,
  DEFAULT_START_OFFSET_SEC,
  PLAY_DURATION_MAX,
  PLAY_DURATION_MIN,
  REVEAL_DURATION_MAX,
  REVEAL_DURATION_MIN,
  START_OFFSET_MAX,
  START_OFFSET_MIN,
} from "./roomConstants";

export { formatSeconds } from "../../../shared/utils/format";
export {
  videoUrlFromId,
  thumbnailFromId,
  buildYoutubeChannelUrl,
  extractYoutubeChannelId,
} from "../../../shared/utils/youtube";
export {
  clampQuestionCount,
  getQuestionMax,
  normalizePlaylistItems,
} from "@features/PlaylistSource";

const clampNumber = (
  value: number,
  min: number,
  max: number,
  fallback: number,
) => {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
};

export const clampPlayDurationSec = (value: number) =>
  clampNumber(
    value,
    PLAY_DURATION_MIN,
    PLAY_DURATION_MAX,
    DEFAULT_PLAY_DURATION_SEC,
  );

export const clampRevealDurationSec = (value: number) =>
  clampNumber(
    value,
    REVEAL_DURATION_MIN,
    REVEAL_DURATION_MAX,
    DEFAULT_REVEAL_DURATION_SEC,
  );

export const clampStartOffsetSec = (value: number) =>
  clampNumber(
    value,
    START_OFFSET_MIN,
    START_OFFSET_MAX,
    DEFAULT_START_OFFSET_SEC,
  );
