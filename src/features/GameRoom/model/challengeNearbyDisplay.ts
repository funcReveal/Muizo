import type { ChallengeNearbyOpponent, ChallengeProjectedMyStanding } from "./projectionTypes";

export type ChallengeDisplayRow =
  | { type: "opponent"; opponent: ChallengeNearbyOpponent; approxRank: number | null; key: string }
  | { type: "self"; standing: ChallengeProjectedMyStanding; key: string }
  | { type: "placeholder"; key: string };

interface BuildNearbyDisplayRowsInput {
  nearbyOpponents: ChallengeNearbyOpponent[];
  myStanding: ChallengeProjectedMyStanding;
  liveScore: number;
  meUserId: string | null;
  slots?: number;
}

/**
 * Pure function: builds the fixed-height nearby section rows.
 * Layout: [ahead pads][displayAhead][self][displayPassed][passed pads]
 * Total rows = slots (default 5).
 *
 * Relation is derived from liveScore vs bestScore (not the stale relation field).
 */
export function buildChallengeNearbyDisplayRows({
  nearbyOpponents,
  myStanding,
  liveScore,
  meUserId,
  slots = 5,
}: BuildNearbyDisplayRowsInput): ChallengeDisplayRow[] {
  const opponents = meUserId
    ? nearbyOpponents.filter((n) => n.userId !== meUserId)
    : nearbyOpponents;

  const ahead = opponents
    .filter((n) => n.bestScore > liveScore)
    .sort((a, b) => b.bestScore - a.bestScore);

  const passed = opponents
    .filter((n) => n.bestScore <= liveScore)
    .sort((a, b) => b.bestScore - a.bestScore);

  const passedToShow = Math.min(passed.length, 2);
  const aheadToShow = slots - 1 - passedToShow;

  const displayAhead = aheadToShow > 0 ? ahead.slice(-aheadToShow) : [];
  const displayPassed = passed.slice(0, passedToShow);

  const aheadPadCount = Math.max(0, aheadToShow - displayAhead.length);
  const passedPadCount = Math.max(0, passedToShow - displayPassed.length);

  // Rank estimation anchor.
  //
  // myStanding.projectedRank is the backend-computed rank at the time of the last
  // API call (when liveScore === myStanding.liveScore). Since then the player may
  // have surpassed additional opponents locally. We count how many opponents in our
  // window moved from ahead (at API-call score) to passed (at current liveScore) and
  // subtract that from the API-time rank to get a better in-session estimate.
  //
  // This is still approximate — opponents outside our local window are not counted —
  // but it keeps the displayed ranks in sync with local reclassification until the
  // next backend refresh updates projectedRank authoritatively.
  const apiScore = myStanding.liveScore;
  const newlyPassedCount = nearbyOpponents.filter(
    (o) => o.bestScore > apiScore && o.bestScore <= liveScore,
  ).length;
  const estimatedMyRank =
    myStanding.projectedRank !== null
      ? Math.max(1, myStanding.projectedRank - newlyPassedCount)
      : null;
  const totalPlayers = myStanding.totalPlayers;
  const clampRank = (r: number) =>
    Math.max(1, totalPlayers > 0 ? Math.min(totalPlayers, r) : r);

  const rows: ChallengeDisplayRow[] = [];

  for (let i = 0; i < aheadPadCount; i++) {
    rows.push({ type: "placeholder", key: `ap${i}` });
  }
  // displayAhead is in descending bestScore order; last element is closest to me.
  // Closest ahead → estimatedMyRank - 1; farthest in the window → estimatedMyRank - N.
  displayAhead.forEach((opp, i) => {
    const approxRank =
      estimatedMyRank !== null
        ? clampRank(estimatedMyRank - (displayAhead.length - i))
        : null;
    rows.push({ type: "opponent", opponent: opp, approxRank, key: opp.userId });
  });
  rows.push({ type: "self", standing: myStanding, key: "self" });
  // displayPassed is in descending bestScore order; first element is closest to me.
  displayPassed.forEach((opp, i) => {
    const approxRank =
      estimatedMyRank !== null ? clampRank(estimatedMyRank + i + 1) : null;
    rows.push({ type: "opponent", opponent: opp, approxRank, key: opp.userId });
  });
  for (let i = 0; i < passedPadCount; i++) {
    rows.push({ type: "placeholder", key: `pp${i}` });
  }

  return rows;
}
