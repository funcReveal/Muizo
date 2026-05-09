import React from "react";
import type {
  ChallengeLeaderboardEntry,
  ChallengeNearbyOpponent,
  ChallengeProjectedMyStanding,
} from "../../model/projectionTypes";
import PlayerAvatar from "../../../../shared/ui/playerAvatar/PlayerAvatar";
import { normalizeRoomDisplayText } from "../../../../shared/utils/text";

const formatScoreCombo = (score: number, combo: number) =>
  `${score.toLocaleString()}${combo > 0 ? `\u00d7${combo}` : ""}`;
const SCOREBOARD_AVATAR_SIZE = 32;
const SCOREBOARD_AVATAR_CONTENT_SIZE = 26;

interface ChallengeTopEntryRowProps {
  entry: ChallengeLeaderboardEntry;
  isMe?: boolean;
}

export const ChallengeTopEntryRow = React.memo(
  function ChallengeTopEntryRow({ entry, isMe }: ChallengeTopEntryRowProps) {
    return (
      <div
        className={`game-room-score-row challenge-lb-row flex items-center justify-between text-sm ${
          isMe ? "bg-amber-500/15 ring-1 ring-amber-500/30" : ""
        }`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
          <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums leading-none text-slate-500">
            #{entry.rank}
          </span>
          <span className="game-room-score-row-avatar-wrap">
            <PlayerAvatar
              username={entry.displayName}
              avatarUrl={entry.avatarUrl}
              size={SCOREBOARD_AVATAR_SIZE}
              contentSize={SCOREBOARD_AVATAR_CONTENT_SIZE}
              className="player-avatar--scoreboard shrink-0"
            />
          </span>
          <span className="truncate font-medium text-slate-200">
            {entry.displayName}
          </span>
        </span>
        <span className="shrink-0 whitespace-nowrap font-mono text-xs font-semibold text-slate-300">
          {formatScoreCombo(entry.bestScore, entry.maxCombo)}
        </span>
      </div>
    );
  },
);

interface ChallengeNearbyRowProps {
  opponent: ChallengeNearbyOpponent;
  approxRank?: number | null;
}

export const ChallengeNearbyRow = React.memo(
  function ChallengeNearbyRow({ opponent, approxRank }: ChallengeNearbyRowProps) {
    const isPassed = opponent.relation === "passed";
    const gapAbs = Math.abs(opponent.gapFromMe);
    const gapText = isPassed
      ? `+${gapAbs.toLocaleString()}`
      : `-${gapAbs.toLocaleString()}`;
    const rankDisplay = (approxRank ?? opponent.rank) != null
      ? `#${approxRank ?? opponent.rank}`
      : "--";

    return (
      <div
        className={`game-room-score-row challenge-lb-nearby-row flex items-center justify-between text-sm ${
          isPassed ? "opacity-60" : ""
        }`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
          <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums leading-none text-slate-500">
            {rankDisplay}
          </span>
          <span className="game-room-score-row-avatar-wrap">
            <PlayerAvatar
              username={opponent.displayName}
              avatarUrl={opponent.avatarUrl}
              size={SCOREBOARD_AVATAR_SIZE}
              contentSize={SCOREBOARD_AVATAR_CONTENT_SIZE}
              className="player-avatar--scoreboard shrink-0"
            />
          </span>
          <span className="truncate text-slate-300">
            {opponent.displayName}
          </span>
        </span>
        <span className="flex shrink-0 items-baseline gap-1.5 whitespace-nowrap font-mono text-xs">
          <span className="font-semibold text-slate-400">
            {formatScoreCombo(opponent.bestScore, opponent.maxCombo)}
          </span>
          <span
            className={`font-semibold ${
              isPassed ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {gapText}
          </span>
        </span>
      </div>
    );
  },
);

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

export const ChallengeEllipsisRow = React.memo(function ChallengeEllipsisRow() {
  return (
    <div className="flex items-center justify-center py-1.5 text-slate-600 select-none">
      <span className="text-base leading-none">...</span>
    </div>
  );
});

export const ChallengePlaceholderRow = React.memo(
  function ChallengePlaceholderRow({ dim = false }: { dim?: boolean }) {
    return (
      <div
        className={`game-room-score-row flex items-center justify-between text-sm ${
          dim ? "opacity-10" : "opacity-20"
        }`}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2">
          <span className="w-5 shrink-0 text-center text-xs text-slate-600">
            --
          </span>
          <div className="game-room-score-row-avatar-skeleton shrink-0 rounded-full bg-white/10" />
          <div className="h-2.5 w-24 rounded bg-white/10" />
        </span>
        <div className="h-2.5 w-14 shrink-0 rounded bg-white/10" />
      </div>
    );
  },
);

interface ChallengeSelfRowProps {
  standing: ChallengeProjectedMyStanding;
  isSettled?: boolean;
  displayName?: string;
  avatarUrl?: string | null;
  combo?: number;
  gainAnimKey?: number;
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
    const { liveScore, projectedRank, officialRank } = standing;
    const name = normalizeRoomDisplayText(displayName ?? "", "Player");
    const rankLabel = isSettled
      ? officialRank !== null
        ? `#${officialRank}`
        : "--"
      : projectedRank !== null
        ? `#${projectedRank}`
        : "--";
    const rankColor = isSettled ? "text-amber-300" : "text-sky-300";

    return (
      <div className="game-room-score-row game-room-score-row--me challenge-lb-self-row flex items-center justify-between text-sm bg-white/8 ring-1 ring-white/15">
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
          <span
            className={`w-5 shrink-0 text-center text-xs font-bold tabular-nums leading-none ${rankColor}`}
          >
            {rankLabel}
          </span>
          <span className="game-room-score-row-avatar-wrap">
            <PlayerAvatar
              username={name}
              avatarUrl={avatarUrl ?? null}
              size={SCOREBOARD_AVATAR_SIZE}
              contentSize={SCOREBOARD_AVATAR_CONTENT_SIZE}
              isMe
              className="player-avatar--scoreboard shrink-0"
            />
          </span>
          <span className="truncate font-medium text-white/90">{name}</span>
          <span className="game-room-score-row-you-badge">YOU</span>
        </span>
        <span className="relative shrink-0 whitespace-nowrap text-right font-mono text-sm font-semibold tabular-nums text-emerald-300">
          {formatScoreCombo(liveScore, combo)}
          {gainAmount > 0 && (
            <span
              key={gainAnimKey}
              className="challenge-lb-gain-float"
              aria-hidden="true"
            >
              +{gainAmount.toLocaleString()}
            </span>
          )}
        </span>
      </div>
    );
  },
);
