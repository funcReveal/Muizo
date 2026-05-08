import React from "react";
import type { RoomParticipant } from "@features/RoomSession";
import { normalizeRoomDisplayText } from "../../../../shared/utils/text";
import PlayerAvatar from "../../../../shared/ui/playerAvatar/PlayerAvatar";

interface RoomSelfStickyBarProps {
  player: RoomParticipant;
  rank: number;
  totalPlayers: number;
}

export const RoomSelfStickyBar = React.memo(function RoomSelfStickyBar({
  player,
  rank,
  totalPlayers,
}: RoomSelfStickyBarProps) {
  const displayName = normalizeRoomDisplayText(player.username, "你");
  const combo = player.combo ?? 0;
  const answerDotClass =
    player.isOnline !== false ? "bg-emerald-400" : "bg-slate-500";

  return (
    <div className="shrink-0 space-y-1.5">
      <div className="h-px bg-white/10" />
      <div className="game-room-score-row game-room-score-row--me flex items-center justify-between text-sm">
        <span className="truncate flex items-center gap-2">
          <span className="w-5 shrink-0 text-center text-xs font-bold tabular-nums leading-none text-slate-500">
            #{rank}
          </span>
          <span className="game-room-score-row-avatar-wrap">
            <PlayerAvatar
              username={displayName}
              clientId={player.clientId}
              avatarUrl={player.avatar_url ?? player.avatarUrl ?? undefined}
              size={38}
              contentSize={30}
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
        <div className="shrink-0 text-right">
          <div className="font-mono text-sm font-semibold text-emerald-300 tabular-nums">
            {player.score.toLocaleString()}
          </div>
          {combo > 0 ? (
            <div className="text-[10px] text-amber-400 font-semibold">
              ×{combo}連
            </div>
          ) : totalPlayers > 0 ? (
            <div className="text-[10px] text-slate-500">
              /{totalPlayers.toLocaleString()}人
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
});
