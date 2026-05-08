import React from "react";
import type { RoomParticipant } from "@features/RoomSession";
import { normalizeRoomDisplayText } from "../../../../shared/utils/text";
import PlayerAvatar from "../../../../shared/ui/playerAvatar/PlayerAvatar";

const SCOREBOARD_AVATAR_SIZE = 37;
const SCOREBOARD_AVATAR_CONTENT_SIZE = 29;

interface RoomSelfStickyBarProps {
  player: RoomParticipant;
  rank: number;
}

export const RoomSelfStickyBar = React.memo(function RoomSelfStickyBar({
  player,
  rank,
}: RoomSelfStickyBarProps) {
  const displayName = normalizeRoomDisplayText(player.username, "Player");
  const combo = player.combo ?? 0;
  const answerDotClass =
    player.isOnline !== false ? "bg-emerald-400" : "bg-slate-500";

  return (
    <div className="game-room-room-self-sticky-bar shrink-0 space-y-1">
      <div className="h-px bg-white/10" />
      <div className="game-room-score-row game-room-score-row--me flex items-center justify-between text-sm">
        <span className="flex min-w-0 flex-1 items-center gap-2 truncate">
          <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums leading-none text-slate-500">
            #{rank}
          </span>
          <span className="game-room-score-row-avatar-wrap">
            <PlayerAvatar
              username={displayName}
              clientId={player.clientId}
              avatarUrl={player.avatar_url ?? player.avatarUrl ?? undefined}
              size={SCOREBOARD_AVATAR_SIZE}
              contentSize={SCOREBOARD_AVATAR_CONTENT_SIZE}
              isMe
              className="player-avatar--scoreboard"
            />
            <span
              className={`game-room-score-row-answer-dot-badge ${answerDotClass}`}
            />
          </span>
          <span className="truncate">{displayName}</span>
          <span className="game-room-score-row-you-badge">YOU</span>
        </span>
        <span className="shrink-0 whitespace-nowrap text-right font-mono text-sm font-semibold tabular-nums text-emerald-300">
          {player.score.toLocaleString()}
          {combo > 0 ? (
            <span className="font-normal text-slate-500">&times;{combo}</span>
          ) : null}
        </span>
      </div>
    </div>
  );
});
