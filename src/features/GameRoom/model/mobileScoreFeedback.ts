import type { RoomParticipant } from "@features/RoomSession";

import { sortParticipantsByScore } from "./gameRoomDerivations";
import type {
  ChallengeProjectedLeaderboardResponse,
  GameRoomScoreboardTab,
} from "./projectionTypes";

export type MobileScoreFeedbackScope = GameRoomScoreboardTab;

export type FeedbackPlayer = {
  clientId: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  rank: number;
  combo: number | null;
};

export type MobileScoreFeedbackEvent =
  | {
      type: "passed";
      scope: MobileScoreFeedbackScope;
      scoreGain: number;
      oldRank: number;
      newRank: number;
      me: FeedbackPlayer;
      target: FeedbackPlayer | null;
    }
  | {
      type: "overtaken";
      scope: MobileScoreFeedbackScope;
      oldRank: number;
      newRank: number;
      me: FeedbackPlayer;
      target: FeedbackPlayer | null;
      targetScoreGain: number | null;
    }
  | {
      type: "score";
      scope: MobileScoreFeedbackScope;
      scoreGain: number;
      me: FeedbackPlayer;
      target: FeedbackPlayer | null;
      remainingScore: number | null;
      runnerUp: FeedbackPlayer | null;
      leadScore: number | null;
    };

export type MobileScoreFeedbackSnapshot = {
  scope: MobileScoreFeedbackScope;
  me: FeedbackPlayer | null;
  players: FeedbackPlayer[];
  rankByClientId: Map<string, number>;
  scoreByClientId: Map<string, number>;
};

const ME_CHALLENGE_CLIENT_ID = "__challenge_me__";

const toFeedbackPlayer = (
  participant: RoomParticipant,
  rank: number,
): FeedbackPlayer => ({
  clientId: participant.clientId,
  username: participant.username,
  avatarUrl: participant.avatar_url ?? participant.avatarUrl ?? null,
  score: participant.score,
  rank,
  combo: participant.combo ?? 0,
});

const createSnapshot = (
  scope: MobileScoreFeedbackScope,
  players: FeedbackPlayer[],
  me: FeedbackPlayer | null,
): MobileScoreFeedbackSnapshot => ({
  scope,
  me,
  players,
  rankByClientId: new Map(
    players.map((player) => [player.clientId, player.rank]),
  ),
  scoreByClientId: new Map(
    players.map((player) => [player.clientId, player.score]),
  ),
});

export const buildRoomMobileScoreFeedbackSnapshot = (
  participants: RoomParticipant[],
  meClientId: string | undefined,
): MobileScoreFeedbackSnapshot => {
  const players = sortParticipantsByScore(participants).map(
    (participant, index) => toFeedbackPlayer(participant, index + 1),
  );
  const me = meClientId
    ? (players.find((player) => player.clientId === meClientId) ?? null)
    : null;

  return createSnapshot("room", players, me);
};

export const buildChallengeMobileScoreFeedbackSnapshot = ({
  projection,
  meClientId,
  meUsername,
  meAvatarUrl,
  meScore,
  meCombo,
}: {
  projection: ChallengeProjectedLeaderboardResponse | null;
  meClientId: string | undefined;
  meUsername?: string | null;
  meAvatarUrl?: string | null;
  meScore: number;
  meCombo: number;
}): MobileScoreFeedbackSnapshot => {
  if (!projection) {
    return createSnapshot("challenge", [], null);
  }

  const meRank = projection.myStanding.projectedRank;
  const me: FeedbackPlayer | null =
    typeof meRank === "number"
      ? {
          clientId: meClientId || ME_CHALLENGE_CLIENT_ID,
          username: meUsername?.trim() || "我",
          avatarUrl: meAvatarUrl ?? null,
          score: meScore,
          rank: meRank,
          combo: meCombo,
        }
      : null;

  const byClientId = new Map<string, FeedbackPlayer>();
  const addPlayer = (player: FeedbackPlayer) => {
    const existing = byClientId.get(player.clientId);
    if (!existing || player.rank < existing.rank) {
      byClientId.set(player.clientId, player);
    }
  };

  projection.topEntries.forEach((entry) => {
    if (entry.userId === projection.myStanding.viewerDbUserId) {
      if (me) addPlayer(me);
      return;
    }
    if (typeof entry.rank !== "number") return;
    addPlayer({
      clientId: `challenge:${entry.userId}`,
      username: entry.displayName,
      avatarUrl: entry.avatarUrl,
      score: entry.bestScore,
      rank: entry.rank,
      combo: entry.maxCombo,
    });
  });

  projection.nearbyOpponents.forEach((opponent) => {
    if (opponent.userId === projection.myStanding.viewerDbUserId) {
      if (me) addPlayer(me);
      return;
    }
    if (typeof opponent.rank !== "number") return;
    addPlayer({
      clientId: `challenge:${opponent.userId}`,
      username: opponent.displayName,
      avatarUrl: opponent.avatarUrl,
      score: opponent.bestScore,
      rank: opponent.rank,
      combo: opponent.maxCombo,
    });
  });

  if (me) addPlayer(me);

  if (
    projection.myStanding.nextTarget &&
    typeof meRank === "number" &&
    !projection.myStanding.nextTarget.userId
  ) {
    addPlayer({
      clientId: "challenge:next-target",
      username: projection.myStanding.nextTarget.displayName,
      avatarUrl: null,
      score: projection.myStanding.nextTarget.score,
      rank: Math.max(1, meRank - 1),
      combo: null,
    });
  }

  const players = Array.from(byClientId.values()).sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (b.score !== a.score) return b.score - a.score;
    return a.clientId.localeCompare(b.clientId);
  });

  return createSnapshot("challenge", players, me);
};

export const buildMobileScoreFeedbackSnapshot = ({
  scope,
  participants,
  meClientId,
  challengeProjection,
}: {
  scope: MobileScoreFeedbackScope;
  participants: RoomParticipant[];
  meClientId: string | undefined;
  challengeProjection?: ChallengeProjectedLeaderboardResponse | null;
}): MobileScoreFeedbackSnapshot => {
  if (scope === "challenge") {
    const me = meClientId
      ? participants.find((participant) => participant.clientId === meClientId)
      : null;
    return buildChallengeMobileScoreFeedbackSnapshot({
      projection: challengeProjection ?? null,
      meClientId,
      meUsername: me?.username ?? null,
      meAvatarUrl: me?.avatar_url ?? me?.avatarUrl ?? null,
      meScore: me?.score ?? 0,
      meCombo: me?.combo ?? 0,
    });
  }

  return buildRoomMobileScoreFeedbackSnapshot(participants, meClientId);
};

const findPassedTarget = (
  prevSnapshot: MobileScoreFeedbackSnapshot,
  nextSnapshot: MobileScoreFeedbackSnapshot,
  oldRank: number,
  newRank: number,
) =>
  nextSnapshot.players
    .filter(
      (player) =>
        player.rank >= newRank &&
        player.rank < oldRank &&
        player.clientId !== nextSnapshot.me?.clientId,
    )
    .sort((a, b) => a.rank - b.rank)
    .find((player) => {
      const previousTargetRank = prevSnapshot.rankByClientId.get(
        player.clientId,
      );

      return (
        typeof previousTargetRank === "number" && previousTargetRank < oldRank
      );
    }) ??
  prevSnapshot.players
    .filter(
      (player) =>
        player.rank >= newRank &&
        player.rank < oldRank &&
        player.clientId !== prevSnapshot.me?.clientId,
    )
    .sort((a, b) => a.rank - b.rank)[0] ??
  null;

const findOvertakingTarget = (
  prevSnapshot: MobileScoreFeedbackSnapshot,
  nextSnapshot: MobileScoreFeedbackSnapshot,
  oldRank: number,
  newRank: number,
) =>
  nextSnapshot.players
    .filter((player) => player.rank > oldRank && player.rank <= newRank)
    .sort((a, b) => b.rank - a.rank)
    .find((player) => {
      const previousTargetRank = prevSnapshot.rankByClientId.get(
        player.clientId,
      );

      return (
        typeof previousTargetRank === "number" && previousTargetRank > oldRank
      );
    }) ?? null;

export const buildMobileScoreFeedbackEvent = (
  prevSnapshot: MobileScoreFeedbackSnapshot | null,
  nextSnapshot: MobileScoreFeedbackSnapshot | null,
): MobileScoreFeedbackEvent | null => {
  const prevMe = prevSnapshot?.me ?? null;
  const nextMe = nextSnapshot?.me ?? null;
  if (
    !prevSnapshot ||
    !nextSnapshot ||
    prevSnapshot.scope !== nextSnapshot.scope ||
    !prevMe ||
    !nextMe
  ) {
    return null;
  }

  const prevScore = prevSnapshot.scoreByClientId.get(nextMe.clientId);
  const oldRank = prevSnapshot.rankByClientId.get(nextMe.clientId);
  const newRank = nextSnapshot.rankByClientId.get(nextMe.clientId);
  if (
    typeof prevScore !== "number" ||
    typeof oldRank !== "number" ||
    typeof newRank !== "number"
  ) {
    return null;
  }

  const scoreGain = nextMe.score - prevScore;

  if (newRank < oldRank) {
    const passedTarget = findPassedTarget(
      prevSnapshot,
      nextSnapshot,
      oldRank,
      newRank,
    );

    return {
      type: "passed",
      scope: nextSnapshot.scope,
      scoreGain: Math.max(0, scoreGain),
      oldRank,
      newRank,
      me: nextMe,
      target: passedTarget,
    };
  }

  if (newRank > oldRank) {
    const overtakingTarget = findOvertakingTarget(
      prevSnapshot,
      nextSnapshot,
      oldRank,
      newRank,
    );

    const prevTargetScore = overtakingTarget
      ? prevSnapshot.scoreByClientId.get(overtakingTarget.clientId)
      : undefined;

    return {
      type: "overtaken",
      scope: nextSnapshot.scope,
      oldRank,
      newRank,
      me: nextMe,
      target: overtakingTarget,
      targetScoreGain:
        overtakingTarget && typeof prevTargetScore === "number"
          ? Math.max(0, overtakingTarget.score - prevTargetScore)
          : null,
    };
  }

  if (scoreGain <= 0) {
    return null;
  }

  if (newRank === 1) {
    const runnerUp =
      nextSnapshot.players.find((player) => player.rank === 2) ?? null;

    return {
      type: "score",
      scope: nextSnapshot.scope,
      scoreGain,
      me: nextMe,
      target: null,
      remainingScore: null,
      runnerUp,
      leadScore: runnerUp ? nextMe.score - runnerUp.score : null,
    };
  }

  const target =
    nextSnapshot.players.find((player) => player.rank === newRank - 1) ?? null;

  return {
    type: "score",
    scope: nextSnapshot.scope,
    scoreGain,
    me: nextMe,
    target,
    remainingScore: target ? target.score - nextMe.score + 1 : null,
    runnerUp: null,
    leadScore: null,
  };
};
