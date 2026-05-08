import React from "react";
import type {
  ChallengeLeaderboardEntry,
  ChallengeNearbyOpponent,
  ChallengeProjectedMyStanding,
} from "../../model/projectionTypes";
import PlayerAvatar from "../../../../shared/ui/playerAvatar/PlayerAvatar";
import { normalizeRoomDisplayText } from "../../../../shared/utils/text";

// ---------------------------------------------------------------------------
// Shared score × maxCombo display
// ---------------------------------------------------------------------------

const ScoreCombo: React.FC<{
  score: number;
  maxCombo: number;
  scoreClass?: string;
  comboClass?: string;
}> = ({ score, maxCombo, scoreClass = "text-amber-400", comboClass = "text-slate-500" }) => (
  <span className={`font-mono text-xs font-semibold ${scoreClass} shrink-0`}>
    {score.toLocaleString()}
    {maxCombo > 0 && (
      <span className={`font-normal ${comboClass}`}>×{maxCombo}</span>
    )}
  </span>
);

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
        className={`challenge-lb-row flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
          isMe
            ? "bg-amber-500/15 ring-1 ring-amber-500/30"
            : "hover:bg-white/5"
        }`}
      >
        <span className="challenge-lb-rank w-6 shrink-0 text-center text-xs font-bold text-slate-400">
          #{entry.rank}
        </span>
        <PlayerAvatar
          username={entry.displayName}
          avatarUrl={entry.avatarUrl}
          size={24}
          className="shrink-0"
        />
        <span className="min-w-0 flex-1 truncate font-medium text-slate-200">
          {entry.displayName}
        </span>
        <ScoreCombo score={entry.bestScore} maxCombo={entry.maxCombo} />
      </div>
    );
  },
);

// ---------------------------------------------------------------------------
// Nearby opponent row (Nearby section)
// ---------------------------------------------------------------------------

interface ChallengeNearbyRowProps {
  opponent: ChallengeNearbyOpponent;
}

export const ChallengeNearbyRow = React.memo(
  function ChallengeNearbyRow({ opponent }: ChallengeNearbyRowProps) {
    const isPassed = opponent.relation === "passed";
    const gapAbs = Math.abs(opponent.gapFromMe);

    return (
      <div
        className={`challenge-lb-nearby-row flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
          isPassed ? "opacity-60" : "hover:bg-white/5"
        }`}
      >
        <span className="challenge-lb-rank w-6 shrink-0 text-center text-xs font-bold text-slate-500">
          #{opponent.rank ?? "—"}
        </span>
        <PlayerAvatar
          username={opponent.displayName}
          avatarUrl={opponent.avatarUrl}
          size={24}
          className="shrink-0"
        />
        <span className="min-w-0 flex-1 truncate text-slate-300">
          {opponent.displayName}
        </span>
        <div className="flex shrink-0 flex-col items-end">
          <ScoreCombo
            score={opponent.bestScore}
            maxCombo={opponent.maxCombo}
            scoreClass="text-slate-400"
            comboClass="text-slate-600"
          />
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
        className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm ${
          dim ? "opacity-10" : "opacity-20"
        }`}
      >
        <span className="w-6 shrink-0 text-center text-xs text-slate-600">—</span>
        <div className="h-5 w-5 rounded-full bg-white/10 shrink-0" />
        <div className="h-2.5 flex-1 rounded bg-white/10" />
        <div className="h-2.5 w-14 rounded bg-white/10" />
      </div>
    );
  },
);

// ---------------------------------------------------------------------------
// Self row — inline, shown both in the nearby section (at correct rank
// position) and as a fixed reference at the bottom of the panel.
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
      <div className="challenge-lb-self-row flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm bg-white/8 ring-1 ring-white/15">
        <span
          className={`challenge-lb-rank w-6 shrink-0 text-center text-xs font-bold ${rankColor}`}
        >
          {rankLabel}
        </span>
        <PlayerAvatar
          username={name}
          avatarUrl={avatarUrl ?? null}
          size={24}
          className="shrink-0"
        />
        <span className="min-w-0 flex-1 truncate font-medium text-white/90">
          {name}
          <span className="ml-1 text-[10px] font-bold text-white/45 uppercase tracking-wide">
            YOU
          </span>
        </span>
        <div className="shrink-0 text-right relative">
          <div className="font-mono text-xs font-semibold text-white">
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
