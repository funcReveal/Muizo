import React from "react";

import PlayerAvatar from "@shared/ui/playerAvatar/PlayerAvatar";

import type { MobileScoreFeedbackEvent } from "../../model/mobileScoreFeedback";

type MobileScoreFeedbackOverlayProps = {
  event: MobileScoreFeedbackEvent | null;
  anchorStyle?: React.CSSProperties;
};

const getScoreFeedbackTitle = (
  event: Extract<MobileScoreFeedbackEvent, { type: "score" }>,
) => {
  if (event.me.rank === 1) {
    return event.runnerUp
      ? `\u9818\u5148 #2 ${event.leadScore ?? 0} \u5206`
      : "\u76ee\u524d\u7b2c 1 \u540d";
  }

  if (event.target && event.remainingScore !== null) {
    return `\u8ddd\u96e2 #${event.target.rank} \u9084\u5dee ${event.remainingScore} \u5206`;
  }

  return `#${event.me.rank}`;
};

const MobileScoreFeedbackOverlay: React.FC<MobileScoreFeedbackOverlayProps> =
  React.memo(({ event, anchorStyle }) => {
    if (!event) {
      return null;
    }

    const hasRankChange = event.type === "passed";
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
        : `${event.scope}-${event.type}-${event.me.score}-${event.target?.clientId ?? event.runnerUp?.clientId ?? "solo"}`;

    return (
      <div
        className="game-room-mobile-score-feedback-layer"
        style={anchorStyle}
        aria-live="polite"
      >
        <div key={eventKey} className={cardClassName}>
          {event.type === "passed" ? (
            <div className="game-room-mobile-score-feedback-avatars">
              <PlayerAvatar
                username={event.target.username}
                clientId={event.target.clientId}
                avatarUrl={event.target.avatarUrl}
                size={34}
                hideRankMark
                className="game-room-mobile-score-feedback-avatar--target"
              />
              <PlayerAvatar
                username={event.me.username}
                clientId={event.me.clientId}
                avatarUrl={event.me.avatarUrl}
                size={38}
                isMe
                hideRankMark
                className="game-room-mobile-score-feedback-avatar--me"
              />
            </div>
          ) : null}

          <div className="game-room-mobile-score-feedback-gain">
            +{event.scoreGain}
          </div>

          {event.type === "passed" ? (
            <>
              <div className="game-room-mobile-score-feedback-title">
                {"\u8d85\u8d8a"} #{event.target.rank} {event.target.username}
              </div>
              <div className="game-room-mobile-score-feedback-detail">
                #{event.oldRank} {"\u2192"} #{event.newRank}
              </div>
            </>
          ) : (
            <>
              <div className="game-room-mobile-score-feedback-title">
                {getScoreFeedbackTitle(event)}
              </div>
              <div className="game-room-mobile-score-feedback-detail">
                #{event.me.rank}
              </div>
            </>
          )}
        </div>
      </div>
    );
  });

export default MobileScoreFeedbackOverlay;
