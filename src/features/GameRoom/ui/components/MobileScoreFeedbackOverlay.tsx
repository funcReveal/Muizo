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
  const combo = event.me.combo ?? 0;

  if (combo > 1) {
    return `Combo x${combo}`;
  }

  if (combo === 1) {
    return "Combo x1";
  }

  return "答對加分";
};

const getScoreFeedbackDetail = (
  event: Extract<MobileScoreFeedbackEvent, { type: "score" }>,
) => {
  if (event.me.rank === 1) {
    return event.runnerUp
      ? `領先 #2 ${event.leadScore ?? 0} 分`
      : "目前第 1 名";
  }

  if (event.target && event.remainingScore !== null) {
    return `距離 #${event.target.rank} 還差 ${event.remainingScore} 分`;
  }

  return null;
};

const MobileScoreFeedbackOverlay: React.FC<MobileScoreFeedbackOverlayProps> =
  React.memo(({ event, anchorStyle }) => {
    if (!event) {
      return null;
    }

    const isRankChange =
      event.type === "passed" || event.type === "overtaken";

    const cardClassName = [
      "game-room-mobile-score-feedback-card",
      `game-room-mobile-score-feedback-card--${event.type}`,
      isRankChange
        ? "game-room-mobile-score-feedback-card--rank-change"
        : "game-room-mobile-score-feedback-card--bubble",
    ].join(" ");

    const eventKey =
      event.type === "passed" || event.type === "overtaken"
        ? `${event.scope}-${event.type}-${event.me.score}-${event.oldRank}-${event.newRank}-${event.target?.clientId ?? "unknown"}`
        : `${event.scope}-${event.type}-${event.me.score}-${event.me.combo ?? 0}-${event.target?.clientId ?? event.runnerUp?.clientId ?? "solo"}`;

    const scoreDetail =
      event.type === "score" ? getScoreFeedbackDetail(event) : null;

    return (
      <div
        className="game-room-mobile-score-feedback-layer"
        style={anchorStyle}
        aria-live="polite"
      >
        <div key={eventKey} className={cardClassName}>
          {isRankChange ? (
            <div className="game-room-mobile-score-feedback-avatars">
              {event.target ? (
                <PlayerAvatar
                  username={event.target.username}
                  clientId={event.target.clientId}
                  avatarUrl={event.target.avatarUrl}
                  size={34}
                  hideRankMark
                  effectLevel="off"
                  className="game-room-mobile-score-feedback-avatar--target"
                />
              ) : (
                <span
                  className="game-room-mobile-score-feedback-avatar-placeholder game-room-mobile-score-feedback-avatar--target"
                  aria-hidden="true"
                />
              )}

              <PlayerAvatar
                username={event.me.username}
                clientId={event.me.clientId}
                avatarUrl={event.me.avatarUrl}
                size={38}
                isMe
                hideRankMark
                effectLevel="off"
                className="game-room-mobile-score-feedback-avatar--me"
              />
            </div>
          ) : null}

          {event.type !== "overtaken" ? (
            <div className="game-room-mobile-score-feedback-gain">
              +{event.scoreGain}
            </div>
          ) : event.targetScoreGain && event.targetScoreGain > 0 ? (
            <div className="game-room-mobile-score-feedback-gain game-room-mobile-score-feedback-gain--danger">
              對方 +{event.targetScoreGain}
            </div>
          ) : null}

          {event.type === "passed" ? (
            <>
              <div className="game-room-mobile-score-feedback-title">
                {event.target
                  ? `超越 ${event.target.username}`
                  : "排名上升"}
              </div>

              <div className="game-room-mobile-score-feedback-detail">
                #{event.oldRank} → #{event.newRank}
              </div>
            </>
          ) : event.type === "overtaken" ? (
            <>
              <div className="game-room-mobile-score-feedback-title game-room-mobile-score-feedback-title--danger">
                {event.target
                  ? `被 ${event.target.username} 超越`
                  : "排名下降"}
              </div>

              <div className="game-room-mobile-score-feedback-detail">
                #{event.oldRank} → #{event.newRank}
              </div>
            </>
          ) : (
            <>
              <div className="game-room-mobile-score-feedback-title">
                {getScoreFeedbackTitle(event)}
              </div>

              {scoreDetail ? (
                <div className="game-room-mobile-score-feedback-detail">
                  {scoreDetail}
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  });

export default MobileScoreFeedbackOverlay;