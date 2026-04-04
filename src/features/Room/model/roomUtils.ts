import type { PlaylistItem } from "./types";
import {
  DEFAULT_CLIP_SEC,
  DEFAULT_PLAY_DURATION_SEC,
  DEFAULT_REVEAL_DURATION_SEC,
  DEFAULT_START_OFFSET_SEC,
  PLAY_DURATION_MAX,
  PLAY_DURATION_MIN,
  QUESTION_MAX,
  QUESTION_MIN,
  REVEAL_DURATION_MAX,
  REVEAL_DURATION_MIN,
  START_OFFSET_MAX,
  START_OFFSET_MIN,
} from "./roomConstants";

export const formatSeconds = (value: number) => {
  const clamped = Math.max(0, Math.floor(value));
  const h = Math.floor(clamped / 3600);
  const m = Math.floor((clamped % 3600) / 60);
  const s = clamped % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const videoUrlFromId = (videoId: string) =>
  `https://www.youtube.com/watch?v=${videoId}`;

export const thumbnailFromId = (videoId: string) =>
  `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

export const buildYoutubeChannelUrl = (channelId?: string | null) =>
  channelId ? `https://www.youtube.com/channel/${encodeURIComponent(channelId)}` : undefined;

export const extractYoutubeChannelId = (value?: string | null) => {
  const raw = value?.trim();
  if (!raw) return undefined;
  if (/^UC[\w-]+$/.test(raw)) return raw;

  try {
    const parsed = new URL(raw);
    if (!/^(www\.)?youtube\.com$/i.test(parsed.hostname)) return undefined;
    const match = parsed.pathname.match(/^\/channel\/([^/?#]+)/i);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return undefined;
  }
};

export const normalizePlaylistItems = (items: PlaylistItem[]) =>
  items.map((item) => {
    const rawItem = item as PlaylistItem & {
      channel_id?: string | null;
      channel_url?: string | null;
      author_url?: string | null;
    };
    const startSec = Math.max(0, item.startSec ?? 0);
    const isLegacyCollectionDefaultClip =
      item.provider === "collection" &&
      item.hasExplicitStartSec === true &&
      item.hasExplicitEndSec === true &&
      startSec <= 0.001 &&
      typeof item.endSec === "number" &&
      Math.abs(item.endSec - (startSec + DEFAULT_CLIP_SEC)) <= 0.001;
    const explicitEndFromFlag = isLegacyCollectionDefaultClip
      ? false
      : item.hasExplicitEndSec;
    const explicitStartFromFlag = isLegacyCollectionDefaultClip
      ? false
      : item.hasExplicitStartSec;
    const inferredExplicitEndSec =
      typeof item.endSec === "number" &&
        Math.abs(
          item.endSec - (startSec + DEFAULT_CLIP_SEC),
        ) > 0.001;
    const hasExplicitEndSec =
      explicitEndFromFlag ?? inferredExplicitEndSec;
    const hasExplicitStartSec =
      explicitStartFromFlag ??
      (startSec > 0 || hasExplicitEndSec);
    const endSec =
      hasExplicitEndSec && item.endSec !== undefined && item.endSec !== null
        ? item.endSec
        : startSec + DEFAULT_CLIP_SEC;
    const answerText = item.answerText ?? item.title;
    const channelId =
      item.channelId ??
      rawItem.channel_id ??
      extractYoutubeChannelId(rawItem.channel_url) ??
      extractYoutubeChannelId(rawItem.author_url) ??
      undefined;
    return {
      ...item,
      ...(channelId ? { channelId } : {}),
      startSec,
      endSec: Math.max(startSec + 1, endSec),
      hasExplicitStartSec: Boolean(hasExplicitStartSec),
      hasExplicitEndSec: Boolean(hasExplicitEndSec),
      answerText,
    };
  });

export const getQuestionMax = (playlistCount: number) =>
  playlistCount > 0 ? Math.min(QUESTION_MAX, playlistCount) : QUESTION_MAX;

export const clampQuestionCount = (value: number, maxValue: number) =>
  Math.min(maxValue, Math.max(QUESTION_MIN, value));

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

