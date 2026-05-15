import type {
  ChallengeNearbyOpponent,
  ChallengeProjectedMyStanding,
} from "./projectionTypes";

export type ChallengeDisplayRow =
  | {
      type: "opponent";
      opponent: ChallengeNearbyOpponent;
      approxRank: number | null;
      /** bestScore - currentLiveScore. Positive = opponent is ahead; negative = we surpassed them. */
      liveGap: number;
      key: string;
    }
  | {
      type: "self";
      standing: ChallengeProjectedMyStanding;
      approxRank: number | null;
      key: string;
    }
  | { type: "placeholder"; key: string };

interface BuildNearbyDisplayRowsInput {
  nearbyOpponents: ChallengeNearbyOpponent[];
  myStanding: ChallengeProjectedMyStanding;
  /** Current live score from room participant state, not the API-time score. */
  liveScore: number;
  meUserId: string | null;
  slots?: number;
}

/**
 * Builds the fixed-height nearby section.
 *
 * This intentionally keeps the master slot model:
 * - when no visible opponents have been passed, self sits at the bottom
 *   below the four closest ahead players;
 * - after one local pass, one passed row is shown below self;
 * - after two or more local passes, self is centered with two rows above and
 *   two rows below whenever the backend window has enough data;
 * - the sticky self row is rendered separately by the panel.
 *
 * Ranks shown here are local display estimates only. The backend remains the
 * authoritative source and the frontend never sends score/rank back.
 */
export function buildChallengeNearbyDisplayRows({
  nearbyOpponents,
  myStanding,
  liveScore,
  meUserId,
  slots = 5,
}: BuildNearbyDisplayRowsInput): ChallengeDisplayRow[] {
  const passedMax = Math.floor((slots - 1) / 2);

  const opponents = meUserId
    ? nearbyOpponents.filter((opponent) => opponent.userId !== meUserId)
    : nearbyOpponents;

  const displayMyRank = myStanding.projectedRank;

  if (displayMyRank !== null && liveScore > 0) {
    return buildRankCenteredRows({
      opponents,
      myStanding,
      liveScore,
      displayMyRank,
      slots,
    });
  }

  const ahead = opponents
    .filter((opponent) =>
      isOpponentAheadOfViewer(opponent, displayMyRank, liveScore),
    )
    .sort(compareRankedOpponents);

  const passed = opponents
    .filter(
      (opponent) =>
        !isOpponentAheadOfViewer(opponent, displayMyRank, liveScore),
    )
    .sort(compareRankedOpponents);

  const passedSlots = Math.min(passed.length, passedMax);
  const aheadSlots = slots - 1 - passedSlots;
  const displayAhead = ahead.slice(-aheadSlots);
  const displayPassed = passed.slice(0, passedSlots);
  const aheadPadCount = Math.max(0, aheadSlots - displayAhead.length);
  const passedPadCount = Math.max(0, passedSlots - displayPassed.length);

  const rows: ChallengeDisplayRow[] = [];

  for (let index = 0; index < aheadPadCount; index += 1) {
    rows.push({ type: "placeholder", key: `ap:${index}` });
  }

  displayAhead.forEach((opponent, index) => {
    const fallbackRank =
      displayMyRank !== null
        ? displayMyRank - (displayAhead.length - index)
        : null;
    rows.push({
      type: "opponent",
      opponent,
      approxRank: opponent.rank ?? clampRank(fallbackRank, myStanding.totalPlayers),
      liveGap: opponent.bestScore - liveScore,
      key: opponent.userId,
    });
  });

  rows.push({
    type: "self",
    standing: myStanding,
    approxRank: displayMyRank,
    key: "self",
  });

  displayPassed.forEach((opponent, index) => {
    const fallbackRank =
      displayMyRank !== null ? displayMyRank + index + 1 : null;
    rows.push({
      type: "opponent",
      opponent,
      approxRank: opponent.rank ?? clampRank(fallbackRank, myStanding.totalPlayers),
      liveGap: opponent.bestScore - liveScore,
      key: opponent.userId,
    });
  });

  for (let index = 0; index < passedPadCount; index += 1) {
    rows.push({ type: "placeholder", key: `pp:${index}` });
  }

  return rows;
}

function buildRankCenteredRows({
  opponents,
  myStanding,
  liveScore,
  displayMyRank,
  slots,
}: {
  opponents: ChallengeNearbyOpponent[];
  myStanding: ChallengeProjectedMyStanding;
  liveScore: number;
  displayMyRank: number;
  slots: number;
}): ChallengeDisplayRow[] {
  const maxBelowSlots = Math.floor((slots - 1) / 2);
  const remainingPlayersBelow =
    myStanding.totalPlayers > 0
      ? Math.max(0, myStanding.totalPlayers - displayMyRank)
      : maxBelowSlots;
  const belowSlots = Math.min(maxBelowSlots, remainingPlayersBelow);
  const aboveSlots = slots - 1 - belowSlots;
  const rankedOpponents = opponents
    .filter((opponent) => opponent.rank !== null)
    .sort(compareRankedOpponents);
  const rankedAbove = rankedOpponents
    .filter((opponent) => opponent.rank !== null && opponent.rank < displayMyRank)
    .slice(-aboveSlots);
  const rankedBelow = rankedOpponents
    .filter((opponent) => opponent.rank !== null && opponent.rank > displayMyRank)
    .slice(0, belowSlots);
  const selectedIds = new Set<string>();
  rankedAbove.forEach((opponent) => selectedIds.add(opponent.userId));
  rankedBelow.forEach((opponent) => selectedIds.add(opponent.userId));

  const fallbackAbove = opponents
    .filter(
      (opponent) =>
        !selectedIds.has(opponent.userId) &&
        isOpponentAheadOfViewer(opponent, displayMyRank, liveScore),
    )
    .sort(compareAheadFallbackOpponents)
    .slice(0, Math.max(0, aboveSlots - rankedAbove.length));
  fallbackAbove.forEach((opponent) => selectedIds.add(opponent.userId));

  const fallbackBelow = opponents
    .filter(
      (opponent) =>
        !selectedIds.has(opponent.userId) &&
        !isOpponentAheadOfViewer(opponent, displayMyRank, liveScore),
    )
    .sort(comparePassedFallbackOpponents)
    .slice(0, Math.max(0, belowSlots - rankedBelow.length));

  const above = [...fallbackAbove, ...rankedAbove]
    .slice(-aboveSlots)
    .sort(compareDisplayAboveOpponents);
  const below = [...rankedBelow, ...fallbackBelow]
    .slice(0, belowSlots)
    .sort(compareDisplayBelowOpponents);

  const rows: ChallengeDisplayRow[] = [];
  const abovePadCount = Math.max(0, aboveSlots - above.length);
  const belowPadCount = Math.max(0, belowSlots - below.length);

  for (let index = 0; index < abovePadCount; index += 1) {
    rows.push({ type: "placeholder", key: `ap:${index}` });
  }

  above.forEach((opponent, index) => {
    const fallbackRank = displayMyRank - (above.length - index);
    rows.push({
      type: "opponent",
      opponent,
      approxRank: opponent.rank ?? clampRank(fallbackRank, myStanding.totalPlayers),
      liveGap: opponent.bestScore - liveScore,
      key: opponent.userId,
    });
  });

  rows.push({
    type: "self",
    standing: myStanding,
    approxRank: displayMyRank,
    key: "self",
  });

  below.forEach((opponent, index) => {
    const fallbackRank = displayMyRank + index + 1;
    rows.push({
      type: "opponent",
      opponent,
      approxRank: opponent.rank ?? clampRank(fallbackRank, myStanding.totalPlayers),
      liveGap: opponent.bestScore - liveScore,
      key: opponent.userId,
    });
  });

  for (let index = 0; index < belowPadCount; index += 1) {
    rows.push({ type: "placeholder", key: `pp:${index}` });
  }

  return rows;
}

function compareRankedOpponents(
  a: ChallengeNearbyOpponent,
  b: ChallengeNearbyOpponent,
): number {
  if (a.rank !== null && b.rank !== null && a.rank !== b.rank) {
    return a.rank - b.rank;
  }
  return b.bestScore - a.bestScore;
}

function compareAheadFallbackOpponents(
  a: ChallengeNearbyOpponent,
  b: ChallengeNearbyOpponent,
): number {
  if (a.rank !== null || b.rank !== null) {
    if (a.rank === null) return 1;
    if (b.rank === null) return -1;
    return b.rank - a.rank;
  }
  return a.bestScore - b.bestScore;
}

function comparePassedFallbackOpponents(
  a: ChallengeNearbyOpponent,
  b: ChallengeNearbyOpponent,
): number {
  if (a.rank !== null || b.rank !== null) {
    if (a.rank === null) return 1;
    if (b.rank === null) return -1;
    return a.rank - b.rank;
  }
  return b.bestScore - a.bestScore;
}

function compareDisplayAboveOpponents(
  a: ChallengeNearbyOpponent,
  b: ChallengeNearbyOpponent,
): number {
  if (a.rank !== null || b.rank !== null) {
    if (a.rank === null) return -1;
    if (b.rank === null) return 1;
    return a.rank - b.rank;
  }
  return b.bestScore - a.bestScore;
}

function compareDisplayBelowOpponents(
  a: ChallengeNearbyOpponent,
  b: ChallengeNearbyOpponent,
): number {
  if (a.rank !== null || b.rank !== null) {
    if (a.rank === null) return 1;
    if (b.rank === null) return -1;
    return a.rank - b.rank;
  }
  return b.bestScore - a.bestScore;
}

function isOpponentAheadOfViewer(
  opponent: ChallengeNearbyOpponent,
  displayMyRank: number | null,
  liveScore: number,
): boolean {
  if (opponent.bestScore > liveScore) return true;
  if (opponent.bestScore < liveScore) return false;
  if (opponent.rank !== null && displayMyRank !== null) {
    return opponent.rank < displayMyRank;
  }
  return opponent.relation === "ahead";
}

function clampRank(
  rank: number | null,
  totalPlayers: number,
): number | null {
  if (rank === null) return null;
  return Math.max(1, totalPlayers > 0 ? Math.min(totalPlayers, rank) : rank);
}
