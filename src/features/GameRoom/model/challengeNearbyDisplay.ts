import type { ChallengeNearbyOpponent, ChallengeProjectedMyStanding } from "./projectionTypes";

export type ChallengeDisplayRow =
  | { type: "opponent"; opponent: ChallengeNearbyOpponent; key: string }
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

  const rows: ChallengeDisplayRow[] = [];

  for (let i = 0; i < aheadPadCount; i++) {
    rows.push({ type: "placeholder", key: `ap${i}` });
  }
  for (const opp of displayAhead) {
    rows.push({ type: "opponent", opponent: opp, key: opp.userId });
  }
  rows.push({ type: "self", standing: myStanding, key: "self" });
  for (const opp of displayPassed) {
    rows.push({ type: "opponent", opponent: opp, key: opp.userId });
  }
  for (let i = 0; i < passedPadCount; i++) {
    rows.push({ type: "placeholder", key: `pp${i}` });
  }

  return rows;
}
