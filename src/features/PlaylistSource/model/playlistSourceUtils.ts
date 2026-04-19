import { extractYoutubeChannelId } from "@shared/utils/youtube";
import type { PlaylistItem } from "./types";
import {
  DEFAULT_CLIP_SEC,
  QUESTION_MAX,
  QUESTION_MIN,
} from "@domain/room/constants";

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
      Math.abs(item.endSec - (startSec + DEFAULT_CLIP_SEC)) > 0.001;
    const hasExplicitEndSec = explicitEndFromFlag ?? inferredExplicitEndSec;
    const hasExplicitStartSec =
      explicitStartFromFlag ?? (startSec > 0 || hasExplicitEndSec);
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

export const extractVideoIdFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const vid = parsed.searchParams.get("v");
    if (vid) return vid;
    const segments = parsed.pathname.split("/").filter(Boolean);
    return segments.pop() || null;
  } catch {
    try {
      const parsed = new URL(`https://${url}`);
      const vid = parsed.searchParams.get("v");
      if (vid) return vid;
      const segments = parsed.pathname.split("/").filter(Boolean);
      return segments.pop() || null;
    } catch {
      const match =
        url.match(/[?&]v=([^&]+)/) ||
        url.match(/youtu\.be\/([^?&]+)/) ||
        url.match(/youtube\.com\/embed\/([^?&]+)/);
      return match?.[1] ?? null;
    }
  }
};
