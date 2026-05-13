import React from "react";

import PlayerAvatar from "@shared/ui/playerAvatar/PlayerAvatar";

import type { MobileScoreFeedbackEvent } from "../../model/mobileScoreFeedback";

type MobileScoreFeedbackOverlayProps = {
  event: MobileScoreFeedbackEvent | null;
  anchorStyle?: React.CSSProperties;
};

const getComboFeedbackTier = (
  combo: number,
): "none" | "normal" | "hot" | "great" | "legend" => {
  if (combo >= 10) return "legend";
  if (combo >= 6) return "great";
  if (combo >= 3) return "hot";
  if (combo >= 1) return "normal";
  return "none";
};

const getScoreFeedbackTitle = (
  event: Extract<MobileScoreFeedbackEvent, { type: "score" }>,
) => {
  const combo = event.me.combo ?? 0;
  if (combo >= 10) return `Legend Combo x${combo}`;
  if (combo >= 6) return `Great Combo x${combo}`;
  if (combo >= 1) return `Combo x${combo}`;
  return "分數提升";
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

const canRenderFeedbackAvatar = (
  player: MobileScoreFeedbackEvent["me"] | null,
) =>
  Boolean(
    player &&
      player.clientId.trim().length > 0 &&
      player.username.trim().length > 0 &&
      Number.isFinite(player.rank) &&
      Number.isFinite(player.score),
  );

const MobileScoreFeedbackOverlay: React.FC<MobileScoreFeedbackOverlayProps> =
  React.memo(({ event, anchorStyle }) => {
    if (!event) return null;

    const isRankChange =
      event.type === "passed" || event.type === "overtaken";
    const comboTier =
      event.type === "score"
        ? getComboFeedbackTier(event.me.combo ?? 0)
        : "none";
    const canShowRankAvatars =
      isRankChange &&
      canRenderFeedbackAvatar(event.me) &&
      canRenderFeedbackAvatar(event.target);

    const cardClassName = [
      "game-room-mobile-score-feedback-card",
      `game-room-mobile-score-feedback-card--${event.type}`,
      isRankChange
        ? "game-room-mobile-score-feedback-card--rank-change"
        : "game-room-mobile-score-feedback-card--bubble",
      isRankChange
        ? `game-room-mobile-score-feedback-card--rank-${event.type}`
        : "",
      comboTier !== "none"
        ? `game-room-mobile-score-feedback-card--combo-${comboTier}`
        : "",
    ]
      .filter(Boolean)
      .join(" ");

    const eventKey =
      event.type === "passed" || event.type === "overtaken"
        ? `${event.scope}-${event.type}-${event.me.score}-${event.oldRank}-${event.newRank}-${event.target?.clientId ?? "text"}`
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
          {canShowRankAvatars && event.target ? (
            <div
              className={`game-room-mobile-score-feedback-swap game-room-mobile-score-feedback-swap--${event.type}`}
              aria-hidden="true"
            >
              <PlayerAvatar
                username={event.target.username}
                clientId={event.target.clientId}
                avatarUrl={event.target.avatarUrl}
                size={34}
                hideRankMark
                effectLevel="off"
                className="game-room-mobile-score-feedback-swap-avatar game-room-mobile-score-feedback-swap-avatar--target"
              />
              <span className="game-room-mobile-score-feedback-swap-arrow">
                {event.type === "passed" ? ">" : "<"}
              </span>
              <PlayerAvatar
                username={event.me.username}
                clientId={event.me.clientId}
                avatarUrl={event.me.avatarUrl}
                size={38}
                isMe
                hideRankMark
                effectLevel="off"
                className="game-room-mobile-score-feedback-swap-avatar game-room-mobile-score-feedback-swap-avatar--me"
              />
            </div>
          ) : null}

          {event.type === "score" ? (
            <div className="game-room-mobile-score-feedback-gain">
              +{event.scoreGain}
            </div>
          ) : null}

          {event.type === "passed" ? (
            <>
              <div className="game-room-mobile-score-feedback-title">
                {event.target ? `超越 ${event.target.username}` : "排名上升"}
              </div>
              <div className="game-room-mobile-score-feedback-detail">
                #{event.oldRank} -&gt; #{event.newRank}
              </div>
            </>
          ) : event.type === "overtaken" ? (
            <>
              <div className="game-room-mobile-score-feedback-title game-room-mobile-score-feedback-title--danger">
                {event.target
                  ? `${event.target.username} 超越你`
                  : "排名下降"}
              </div>
              <div className="game-room-mobile-score-feedback-detail">
                #{event.oldRank} -&gt; #{event.newRank}
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
