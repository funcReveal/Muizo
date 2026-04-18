export type RoomCreateSourceMode =
  | "link"
  | "youtube"
  | "publicCollection"
  | "privateCollection";

export type RoomVisibility = "public" | "private";

export type PlaylistSourceType =
  | "public_collection"
  | "private_collection"
  | "youtube_google_import"
  | "youtube_pasted_link";

export type PlaybackExtensionMode = "manual_vote" | "auto_once" | "disabled";

export interface PlaylistItem {
  title: string;
  url: string;
  uploader?: string;
  channelId?: string;
  duration?: string;
  thumbnail?: string;
  startSec?: number;
  endSec?: number;
  hasExplicitStartSec?: boolean;
  hasExplicitEndSec?: boolean;
  timingSource?: "room_settings" | "track_clip";
  collectionClipStartSec?: number;
  collectionClipEndSec?: number;
  collectionHasExplicitStartSec?: boolean;
  collectionHasExplicitEndSec?: boolean;
  answerText?: string;
  videoId?: string;
  sourceId?: string | null;
  provider?: string;
}

export interface RoomSummary {
  id: string;
  name: string;
  playlistCount: number;
  playerCount: number;
  maxPlayers?: number | null;
  createdAt: string;
  hasPassword?: boolean;
  hasPin?: boolean;
  visibility?: RoomVisibility;
  playlistTitle?: string | null;
  playlistSourceType?: PlaylistSourceType | null;
  currentQuestionNo?: number | null;
  completedQuestionCount?: number;
  questionCount?: number;
  gameStatus?: string | null;
  gameSettings?: {
    playDurationSec?: number;
    revealDurationSec?: number;
    startOffsetSec?: number;
    allowCollectionClipTiming?: boolean;
  } | null;
}

export type RoomListPayload = {
  rooms?: RoomSummary[];
  error?: string;
};

export type RoomByIdPayload = {
  room?: RoomSummary;
  error?: string;
  error_code?: string;
};
