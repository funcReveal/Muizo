/**
 * Types for the in-game projected challenge leaderboard.
 * These match the backend ChallengeProjectedLeaderboardResponse exactly.
 *
 * IMPORTANT: these types describe a PROJECTED (estimated) ranking during
 * gameplay. The official rank is only available after settlement.
 */

export type GameRoomScoreboardTab = "challenge" | "room";

export type ChallengeLeaderboardEntry = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  rank: number;
  bestScore: number;
  maxCombo: number;
  correctCount: number | null;
  avgCorrectMs: number | null;
};

export type ChallengeNearbyOpponent = ChallengeLeaderboardEntry & {
  /** bestScore - myLiveScore: positive = ahead (still need to catch up), negative = passed */
  gapFromMe: number;
  /** "ahead" = this opponent ranks above me, "passed" = I've surpassed them */
  relation: "ahead" | "passed";
};

export type ChallengeProjectedMyStanding = {
  liveScore: number;
  officialBestScore: number | null;
  /** Projected rank for this live run — clearly NOT the official rank */
  projectedRank: number | null;
  /** Official rank from last settled record, null if first-time */
  officialRank: number | null;
  totalPlayers: number;
  rankIsFinal: false;
  /** DB UUID of the viewing user; used to mark self in top5 list */
  viewerDbUserId: string | null;
  nextTarget: {
    userId: string | null;
    displayName: string;
    score: number;
    gap: number;
  } | null;
};

export type ChallengeProjectedLeaderboardResponse = {
  mode: "projected";
  roomId: string;
  collectionId: string;
  profileKey: string;
  questionIndex: number | null;
  generatedAt: string;
  topEntries: ChallengeLeaderboardEntry[];
  nearbyOpponents: ChallengeNearbyOpponent[];
  myStanding: ChallengeProjectedMyStanding;
  cache: {
    source: "redis" | "postgres" | "memory";
    ttlMs: number;
  };
};

export type ChallengeProjectionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "loaded"; data: ChallengeProjectedLeaderboardResponse; loadedAt: number }
  | { status: "error"; message: string };
