import React from "react";

import PlayerAvatar from "@shared/ui/playerAvatar/PlayerAvatar";

import type { MobileScoreFeedbackEvent } from "../../model/mobileScoreFeedback";

type MobileScoreFeedbackOverlayProps = {
  event: MobileScoreFeedbackEvent | null;
  anchorStyle?: React.CSSProperties;
};

const SCORE_SCOPE_LABEL: Record<MobileScoreFeedbackEvent["scope"], string> = {
  challenge: "挑戰排行",
  room: "房間排行",
};

const MobileScoreFeedbackOverlay: React.FC<MobileScoreFeedbackOverlayProps> =
  React.memo(({ event, anchorStyle }) => {
    if (!event) {
      return null;
    }

    const hasRankChange =
      event.type === "passed" || event.type === "overtaken";
    const targetPlayer = hasRankChange ? event.target : null;
    const cardClassName = [
      "game-room-mobile-score-feedback-card",
      `game-room-mobile-score-feedback-card--${event.type}`,
      hasRankChange
        ? "game-room-mobile-score-feedback-card--rank-change"
        : "game-room-mobile-score-feedback-card--bubble",
    ].join(" ");
    const eventKey =
      event.type === "passed"
        ? `${event.scope}-${event.type}-${event.me.score}-${event.oldRank}-${event.newRank}-${event.target.clientId}`
        : event.type === "overtaken"
          ? `${event.scope}-${event.type}-${event.me.score}-${event.oldRank}-${event.newRank}-${event.target.clientId}`
          : `${event.scope}-${event.type}-${event.me.score}-${event.target?.clientId ?? event.runnerUp?.clientId ?? "solo"}`;

    return (
      <div
        className="game-room-mobile-score-feedback-layer"
        style={anchorStyle}
        aria-live="polite"
      >
        <div key={eventKey} className={cardClassName}>
          {hasRankChange && (
            <div className="game-room-mobile-score-feedback-avatars">
              <PlayerAvatar
                username={event.me.username}
                clientId={event.me.clientId}
                avatarUrl={event.me.avatarUrl}
                size={38}
                isMe
                hideRankMark
                className="game-room-mobile-score-feedback-avatar--me"
              />
              {targetPlayer ? (
                <PlayerAvatar
                  username={targetPlayer.username}
                  clientId={targetPlayer.clientId}
                  avatarUrl={targetPlayer.avatarUrl}
                  size={34}
                  hideRankMark
                  className="game-room-mobile-score-feedback-avatar--target"
                />
              ) : null}
            </div>
          )}

          {event.type !== "overtaken" ? (
            <div className="game-room-mobile-score-feedback-gain">
              +{event.scoreGain}
            </div>
          ) : null}

          {event.type === "passed" ? (
            <>
              <div className="game-room-mobile-score-feedback-title">
                超越 #{event.target.rank} {event.target.username}
              </div>
              <div className="game-room-mobile-score-feedback-detail">
                {SCORE_SCOPE_LABEL[event.scope]} #{event.oldRank} → #
                {event.newRank}
              </div>
            </>
          ) : null}

          {event.type === "overtaken" ? (
            <>
              <div className="game-room-mobile-score-feedback-title game-room-mobile-score-feedback-title--danger">
                被 #{event.target.rank} {event.target.username} 超越
              </div>
              <div className="game-room-mobile-score-feedback-detail">
                房間排行 #{event.oldRank} → #{event.newRank}
                {event.targetScoreGain && event.targetScoreGain > 0
                  ? ` · 對方 +${event.targetScoreGain}`
                  : ""}
              </div>
            </>
          ) : null}

          {event.type === "score" ? (
            <>
              <div className="game-room-mobile-score-feedback-title">
                {event.me.rank === 1
                  ? event.runnerUp
                    ? `領先 #2 ${event.leadScore ?? 0} 分`
                    : "目前第 1 名"
                  : event.target && event.remainingScore !== null
                    ? `距離 #${event.target.rank} 還差 ${event.remainingScore} 分`
                    : SCORE_SCOPE_LABEL[event.scope]}
              </div>
              <div className="game-room-mobile-score-feedback-detail">
                {SCORE_SCOPE_LABEL[event.scope]} #{event.me.rank}
              </div>
            </>
          ) : null}
        </div>
      </div>
    );
  });

export default MobileScoreFeedbackOverlay;
