import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

import type { RoomKickedNotice } from "../RoomSessionContext";
import { sanitizePossibleGarbledText } from "../../../../shared/utils/text";
import {
  StatusReadContext,
  StatusWriteContext,
  type RoomStatusOptions,
  type StatusReadContextValue,
  type StatusWriteContextValue,
} from "./RoomStatusContexts";

export const RoomStatusSubProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [statusText, setStatusTextState] = useState<string | null>(null);
  const [statusNotification, setStatusNotification] =
    useState<StatusReadContextValue["statusNotification"]>(null);
  const statusNotificationSeqRef = useRef(0);
  const [kickedNotice, setKickedNotice] = useState<RoomKickedNotice | null>(
    null,
  );

  const emitStatusNotification = useCallback(
    (message: string, options?: RoomStatusOptions) => {
      const sanitized = sanitizePossibleGarbledText(message, "狀態已更新");
      statusNotificationSeqRef.current += 1;
      setStatusNotification({
        id: statusNotificationSeqRef.current,
        message: sanitized,
        level: options?.level ?? "info",
        toastId: options?.toastId,
      });
      return sanitized;
    },
    [],
  );

  const notifyStatus = useCallback(
    (message: string, options?: RoomStatusOptions) => {
      emitStatusNotification(message, options);
    },
    [emitStatusNotification],
  );

  const setStatusText = useCallback(
    (value: string | null, options?: RoomStatusOptions) => {
      if (typeof value !== "string") {
        setStatusTextState(value);
        return;
      }
      const sanitized = emitStatusNotification(value, options);
      setStatusTextState(sanitized);
    },
    [emitStatusNotification],
  );

  const writeValue = useMemo<StatusWriteContextValue>(
    () => ({ setStatusText, notifyStatus, setKickedNotice }),
    [notifyStatus, setKickedNotice, setStatusText],
  );

  const readValue = useMemo<StatusReadContextValue>(
    () => ({ statusText, statusNotification, kickedNotice }),
    [kickedNotice, statusNotification, statusText],
  );

  return (
    <StatusWriteContext.Provider value={writeValue}>
      <StatusReadContext.Provider value={readValue}>
        {children}
      </StatusReadContext.Provider>
    </StatusWriteContext.Provider>
  );
};
