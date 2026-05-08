import React from "react";
import type {
  ChallengeLeaderboardEntry,
  ChallengeNearbyOpponent,
  ChallengeProjectedMyStanding,
} from "../../model/projectionTypes";
import PlayerAvatar from "../../../../shared/ui/playerAvatar/PlayerAvatar";
import { normalizeRoomDisplayText } from "../../../../shared/utils/text";

// ---------------------------------------------------------------------------
// Top entry row (Top 5 section)
// ---------------------------------------------------------------------------

interface ChallengeTopEntryRowProps {
  entry: ChallengeLeaderboardEntry;
  isMe?: boolean;
}

export const ChallengeTopEntryRow = React.memo(
  function ChallengeTopEntryRow({ entry, isMe }: ChallengeTopEntryRowProps) {
    return (
      <div
        className={`game-room-score-row challenge-lb-row flex items-center justify-between text-sm ${
          isMe
            ? "bg-amber-500/15 ring-1 ring-amber-500/30"
            : ""
        }`}
      >
        <span className="truncate flex items-center gap-2">
          <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums leading-none text-slate-500">
            #{entry.rank}
          </span>
          <span className="game-room-score-row-avatar-wrap">
            <PlayerAvatar
              username={entry.displayName}
              avatarUrl={entry.avatarUrl}
              size={38}
              contentSize={30}
              className="player-avatar--scoreboard shrink-0"
            />
          </span>
          <span className="truncate font-medium text-slate-200">
            {entry.displayName}
          </span>
        </span>
        <span className="font-mono text-xs font-semibold text-slate-300 shrink-0">
          {entry.bestScore.toLocaleString()}
          {entry.maxCombo > 0 && (
            <span className="text-slate-500 font-normal">×{entry.maxCombo}</span>
          )}
        </span>
      </div>
    );
  },
);

// ---------------------------------------------------------------------------
// Nearby opponent row (Nearby section)
// ---------------------------------------------------------------------------

interface ChallengeNearbyRowProps {
  opponent: ChallengeNearbyOpponent;
  liveScore?: number;
}

export const ChallengeNearbyRow = React.memo(
  function ChallengeNearbyRow({ opponent, liveScore }: ChallengeNearbyRowProps) {
    const isPassed = liveScore !== undefined
      ? opponent.bestScore <= liveScore
      : opponent.relation === "passed";
    const gapAbs = Math.abs(opponent.gapFromMe);

    return (
      <div
        className={`game-room-score-row challenge-lb-nearby-row flex items-center justify-between text-sm ${
          isPassed ? "opacity-60" : ""
        }`}
      >
        <span className="truncate flex items-center gap-2">
          <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums leading-none text-slate-500">
            #{opponent.rank ?? "—"}
          </span>
          <span className="game-room-score-row-avatar-wrap">
            <PlayerAvatar
              username={opponent.displayName}
              avatarUrl={opponent.avatarUrl}
              size={38}
              contentSize={30}
              className="player-avatar--scoreboard shrink-0"
            />
          </span>
          <span className="truncate text-slate-300">
            {opponent.displayName}
          </span>
        </span>
        <div className="flex shrink-0 flex-col items-end">
          <span className="font-mono text-xs font-semibold text-slate-400">
            {opponent.bestScore.toLocaleString()}
            {opponent.maxCombo > 0 && (
              <span className="text-slate-600 font-normal">×{opponent.maxCombo}</span>
            )}
          </span>
          <span
            className={`text-[10px] font-medium leading-tight ${
              isPassed ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {isPassed
              ? `+${gapAbs.toLocaleString()}`
              : `-${gapAbs.toLocaleString()}`}
          </span>
        </div>
      </div>
    );
  },
);

// ---------------------------------------------------------------------------
// Separator row
// ---------------------------------------------------------------------------

export const ChallengeSeparatorRow = React.memo(
  function ChallengeSeparatorRow({ label }: { label?: string }) {
    if (!label) {
      return <div className="my-0.5 h-px bg-white/10 mx-2.5" />;
    }
    return (
      <div className="my-0.5 flex items-center gap-2 px-2.5">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-500">{label}</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
    );
  },
);

// ---------------------------------------------------------------------------
// Ellipsis row — visually occupies one row height, represents "..."
// ---------------------------------------------------------------------------

export const ChallengeEllipsisRow = React.memo(
  function ChallengeEllipsisRow() {
    return (
      <div className="flex items-center justify-center py-1.5 text-slate-600 select-none">
        <span className="text-base tracking-[0.35em] leading-none">···</span>
      </div>
    );
  },
);

// ---------------------------------------------------------------------------
// Placeholder row (padding when < expected entries)
// ---------------------------------------------------------------------------

export const ChallengePlaceholderRow = React.memo(
  function ChallengePlaceholderRow({ dim = false }: { dim?: boolean }) {
    return (
      <div
        className={`game-room-score-row flex items-center justify-between text-sm ${
          dim ? "opacity-10" : "opacity-20"
        }`}
      >
        <span className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-center text-xs text-slate-600">—</span>
          <div className="h-[38px] w-[38px] rounded-full bg-white/10 shrink-0" />
          <div className="h-2.5 w-24 rounded bg-white/10" />
        </span>
        <div className="h-2.5 w-14 rounded bg-white/10" />
      </div>
    );
  },
);

// ---------------------------------------------------------------------------
// Self row — inline (nearby section) and fixed at bottom of panel
// ---------------------------------------------------------------------------

interface ChallengeSelfRowProps {
  standing: ChallengeProjectedMyStanding;
  isSettled?: boolean;
  displayName?: string;
  avatarUrl?: string | null;
  /** Current game combo (from room participant state) */
  combo?: number;
  /** Increments on each score gain — drives React key for animation restart */
  gainAnimKey?: number;
  /** Delta to animate as "+N" floating text */
  gainAmount?: number;
}

export const ChallengeSelfRow = React.memo(
  function ChallengeSelfRow({
    standing,
    isSettled = false,
    displayName,
    avatarUrl,
    combo = 0,
    gainAnimKey = 0,
    gainAmount = 0,
  }: ChallengeSelfRowProps) {
    const { liveScore, projectedRank, officialRank, totalPlayers } = standing;

    const name = normalizeRoomDisplayText(displayName ?? "", "你");

    const rankLabel = isSettled
      ? officialRank !== null
        ? `#${officialRank}`
        : "—"
      : projectedRank !== null
        ? `#${projectedRank}`
        : "—";

    const rankColor = isSettled ? "text-amber-300" : "text-sky-300";

    return (
      <div className="game-room-score-row game-room-score-row--me challenge-lb-self-row flex items-center justify-between text-sm bg-white/8 ring-1 ring-white/15">
        <span className="truncate flex items-center gap-2">
          <span
            className={`w-5 shrink-0 text-center text-xs font-bold tabular-nums leading-none ${rankColor}`}
          >
            {rankLabel}
          </span>
          <span className="game-room-score-row-avatar-wrap">
            <PlayerAvatar
              username={name}
              avatarUrl={avatarUrl ?? null}
              size={38}
              contentSize={30}
              isMe
              className="player-avatar--scoreboard shrink-0"
            />
          </span>
          <span className="truncate font-medium text-white/90">
            {name}
          </span>
          <span className="game-room-score-row-you-badge">YOU</span>
        </span>
        <div className="shrink-0 text-right relative">
          <div className="font-mono text-sm font-semibold text-emerald-300 tabular-nums">
            {liveScore.toLocaleString()}
            {combo > 0 && (
              <span className="text-slate-500 font-normal">×{combo}</span>
            )}
          </div>
          {totalPlayers > 0 && (
            <div className="text-[10px] text-slate-500 leading-tight">
              /{totalPlayers.toLocaleString()}人
            </div>
          )}
          {gainAmount > 0 && (
            <span
              key={gainAnimKey}
              className="challenge-lb-gain-float"
              aria-hidden="true"
            >
              +{gainAmount.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    );
  },
);
