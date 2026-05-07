import React from "react";
import { Tooltip } from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

type PlaylistAvailabilityBadgeProps = {
  playable: number;
  total: number;
  size?: "sm" | "md";
  showWarningIcon?: boolean;
  warningClassName?: string;
  className?: string;
};

const toSafeCount = (value: number) =>
  Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;

const buildAvailabilityTooltip = (
  playable: number,
  total: number,
  unavailable: number,
) =>
  unavailable > 0
    ? `共 ${total} 題，目前 ${playable} 題可遊玩，${unavailable} 題暫時無法播放。建立房間、推薦與更換題庫時，只會使用可遊玩的題目。`
    : `共 ${total} 題，目前 ${playable} 題可遊玩。`;

export const PlaylistAvailabilityWarningIcon = ({
  playable,
  total,
  className = "",
}: {
  playable: number;
  total: number;
  className?: string;
}) => {
  const safePlayable = toSafeCount(playable);
  const safeTotal = toSafeCount(total);
  const unavailable = Math.max(0, safeTotal - safePlayable);
  if (unavailable <= 0) return null;

  const tooltip = buildAvailabilityTooltip(
    safePlayable,
    safeTotal,
    unavailable,
  );

  return (
    <Tooltip title={tooltip} arrow enterTouchDelay={0} leaveTouchDelay={3500}>
      <span
        className={`inline-flex h-[17px] w-[17px] shrink-0 items-center justify-center text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)] ${className}`}
        tabIndex={0}
        aria-label={tooltip}
      >
        <WarningAmberRoundedIcon sx={{ fontSize: 15 }} />
      </span>
    </Tooltip>
  );
};

const PlaylistAvailabilityBadge = ({
  playable,
  total,
  size = "sm",
  showWarningIcon = true,
  warningClassName = "",
  className = "",
}: PlaylistAvailabilityBadgeProps) => {
  const safePlayable = toSafeCount(playable);
  const safeTotal = toSafeCount(total);
  const textClass = size === "md" ? "text-[13px]" : "text-[12px]";

  return (
    <span
      className={`inline-flex min-w-0 items-center gap-1.5 align-middle ${textClass} font-semibold ${className}`}
    >
      <span>{safePlayable} 題</span>
      {showWarningIcon ? (
        <PlaylistAvailabilityWarningIcon
          playable={safePlayable}
          total={safeTotal}
          className={warningClassName}
        />
      ) : null}
    </span>
  );
};

export default React.memo(PlaylistAvailabilityBadge);
