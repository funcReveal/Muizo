import type { ChallengeNearbyOpponent, ChallengeProjectedMyStanding } from "./projectionTypes";

export type ChallengeDisplayRow =
  | {
      type: "opponent";
      opponent: ChallengeNearbyOpponent;
      approxRank: number | null;
      /** bestScore - currentLiveScore. Positive = opponent is ahead; negative = we surpassed them. */
      liveGap: number;
      key: string;
    }
  | { type: "self"; standing: ChallengeProjectedMyStanding; key: string }
  | { type: "placeholder"; key: string };

interface BuildNearbyDisplayRowsInput {
  nearbyOpponents: ChallengeNearbyOpponent[];
  myStanding: ChallengeProjectedMyStanding;
  /** Current live score from room participant state — NOT myStanding.liveScore (API-time). */
  liveScore: number;
  meUserId: string | null;
  slots?: number;
}

/**
 * Pure function: builds the fixed-height nearby section rows.
 *
 * Layout adapts based on how many passed opponents are available:
 *   passedSlots = min(available passed, PASSED_MAX)      [0..2 for slots=5]
 *   aheadSlots  = slots - 1 - passedSlots                [2..4 for slots=5]
 *
 * This keeps self anchored at the bottom when the viewer is near the tail of
 * the ranking (no passed opponents → 4 ahead + self), and shifts toward
 * symmetric 2+self+2 as the viewer climbs and accumulates passed opponents.
 *
 * Total rows always equals `slots`. Empty positions are filled with
 * placeholders (above self only — passed padding never needed).
 *
 * Classification uses liveScore (current), never the stale relation/gapFromMe
 * fields on ChallengeNearbyOpponent (those are API-time snapshots).
 */
export function buildChallengeNearbyDisplayRows({
  nearbyOpponents,
  myStanding,
  liveScore,
  meUserId,
  slots = 5,
}: BuildNearbyDisplayRowsInput): ChallengeDisplayRow[] {
  // Maximum passed slots (symmetric split for full layout).
  const PASSED_MAX = Math.floor((slots - 1) / 2); // 2 for slots=5

  const opponents = meUserId
    ? nearbyOpponents.filter((n) => n.userId !== meUserId)
    : nearbyOpponents;

  // Classify using current liveScore, not the stale API-time relation field.
  const ahead = opponents
    .filter((n) => n.bestScore > liveScore)
    .sort((a, b) => b.bestScore - a.bestScore); // descending; slice(-N) yields closest N

  const passed = opponents
    .filter((n) => n.bestScore <= liveScore)
    .sort((a, b) => b.bestScore - a.bestScore); // descending; first element is closest

  // Allocate passed slots first (up to PASSED_MAX), then give the remainder to
  // ahead. When there are no passed opponents, aheadSlots == slots-1 and self
  // sits at the bottom of the window.
  const passedSlots = Math.min(passed.length, PASSED_MAX);
  const aheadSlots  = slots - 1 - passedSlots;

  const displayAhead  = ahead.slice(-aheadSlots);   // closest aheadSlots ahead
  const displayPassed = passed.slice(0, passedSlots); // closest passedSlots passed

  // Placeholders only appear above self (unused ahead budget).
  // passedPadCount is always 0: displayPassed.length === passedSlots by construction.
  const aheadPadCount = Math.max(0, aheadSlots - displayAhead.length);

  // ---------------------------------------------------------------------------
  // Rank estimation anchor
  //
  // myStanding.projectedRank is authoritative at the time of the last API call
  // (when liveScore === myStanding.liveScore). Between refreshes the viewer may
  // have surpassed additional opponents locally. We count how many opponents in
  // our window moved from ahead→passed since that call and subtract them for a
  // better in-session estimate. This is bounded by our local window (≤6 entries)
  // and is superseded by the backend's projectedRank on next refresh.
  // ---------------------------------------------------------------------------
  const apiScore = myStanding.liveScore;
  const newlyPassedCount = nearbyOpponents.filter(
    (o) => o.bestScore > apiScore && o.bestScore <= liveScore,
  ).length;
  const estimatedMyRank =
    myStanding.projectedRank !== null
      ? Math.max(1, myStanding.projectedRank - newlyPassedCount)
      : null;
  const { totalPlayers } = myStanding;
  const clampRank = (r: number) =>
    Math.max(1, totalPlayers > 0 ? Math.min(totalPlayers, r) : r);

  const rows: ChallengeDisplayRow[] = [];

  for (let i = 0; i < aheadPadCount; i++) {
    rows.push({ type: "placeholder", key: `ap${i}` });
  }

  // displayAhead is descending; last element is closest to self.
  // Closest ahead → estimatedMyRank - 1; next → estimatedMyRank - 2; etc.
  displayAhead.forEach((opp, i) => {
    const approxRank =
      estimatedMyRank !== null
        ? clampRank(estimatedMyRank - (displayAhead.length - i))
        : null;
    const liveGap = opp.bestScore - liveScore; // always positive in this branch
    rows.push({ type: "opponent", opponent: opp, approxRank, liveGap, key: opp.userId });
  });

  rows.push({ type: "self", standing: myStanding, key: "self" });

  // displayPassed is descending; first element is closest to self.
  // Closest passed → estimatedMyRank + 1; next → estimatedMyRank + 2; etc.
  displayPassed.forEach((opp, i) => {
    const approxRank =
      estimatedMyRank !== null ? clampRank(estimatedMyRank + i + 1) : null;
    const liveGap = opp.bestScore - liveScore; // always ≤ 0 in this branch
    rows.push({ type: "opponent", opponent: opp, approxRank, liveGap, key: opp.userId });
  });

  return rows;
}
