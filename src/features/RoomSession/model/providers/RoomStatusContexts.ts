import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { RoomKickedNotice } from "../RoomSessionContext";

export type RoomStatusLevel = "info" | "success" | "warning" | "error";

export type RoomStatusNotification = {
  id: number;
  message: string;
  level: RoomStatusLevel;
  toastId?: string;
};

export type RoomStatusOptions = {
  level?: RoomStatusLevel;
  toastId?: string;
};

export interface StatusWriteContextValue {
  setStatusText: (value: string | null, options?: RoomStatusOptions) => void;
  notifyStatus: (message: string, options?: RoomStatusOptions) => void;
  setKickedNotice: Dispatch<SetStateAction<RoomKickedNotice | null>>;
}

export const StatusWriteContext = createContext<StatusWriteContextValue | null>(
  null,
);

export const useStatusWrite = (): StatusWriteContextValue => {
  const ctx = useContext(StatusWriteContext);
  if (!ctx) {
    throw new Error("useStatusWrite must be used within RoomStatusSubProvider");
  }
  return ctx;
};

export interface StatusReadContextValue {
  statusText: string | null;
  statusNotification: RoomStatusNotification | null;
  kickedNotice: RoomKickedNotice | null;
}

export const StatusReadContext = createContext<StatusReadContextValue | null>(
  null,
);

export const useStatusRead = (): StatusReadContextValue => {
  const ctx = useContext(StatusReadContext);
  if (!ctx) {
    throw new Error("useStatusRead must be used within RoomStatusSubProvider");
  }
  return ctx;
};
