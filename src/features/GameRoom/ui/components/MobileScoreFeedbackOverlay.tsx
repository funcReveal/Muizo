import React from "react";

import PlayerAvatar from "@shared/ui/playerAvatar/PlayerAvatar";

import type {
  FeedbackPlayer,
  MobileScoreFeedbackEvent,
} from "../../model/mobileScoreFeedback";

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

const canRenderFeedbackAvatar = (player: FeedbackPlayer | null) =>
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

    const rankEvent =
      event.type === "passed" || event.type === "overtaken" ? event : null;
    const scoreEvent = event.type === "score" ? event : null;
    const isUnansweredEvent = event.type === "unanswered";

    const isRankChange = rankEvent !== null;
    const comboTier = scoreEvent
      ? getComboFeedbackTier(scoreEvent.me.combo ?? 0)
      : "none";

    const canShowRankAvatars =
      rankEvent !== null &&
      canRenderFeedbackAvatar(rankEvent.me) &&
      canRenderFeedbackAvatar(rankEvent.target);

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

    const eventKey = isUnansweredEvent
      ? `${event.scope}-unanswered-${event.questionKey}`
      : rankEvent
        ? `${rankEvent.scope}-${rankEvent.type}-${rankEvent.me.score}-${rankEvent.oldRank}-${rankEvent.newRank}-${rankEvent.target?.clientId ?? "text"}`
        : scoreEvent
          ? `${scoreEvent.scope}-${scoreEvent.type}-${scoreEvent.me.score}-${scoreEvent.me.combo ?? 0}-${scoreEvent.target?.clientId ?? scoreEvent.runnerUp?.clientId ?? "solo"}`
          : `${event.scope}-${event.type}`;

    const scoreDetail = scoreEvent ? getScoreFeedbackDetail(scoreEvent) : null;

    return (
      <div
        className="game-room-mobile-score-feedback-layer"
        style={anchorStyle}
        aria-live="polite"
      >
        <div key={eventKey} className={cardClassName}>
          {canShowRankAvatars && rankEvent?.target ? (
            <div
              className={`game-room-mobile-score-feedback-swap game-room-mobile-score-feedback-swap--${rankEvent.type}`}
              aria-hidden="true"
            >
              <PlayerAvatar
                username={rankEvent.target.username}
                clientId={rankEvent.target.clientId}
                avatarUrl={rankEvent.target.avatarUrl}
                size={34}
                hideRankMark
                effectLevel="off"
                className="game-room-mobile-score-feedback-swap-avatar game-room-mobile-score-feedback-swap-avatar--target"
              />
              <span className="game-room-mobile-score-feedback-swap-arrow">
                {rankEvent.type === "passed" ? ">" : "<"}
              </span>
              <PlayerAvatar
                username={rankEvent.me.username}
                clientId={rankEvent.me.clientId}
                avatarUrl={rankEvent.me.avatarUrl}
                size={38}
                isMe
                hideRankMark
                effectLevel="off"
                className="game-room-mobile-score-feedback-swap-avatar game-room-mobile-score-feedback-swap-avatar--me"
              />
            </div>
          ) : null}

          {scoreEvent ? (
            <div className="game-room-mobile-score-feedback-gain">
              +{scoreEvent.scoreGain}
            </div>
          ) : null}

          {isUnansweredEvent ? (
            <>
              <div className="game-room-mobile-score-feedback-title game-room-mobile-score-feedback-title--muted">
                未作答
              </div>
              <div className="game-room-mobile-score-feedback-detail">
                這題沒有送出答案
              </div>
            </>
          ) : rankEvent?.type === "passed" ? (
            <>
              <div className="game-room-mobile-score-feedback-title">
                {rankEvent.target ? `超越 ${rankEvent.target.username}` : "排名上升"}
              </div>
              <div className="game-room-mobile-score-feedback-detail">
                #{rankEvent.oldRank} -&gt; #{rankEvent.newRank}
              </div>
            </>
          ) : rankEvent?.type === "overtaken" ? (
            <>
              <div className="game-room-mobile-score-feedback-title game-room-mobile-score-feedback-title--danger">
                {rankEvent.target
                  ? `${rankEvent.target.username} 超越你`
                  : "排名下降"}
              </div>
              <div className="game-room-mobile-score-feedback-detail">
                #{rankEvent.oldRank} -&gt; #{rankEvent.newRank}
              </div>
            </>
          ) : scoreEvent ? (
            <>
              <div className="game-room-mobile-score-feedback-title">
                {getScoreFeedbackTitle(scoreEvent)}
              </div>
              {scoreDetail ? (
                <div className="game-room-mobile-score-feedback-detail">
                  {scoreDetail}
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    );
  });

export default MobileScoreFeedbackOverlay;
