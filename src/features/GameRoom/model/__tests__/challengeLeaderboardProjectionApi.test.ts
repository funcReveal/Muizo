import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchProjectedWindow,
  parseRetryAfterMs,
} from "../challengeLeaderboardProjectionApi";

describe("challengeLeaderboardProjectionApi", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("parses Retry-After seconds into milliseconds", () => {
    expect(parseRetryAfterMs("2.5")).toBe(2500);
  });

  it("parses Retry-After HTTP dates into milliseconds", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-14T00:00:00Z"));
    expect(parseRetryAfterMs("Thu, 14 May 2026 00:00:04 GMT")).toBe(4000);
    vi.useRealTimers();
  });

  it("returns retryAfterMs from 429 response body", async () => {
    vi.stubGlobal("window", {
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "10" }),
        json: async () => ({ error: "Too Many Requests", retryAfterMs: 3000 }),
      })),
    );

    const result = await fetchProjectedWindow({
      apiUrl: "http://localhost:3000",
      roomId: "room-1",
      token: "jwt",
      clientId: "client-1",
    });

    expect(result).toEqual({
      ok: false,
      status: 429,
      error: "Too Many Requests",
      retryAfterMs: 3000,
    });
    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/leaderboards/rooms/room-1/projected-window?clientId=client-1",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt",
        }),
      }),
    );
  });

  it("falls back to Retry-After header when body has no retryAfterMs", async () => {
    vi.stubGlobal("window", {
      setTimeout: globalThis.setTimeout,
      clearTimeout: globalThis.clearTimeout,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 429,
        headers: new Headers({ "Retry-After": "4" }),
        json: async () => ({ error: "Too Many Requests" }),
      })),
    );

    const result = await fetchProjectedWindow({
      apiUrl: "http://localhost:3000",
      roomId: "room-1",
      token: null,
      clientId: "client-1",
    });

    expect(result).toMatchObject({
      ok: false,
      status: 429,
      retryAfterMs: 4000,
    });
  });
});
