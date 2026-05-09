/**
 * API client for the in-game projected challenge leaderboard.
 * Endpoint: GET /api/leaderboards/rooms/:roomId/projected-window
 *
 * Security: never send score, rank, collectionId, or profileKey in the request.
 * The backend derives all of these from server-authoritative room state.
 */

import type { ChallengeProjectedLeaderboardResponse } from "./projectionTypes";

const API_TIMEOUT_MS = 8_000;

export type FetchProjectedWindowInput = {
  apiUrl: string;
  roomId: string;
  /** JWT access token (preferred). Pass null for unauthenticated. */
  token: string | null;
  /** ClientId fallback for unauthenticated guests */
  clientId: string | null;
  /** AbortSignal for request cancellation */
  signal?: AbortSignal;
};

export type FetchProjectedWindowResult =
  | { ok: true; data: ChallengeProjectedLeaderboardResponse }
  | { ok: false; status: number; error: string };

export async function fetchProjectedWindow(
  input: FetchProjectedWindowInput,
): Promise<FetchProjectedWindowResult> {
  const { apiUrl, roomId, token, clientId, signal } = input;

  const internalController = new AbortController();
  const timeoutId = window.setTimeout(
    () => internalController.abort(),
    API_TIMEOUT_MS,
  );

  const combinedSignal = signal
    ? anyAbort([signal, internalController.signal])
    : internalController.signal;

  const url = new URL(`${apiUrl}/api/leaderboards/rooms/${encodeURIComponent(roomId)}/projected-window`);
  // Always send clientId as a lookup hint to enable O(1) participant lookup on the backend.
  // JWT in Authorization header remains the authorisation mechanism — clientId is NOT auth.
  if (clientId) {
    url.searchParams.set("clientId", clientId);
  }

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: combinedSignal,
    });

    const body = await res.json().catch(() => null);

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error:
          (typeof body?.error === "string" && body.error) ||
          `HTTP ${res.status}`,
      };
    }

    if (!body?.data) {
      return { ok: false, status: res.status, error: "Invalid response shape" };
    }

    return { ok: true, data: body.data as ChallengeProjectedLeaderboardResponse };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { ok: false, status: 408, error: "Request timed out" };
    }
    return { ok: false, status: 0, error: "Network error" };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

/** Creates a combined abort signal that fires when any of the provided signals abort. */
function anyAbort(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) {
      controller.abort();
      break;
    }
    s.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}
