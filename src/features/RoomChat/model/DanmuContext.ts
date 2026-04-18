import React from "react";

export type DanmuItem = {
  id: string;
  text: string;
  lane: number;
  durationMs: number;
};

export interface DanmuContextValue {
  danmuEnabled: boolean;
  onDanmuEnabledChange: (enabled: boolean) => void;
}

export const DanmuContext = React.createContext<DanmuContextValue | null>(null);

/**
 * 專門提供目前顯示中的彈幕 items
 * English: a dedicated context for active danmu items
 */
export const DanmuItemsContext = React.createContext<DanmuItem[]>([]);
