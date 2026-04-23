import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

import type { ChatMessage, RoomSettlementSnapshot } from "./types";
import { capRoomMessages, capSettlementHistory } from "./roomProviderUtils";

export const useRoomSessionListsState = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [settlementHistory, setSettlementHistory] = useState<
    RoomSettlementSnapshot[]
  >([]);
  const [rankChangeByRoundKey, setRankChangeByRoundKey] = useState<
    Record<string, Record<string, number | null>>
  >({});

  const setMessagesWithCap = useCallback<
    Dispatch<SetStateAction<ChatMessage[]>>
  >((value) => {
    setMessages((previous) => {
      const next =
        typeof value === "function"
          ? (value as (prev: ChatMessage[]) => ChatMessage[])(previous)
          : value;
      return capRoomMessages(next);
    });
  }, []);

  const setSettlementHistoryWithCap = useCallback<
    Dispatch<SetStateAction<RoomSettlementSnapshot[]>>
  >((value) => {
    setSettlementHistory((previous) => {
      const next =
        typeof value === "function"
          ? (
              value as (
                prev: RoomSettlementSnapshot[],
              ) => RoomSettlementSnapshot[]
            )(previous)
          : value;
      return capSettlementHistory(next);
    });
  }, []);

  const mergeRankChange = useCallback(
    (roundKey: string, changes: Record<string, number | null>) => {
      setRankChangeByRoundKey((prev) => ({
        ...prev,
        [roundKey]: { ...(prev[roundKey] ?? {}), ...changes },
      }));
    },
    [],
  );

  return {
    messages,
    setMessagesWithCap,
    settlementHistory,
    setSettlementHistoryWithCap,
    rankChangeByRoundKey,
    mergeRankChange,
  };
};

export default useRoomSessionListsState;
