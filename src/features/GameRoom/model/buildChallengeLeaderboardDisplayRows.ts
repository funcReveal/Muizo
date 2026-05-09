/**
 * buildChallengeLeaderboardDisplayRows
 *
 * Pure function that converts raw API projection data into a flat, ordered list
 * of typed display rows for the challenge leaderboard panel.
 *
 * Layout modes
 * ─────────────
 * top-window  projectedRank ≤ 10 — self injected into live-merged Top 10.
 * top-eleven  projectedRank = 11  — official Top 10 shown, self at slot #11.
 * nearby      projectedRank ≥ 12 or null — Top 5 + ellipsis + 5 nearby rows.
 *
 * Key stability
 * ─────────────
 * Row keys are stable across layout-mode transitions so motion/react layout
 * animations can track element movements between modes:
 *   player row  →  `player:${userId}`
 *   self row    →  `self:list`   (sticky bar uses a separate key)
 *   ellipsis    →  `ellipsis:nearby`
 *   placeholder →  `placeholder:top:${n}` | `placeholder:nearby:${n}`
 */

import type {
  ChallengeLeaderboardEntry,
  ChallengeNearbyOpponent,
  ChallengeProjectedLeaderboardResponse,
} from "./projectionTypes";
import { buildChallengeNearbyDisplayRows } from "./challengeNearbyDisplay";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type ChallengeLayoutMode = "top-window" | "top-eleven" | "nearby";

export type ChallengeLeaderboardDisplayRow =
  | {
      kind: "player";
      /** `player:${userId}` — stable across layout modes */
      key: string;
      userId: string;
      section: "top";
      entry: ChallengeLeaderboardEntry;
      isMe: boolean;
      /**
       * entry.bestScore − viewerScore.
       * null means this row does not display the gap (to reduce clutter).
       */
      liveGap: number | null;
    }
  | {
      kind: "player";
      /** `player:${userId}` — stable across layout modes */
      key: string;
      userId: string;
      section: "nearby";
      opponent: ChallengeNearbyOpponent;
      approxRank: number | null;
      /** bestScore − liveScore. Positive = ahead; negative = passed. */
      liveGap: number;
    }
  | {
      kind: "self";
      /** Fixed key for the list row; sticky bar must NOT share this key. */
      key: "self:list";
      section: "top-window" | "top-eleven" | "nearby";
      /**
       * Gap to the player directly above self in the displayed list.
       * Positive = behind; negative = already surpassed locally.
       */
      gapToNext: number | null;
    }
  | {
      kind: "ellipsis";
      key: "ellipsis:nearby";
    }
  | {
      kind: "placeholder";
      key: string;
    };

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

interface BuildInput {
  data: ChallengeProjectedLeaderboardResponse;
  viewerScore: number;
  meUserId: string | null;
}

export function buildChallengeLeaderboardDisplayRows({
  data,
  viewerScore,
  meUserId,
}: BuildInput): {
  layoutMode: ChallengeLayoutMode;
  listRows: ChallengeLeaderboardDisplayRow[];
} {
  const projectedRank = data.myStanding.projectedRank;

  const layoutMode: ChallengeLayoutMode =
    projectedRank !== null && projectedRank <= 10
      ? "top-window"
      : projectedRank === 11
        ? "top-eleven"
        : "nearby";

  switch (layoutMode) {
    case "top-window":
      return {
        layoutMode,
        listRows: buildTopWindowRows(data, viewerScore, meUserId, projectedRank!),
      };
    case "top-eleven":
      return { layoutMode, listRows: buildTopElevenRows(data, viewerScore) };
    case "nearby":
      return { layoutMode, listRows: buildNearbyRows(data, viewerScore, meUserId) };
  }
}

// ---------------------------------------------------------------------------
// top-window mode (projectedRank ≤ 10)
// ---------------------------------------------------------------------------

function buildTopWindowRows(
  data: ChallengeProjectedLeaderboardResponse,
  viewerScore: number,
  meUserId: string | null,
  projectedRank: number,
): ChallengeLeaderboardDisplayRow[] {
  const TARGET = 10;
  // 0-based slot index where self will be inserted.
  const insertIdx = Math.min(projectedRank - 1, TARGET - 1);

  // Always exclude the viewer's official entry so ChallengeSelfRow (live data)
  // is the sole representation of the viewer in the list.
  const officialsWithoutMe = data.topEntries
    .filter((e) => e.userId !== meUserId)
    .slice(0, TARGET); // guard against more than TARGET entries

  const rows: ChallengeLeaderboardDisplayRow[] = [];
  let selfInserted = false;
  let oi = 0;

  for (let slot = 0; slot < TARGET; slot++) {
    if (!selfInserted && slot === insertIdx) {
      rows.push({ kind: "self", key: "self:list", section: "top-window", gapToNext: null });
      selfInserted = true;
    } else if (oi < officialsWithoutMe.length) {
      const entry = officialsWithoutMe[oi++];
      rows.push({
        kind: "player",
        key: `player:${entry.userId}`,
        userId: entry.userId,
        section: "top",
        entry,
        isMe: false,
        liveGap: entry.bestScore - viewerScore,
      });
    } else if (!selfInserted) {
      // Ran out of officials before reaching insertIdx — self goes here.
      rows.push({ kind: "self", key: "self:list", section: "top-window", gapToNext: null });
      selfInserted = true;
    } else {
      rows.push({ kind: "placeholder", key: `placeholder:top:${slot}` });
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// top-eleven mode (projectedRank = 11)
// ---------------------------------------------------------------------------

function buildTopElevenRows(
  data: ChallengeProjectedLeaderboardResponse,
  viewerScore: number,
): ChallengeLeaderboardDisplayRow[] {
  const TARGET = 10;
  const topTen = data.topEntries.slice(0, TARGET);
  const rows: ChallengeLeaderboardDisplayRow[] = [];

  topTen.forEach((entry, i) => {
    // Show liveGap only for the #10 entry — the direct target the viewer needs
    // to surpass to enter the Top 10. Showing gaps for all 10 rows would clutter
    // the panel on narrow screens without adding meaningful context.
    const isRankTen = i === TARGET - 1 && topTen.length === TARGET;
    rows.push({
      kind: "player",
      key: `player:${entry.userId}`,
      userId: entry.userId,
      section: "top",
      entry,
      isMe: false,
      liveGap: isRankTen ? entry.bestScore - viewerScore : null,
    });
  });

  // Pad with placeholders when topEntries has fewer than 10 entries.
  for (let i = topTen.length; i < TARGET; i++) {
    rows.push({ kind: "placeholder", key: `placeholder:top:${i}` });
  }

  // Self row at slot #11, with the gap to the #10 entry.
  const gapToNext =
    topTen.length >= TARGET ? topTen[TARGET - 1].bestScore - viewerScore : null;

  rows.push({
    kind: "self",
    key: "self:list",
    section: "top-eleven",
    gapToNext,
  });

  return rows;
}

// ---------------------------------------------------------------------------
// nearby mode (projectedRank ≥ 12 or null)
// ---------------------------------------------------------------------------

function buildNearbyRows(
  data: ChallengeProjectedLeaderboardResponse,
  viewerScore: number,
  meUserId: string | null,
): ChallengeLeaderboardDisplayRow[] {
  const TARGET_TOP = 5;
  const topFive = data.topEntries.slice(0, TARGET_TOP);
  const rows: ChallengeLeaderboardDisplayRow[] = [];

  // Top-5 entries: no liveGap — these players are far above the viewer and
  // showing a large negative gap would be discouraging without being actionable.
  topFive.forEach((entry) => {
    rows.push({
      kind: "player",
      key: `player:${entry.userId}`,
      userId: entry.userId,
      section: "top",
      entry,
      isMe: false,
      liveGap: null,
    });
  });

  // Pad top section to TARGET_TOP.
  for (let i = topFive.length; i < TARGET_TOP; i++) {
    rows.push({ kind: "placeholder", key: `placeholder:top:${i}` });
  }

  // Ellipsis separator between top section and nearby section.
  rows.push({ kind: "ellipsis", key: "ellipsis:nearby" });

  // Nearby section (5 slots: mix of ahead opponents, self, and passed opponents).
  const nearbyDisplayRows = buildChallengeNearbyDisplayRows({
    nearbyOpponents: data.nearbyOpponents,
    myStanding: data.myStanding,
    liveScore: viewerScore,
    meUserId,
    slots: 5,
  });

  let nearbyPlaceholderIdx = 0;
  for (const row of nearbyDisplayRows) {
    if (row.type === "opponent") {
      rows.push({
        kind: "player",
        key: `player:${row.opponent.userId}`,
        userId: row.opponent.userId,
        section: "nearby",
        opponent: row.opponent,
        approxRank: row.approxRank,
        liveGap: row.liveGap,
      });
    } else if (row.type === "self") {
      rows.push({
        kind: "self",
        key: "self:list",
        section: "nearby",
        gapToNext: null,
      });
    } else {
      // placeholder
      rows.push({
        kind: "placeholder",
        key: `placeholder:nearby:${nearbyPlaceholderIdx++}`,
      });
    }
  }

  return rows;
}
