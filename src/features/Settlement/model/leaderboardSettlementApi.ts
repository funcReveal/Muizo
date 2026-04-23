import { API_URL } from "@domain/room/constants";
import type { LeaderboardSettlementResponse } from "@features/RoomSession";

type FetchLeaderboardSettlementParams = {
  matchId: string;
  authToken?: string | null;
  clientId?: string | null;
  signal?: AbortSignal;
};

type LeaderboardSettlementApiPayload = {
  ok?: boolean;
  data?: LeaderboardSettlementResponse;
  error?: string;
};

export const fetchLeaderboardSettlement = async ({
  matchId,
  authToken,
  clientId,
  signal,
}: FetchLeaderboardSettlementParams): Promise<LeaderboardSettlementResponse> => {
  if (!API_URL) {
    throw new Error("API_URL 未設定");
  }
  if (!matchId?.trim()) {
    throw new Error("matchId is required");
  }

  const params = new URLSearchParams();
  if (!authToken && clientId?.trim()) {
    params.set("clientId", clientId.trim());
  }

  const response = await fetch(
    `${API_URL}/api/leaderboards/matches/${encodeURIComponent(matchId.trim())}/settlement${
      params.size > 0 ? `?${params.toString()}` : ""
    }`,
    {
      method: "GET",
      signal,
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
    },
  );

  const payload = (await response.json().catch(() => null)) as
    | LeaderboardSettlementApiPayload
    | null;

  if (!response.ok || !payload?.ok || !payload.data) {
    throw new Error(payload?.error || "載入排行榜結算失敗");
  }

  return payload.data;
};
