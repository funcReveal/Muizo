import type {
  ChatMessage,
  PlaylistItem,
  RoomParticipant,
  RoomSettlementQuestionAnswer,
  RoomState,
} from "@features/RoomSession";
import type { SettlementQuestionRecap } from "../../Settlement/model/types";

export type RevealAnswerResult = RoomSettlementQuestionAnswer["result"];

export type RevealChoicePickBadge = {
  clientId: string;
  username: string;
  initial: string;
  avatarUrl?: string | null;
  result: RevealAnswerResult;
  isMe: boolean;
  answeredAtMs: number | null;
};

export type RevealChoicePickMap = Record<number, RevealChoicePickBadge[]>;

export type FrozenSettlementSnapshot = {
  roundKey: string;
  startedAt: number;
  endedAt: number;
  room: RoomState["room"];
  participants: RoomParticipant[];
  messages: ChatMessage[];
  playlistItems: PlaylistItem[];
  trackOrder: number[];
  playedQuestionCount: number;
  questionRecaps: SettlementQuestionRecap[];
};

export type ChoiceCommitFxKind = "lock" | "reselect";

export type ChoiceCommitFxState = {
  trackSessionKey: string;
  choiceIndex: number;
  kind: ChoiceCommitFxKind;
  key: number;
};

export type AnswerDecisionMeta = {
  trackSessionKey: string;
  firstChoiceIndex: number | null;
  firstSubmittedAtMs: number | null;
  hasChangedChoice: boolean;
};

export type FeedbackTone = "neutral" | "locked" | "correct" | "wrong";

export type MyFeedbackModel = {
  tone: FeedbackTone;
  title: string;
  detail: string;
  badges: string[];
  pillText?: string;
  lines?: string[];
  inlineMeta?: string;
};

export type TopTwoSwapState = {
  firstClientId: string;
  secondClientId: string;
  firstOffsetRows: number;
  secondOffsetRows: number;
  isExactSwap: boolean;
  key: number;
};

