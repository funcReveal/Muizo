import React from "react";

export interface RoomMetaItem {
  key: string;
  label: string;
  value: string;
  icon: React.ReactNode;
  tone: "amber" | "cyan" | "password";
  trailing?: React.ReactNode;
}

const RoomLobbyMetaGrid = React.memo(function RoomLobbyMetaGrid({
  roomMetaItems,
}: {
  roomMetaItems: RoomMetaItem[];
}) {
  return (
    <div className="room-lobby-header-info-band">
      <div className="room-lobby-metric-grid">
        {roomMetaItems.map((card) => (
          <div
            key={card.key}
            className={`room-lobby-metric-card room-lobby-metric-card--${card.tone}`}
            role="presentation"
          >
            <span className="room-lobby-metric-icon">{card.icon}</span>
            <div
              className={
                card.key === "password"
                  ? "room-lobby-metric-main room-lobby-metric-main--password"
                  : "room-lobby-metric-main"
              }
            >
              <div className="room-lobby-metric-copy">
                <small className="room-lobby-metric-label">{card.label}</small>
                <strong className="room-lobby-metric-value">{card.value}</strong>
              </div>
              {card.key === "password" ? card.trailing ?? null : null}
            </div>
            {card.key !== "password" ? card.trailing ?? null : null}
          </div>
        ))}
      </div>
    </div>
  );
});

export default RoomLobbyMetaGrid;
