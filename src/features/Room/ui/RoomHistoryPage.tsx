import {
  AccessTime,
  ArrowBackRounded,
  ChevronRightRounded,
  HistoryEdu,
  MeetingRoom,
  Quiz,
  SportsScore,
} from "@mui/icons-material";
import { Chip, CircularProgress } from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { ensureFreshAuthToken } from "../../../shared/auth/token";
import type {
  RoomSettlementHistorySummary,
  RoomSettlementSnapshot,
} from "../model/types";
import { useRoom } from "../model/useRoom";
import GameSettlementPanel from "./components/GameSettlementPanel";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

type HistoryListResponse = {
  ok: boolean;
  data?: {
    items: RoomSettlementHistorySummary[];
    nextCursor: number | null;
  };
  error?: string;
};

type HistoryDetailResponse = {
  ok: boolean;
  data?: {
    snapshot: RoomSettlementSnapshot;
  };
  error?: string;
};

const formatDateTime = (timestamp: number) => {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "-";
  return new Date(timestamp).toLocaleString();
};

const formatRelative = (timestamp: number) => {
  if (!Number.isFinite(timestamp) || timestamp <= 0) return "";
  const diffMs = Date.now() - timestamp;
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "剛剛";
  if (diffMin < 60) return `${diffMin} 分鐘前`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小時前`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} 天前`;
};

const buildHistoryHeaders = (token: string | null) => ({
  "Content-Type": "application/json",
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const parseSummaryReplayStatus = (summary: RoomSettlementHistorySummary) => {
  const json = summary.summaryJson;
  if (!json || typeof json !== "object") return null;
  const replayStatus = (json as Record<string, unknown>).replayStatus;
  return typeof replayStatus === "string" ? replayStatus : null;
};

const parseSummaryPlaylistLabel = (summary: RoomSettlementHistorySummary) => {
  const json = summary.summaryJson;
  if (!json || typeof json !== "object") return null;
  const sourceLabel = (json as Record<string, unknown>).playlistLabel;
  if (typeof sourceLabel === "string" && sourceLabel.trim()) {
    return sourceLabel.trim();
  }
  const collectionTitle = (json as Record<string, unknown>).collectionTitle;
  if (typeof collectionTitle === "string" && collectionTitle.trim()) {
    return `收藏庫：${collectionTitle.trim()}`;
  }
  const playlistTitle = (json as Record<string, unknown>).playlistTitle;
  if (typeof playlistTitle === "string" && playlistTitle.trim()) {
    return `YouTube 歌單：${playlistTitle.trim()}`;
  }
  return null;
};

const RoomHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { clientId, authToken, refreshAuthToken, setStatusText } = useRoom();

  const [items, setItems] = useState<RoomSettlementHistorySummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [loadingReplayMatchId, setLoadingReplayMatchId] = useState<string | null>(
    null,
  );
  const [replayByMatchId, setReplayByMatchId] = useState<
    Record<string, RoomSettlementSnapshot>
  >({});
  const [collapsedRoomGroups, setCollapsedRoomGroups] = useState<
    Record<string, boolean>
  >({});

  const selectedSummary = useMemo(
    () => items.find((item) => item.matchId === selectedMatchId) ?? null,
    [items, selectedMatchId],
  );
  const selectedReplay = selectedMatchId ? replayByMatchId[selectedMatchId] : null;
  const isLoadingSelectedReplay =
    Boolean(selectedMatchId) && loadingReplayMatchId === selectedMatchId;

  const getBearerToken = useCallback(async () => {
    if (!authToken) return null;
    return await ensureFreshAuthToken({ token: authToken, refreshAuthToken });
  }, [authToken, refreshAuthToken]);

  const fetchHistoryList = useCallback(async () => {
    if (!API_URL) {
      throw new Error("找不到 API_URL 設定");
    }

    const token = await getBearerToken();
    const merged = new Map<string, RoomSettlementHistorySummary>();
    let beforeEndedAt: number | null = null;
    let safety = 0;

    while (safety < 50) {
      safety += 1;
      const params = new URLSearchParams();
      if (clientId) params.set("clientId", clientId);
      params.set("limit", "50");
      if (typeof beforeEndedAt === "number" && beforeEndedAt > 0) {
        params.set("beforeEndedAt", String(beforeEndedAt));
      }

      const res = await fetch(
        `${API_URL}/api/history/matches?${params.toString()}`,
        {
          method: "GET",
          headers: buildHistoryHeaders(token),
        },
      );

      const payload = (await res.json().catch(() => null)) as
        | HistoryListResponse
        | null;

      if (!res.ok || !payload?.ok || !payload.data) {
        throw new Error(payload?.error ?? "讀取歷史列表失敗");
      }

      for (const item of payload.data.items ?? []) {
        merged.set(item.matchId, item);
      }

      if (!payload.data.nextCursor) break;
      beforeEndedAt = payload.data.nextCursor;
    }

    return Array.from(merged.values()).sort(
      (a, b) => b.endedAt - a.endedAt || b.roundNo - a.roundNo,
    );
  }, [clientId, getBearerToken]);

  const fetchReplay = useCallback(
    async (matchId: string) => {
      if (!API_URL) {
        throw new Error("找不到 API_URL 設定");
      }

      const token = await getBearerToken();
      const params = new URLSearchParams();
      if (clientId) params.set("clientId", clientId);

      const url = `${API_URL}/api/history/matches/${encodeURIComponent(matchId)}${
        params.size ? `?${params.toString()}` : ""
      }`;

      const res = await fetch(url, {
        method: "GET",
        headers: buildHistoryHeaders(token),
      });

      const payload = (await res.json().catch(() => null)) as
        | HistoryDetailResponse
        | null;

      if (!res.ok || !payload?.ok || !payload.data?.snapshot) {
        throw new Error(payload?.error ?? "讀取對戰回顧失敗");
      }

      return payload.data.snapshot;
    },
    [clientId, getBearerToken],
  );

  useEffect(() => {
    let cancelled = false;
    setLoadingList(true);
    setListError(null);

    void fetchHistoryList()
      .then((nextItems) => {
        if (cancelled) return;
        setItems(nextItems);
      })
      .catch((error) => {
        if (cancelled) return;
        const message =
          error instanceof Error ? error.message : "讀取歷史列表失敗";
        setListError(message);
        setStatusText(message);
      })
      .finally(() => {
        if (!cancelled) setLoadingList(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchHistoryList, setStatusText]);

  const openReplayDetail = useCallback(
    async (summary: RoomSettlementHistorySummary) => {
      const matchId = summary.matchId;
      setSelectedMatchId(matchId);
      if (replayByMatchId[matchId]) return;

      setLoadingReplayMatchId(matchId);
      try {
        const snapshot = await fetchReplay(matchId);
        setReplayByMatchId((prev) => ({ ...prev, [matchId]: snapshot }));
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "讀取對戰回顧失敗";
        setStatusText(message);
      } finally {
        setLoadingReplayMatchId((prev) => (prev === matchId ? null : prev));
      }
    },
    [fetchReplay, replayByMatchId, setStatusText],
  );

  const totalMatches = items.length;
  const totalQuestions = useMemo(
    () => items.reduce((sum, item) => sum + item.questionCount, 0),
    [items],
  );
  const bestScore = useMemo(
    () =>
      items.reduce(
        (max, item) => Math.max(max, item.selfPlayer?.finalScore ?? 0),
        0,
      ),
    [items],
  );

  const groupedHistoryItems = useMemo(() => {
    const groups = new Map<
      string,
      {
        roomId: string;
        roomName: string;
        items: RoomSettlementHistorySummary[];
      }
    >();
    for (const item of items) {
      const key = item.roomId || item.roomName || item.matchId;
      const existing = groups.get(key);
      if (existing) {
        existing.items.push(item);
      } else {
        groups.set(key, {
          roomId: item.roomId,
          roomName: item.roomName || item.roomId,
          items: [item],
        });
      }
    }
    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: group.items.sort((a, b) => b.endedAt - a.endedAt || b.roundNo - a.roundNo),
      }))
      .sort(
        (a, b) =>
          (b.items[0]?.endedAt ?? 0) - (a.items[0]?.endedAt ?? 0) ||
          (b.items[0]?.roundNo ?? 0) - (a.items[0]?.roundNo ?? 0),
      );
  }, [items]);

  useEffect(() => {
    setCollapsedRoomGroups((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const group of groupedHistoryItems) {
        if (!(group.roomId in next)) {
          next[group.roomId] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [groupedHistoryItems]);

  const archiveHeader = (
    <section className="relative overflow-hidden rounded-[26px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(20,17,13,0.94),rgba(8,7,5,0.98))] p-5 shadow-[0_16px_36px_-28px_rgba(0,0,0,0.72)] sm:p-7">

      <div className="relative grid gap-5 lg:grid-cols-1">
        <div className="min-w-0">
          <div className="mb-4 inline-flex items-center gap-3 rounded-2xl border border-[var(--mc-border)] bg-[color-mix(in_srgb,var(--mc-surface-strong)_86%,black_14%)] px-4 py-3 shadow-[inset_0_0_0_1px_rgba(245,158,11,0.08)]">
            <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-amber-300/30 bg-amber-300/10 text-amber-200">
              <HistoryEdu fontSize="small" />
              <span className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-amber-200/10" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[var(--mc-text-muted)]">
                Match Archive
              </div>
              <h1 className="truncate text-lg font-semibold text-[var(--mc-text)] sm:text-xl">
                對戰歷史
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-[var(--mc-text-muted)] sm:text-[15px]">
            依房間分組查看你參與過的對戰紀錄。展開後可快速比較同一房間的多場成績，並進一步查看完整結算回顧。
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--mc-border)] bg-[color-mix(in_srgb,var(--mc-surface)_88%,black_12%)] p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--mc-text-muted)]">
                <HistoryEdu fontSize="inherit" />
                對戰場次
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--mc-text)]">
                {loadingList ? "-" : totalMatches}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--mc-border)] bg-[color-mix(in_srgb,var(--mc-surface)_88%,black_12%)] p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--mc-text-muted)]">
                <Quiz fontSize="inherit" />
                作答題數
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--mc-text)]">
                {loadingList ? "-" : totalQuestions}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--mc-border)] bg-[color-mix(in_srgb,var(--mc-surface)_88%,black_12%)] p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--mc-text-muted)]">
                <SportsScore fontSize="inherit" />
                最高分數
              </div>
              <div className="mt-2 text-2xl font-semibold text-[var(--mc-text)]">
                {loadingList ? "-" : bestScore}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden rounded-2xl border border-amber-300/18 bg-[linear-gradient(180deg,rgba(245,158,11,0.08),rgba(245,158,11,0.02))] p-4 sm:p-5">
          <div className="text-xs uppercase tracking-[0.22em] text-amber-200/80">
            使用提示
          </div>
          <ol className="mt-3 space-y-3 text-sm leading-6 text-[var(--mc-text-muted)]">
            <li>1. 點擊房間群組可展開同一房間的多場對戰紀錄。</li>
            <li>2. 每場紀錄會顯示分數、答對數、最大 Combo 與歌單來源。</li>
            <li>3. 點進詳情後可查看完整結算回顧與題目紀錄。</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center rounded-full border border-[var(--mc-accent)]/55 bg-[var(--mc-accent)]/16 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-[var(--mc-text)] transition hover:bg-[var(--mc-accent)]/22"
              onClick={() => navigate("/rooms", { replace: true })}
            >
              返回房間列表
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  const listView = (
    <section className="mt-5 space-y-4">
      {loadingList ? (
        <div className="flex items-center justify-center rounded-[24px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(20,17,13,0.86),rgba(8,7,5,0.96))] px-6 py-10 text-[var(--mc-text-muted)]">
          <div className="inline-flex items-center gap-3">
            <CircularProgress size={18} thickness={5} sx={{ color: "#f59e0b" }} />
            載入對戰歷史中...
          </div>
        </div>
      ) : listError ? (
        <div className="rounded-[24px] border border-rose-400/20 bg-rose-950/20 px-6 py-5 text-sm text-rose-100">
          {listError}
        </div>
      ) : items.length === 0 ? (
        <div className="relative overflow-hidden rounded-[24px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(20,17,13,0.86),rgba(8,7,5,0.96))] p-6 text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-200">
            <HistoryEdu />
          </div>
          <h2 className="text-lg font-semibold text-[var(--mc-text)]">
            尚無對戰紀錄
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--mc-text-muted)]">
            完成一場遊戲後，系統會將結算摘要與回顧資料存到歷史頁。之後可以回來查看分數、答對數與 Combo 表現。
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groupedHistoryItems.map((group, groupIndex) => {
            const groupKey = group.roomId || group.roomName || group.items[0]?.matchId;
            if (!groupKey) return null;
            const collapsed = collapsedRoomGroups[groupKey] ?? true;
            const latestItem = group.items[0] ?? null;
            const latestPlaylistLabel = latestItem
              ? parseSummaryPlaylistLabel(latestItem)
              : null;
            const groupBestScore = group.items.reduce(
              (max, entry) => Math.max(max, entry.selfPlayer?.finalScore ?? 0),
              0,
            );

            return (
              <div
                key={groupKey}
                className="rounded-[22px] border border-[var(--mc-border)]/85 bg-[linear-gradient(180deg,rgba(14,13,10,0.82),rgba(9,8,6,0.92))] p-2 sm:p-3"
              >
                <button
                  type="button"
                  className="group relative block w-full min-w-0 overflow-hidden rounded-[18px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(20,17,13,0.92),rgba(8,7,5,0.99))] px-4 py-4 text-left transition duration-200 hover:border-amber-300/20 hover:bg-[linear-gradient(180deg,rgba(24,20,16,0.94),rgba(10,8,6,1))] sm:px-5"
                  onClick={() =>
                    setCollapsedRoomGroups((prev) => ({
                      ...prev,
                      [groupKey]: !(prev[groupKey] ?? true),
                    }))
                  }
                >
                  <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-amber-300/35 opacity-65 transition group-hover:opacity-95" />
                  <div className="flex min-w-0 items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Chip
                          size="small"
                          label={group.roomName || group.roomId}
                          className="border-amber-300/22 bg-amber-300/8 text-amber-100"
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label={`${group.items.length} 場`}
                          className="border-[var(--mc-border)] text-[var(--mc-text)]"
                          variant="outlined"
                        />
                        {groupBestScore > 0 && (
                          <Chip
                            size="small"
                            label={`最佳 ${groupBestScore}`}
                            className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                            variant="outlined"
                          />
                        )}
                        {latestItem && (
                          <Chip
                            size="small"
                            label={`最近 ${formatRelative(latestItem.endedAt) || formatDateTime(latestItem.endedAt)}`}
                            className="border-sky-300/25 bg-sky-300/10 text-sky-100"
                            variant="outlined"
                          />
                        )}
                      </div>

                      <div className="grid gap-1 text-sm text-[var(--mc-text-muted)] sm:grid-cols-3 sm:gap-x-4">
                        <div className="inline-flex min-w-0 items-center gap-1.5">
                          <AccessTime sx={{ fontSize: 16 }} />
                          <span className="truncate">
                            {latestItem ? formatDateTime(latestItem.endedAt) : "-"}
                          </span>
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                          <Quiz sx={{ fontSize: 16 }} />
                          <span>{latestItem ? `最近 ${latestItem.questionCount} 題` : "-"}</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                          <MeetingRoom sx={{ fontSize: 16 }} />
                          <span>{collapsed ? "點擊展開場次" : "點擊收合"}</span>
                        </div>
                      </div>

                      {latestPlaylistLabel && (
                        <div className="mt-2 truncate text-xs text-[var(--mc-text-muted)]/90">
                          {latestPlaylistLabel}
                        </div>
                      )}
                    </div>

                    <div className="mt-1 flex shrink-0 items-center gap-2 text-[var(--mc-text-muted)]">
                      <span className="hidden text-xs tracking-[0.14em] sm:inline">
                        {collapsed ? "展開" : "收合"}
                      </span>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--mc-border)] bg-white/5 transition group-hover:border-amber-300/30 group-hover:bg-amber-300/10 group-hover:text-amber-100">
                        <ChevronRightRounded
                          sx={{
                            fontSize: 18,
                            transform: collapsed ? "rotate(90deg)" : "rotate(270deg)",
                            transition: "transform 180ms ease",
                          }}
                        />
                      </span>
                    </div>
                  </div>
                </button>

                {!collapsed && (
                  <div className="mt-3 space-y-3">
                    {group.items.map((item, itemIndex) => {
                      const replayStatus = parseSummaryReplayStatus(item);
                      const replayUnavailable =
                        replayStatus === "too_large" || replayStatus === "omitted";
                      const playlistLabel = parseSummaryPlaylistLabel(item);

                      return (
                        <button
                          key={item.matchId}
                          type="button"
                          className="group relative block w-full min-w-0 overflow-hidden rounded-[20px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(18,16,12,0.9),rgba(8,7,5,0.98))] px-4 py-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-amber-300/20 hover:bg-[linear-gradient(180deg,rgba(24,20,16,0.92),rgba(10,8,6,0.99))] sm:px-5"
                          onClick={() => void openReplayDetail(item)}
                        >
                          <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-amber-300/25 opacity-60 transition group-hover:opacity-90" />
                          <div className="flex min-w-0 items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <Chip
                                  size="small"
                                  label={`第 ${item.roundNo} 場`}
                                  className="border-amber-300/30 bg-amber-300/10 text-amber-100"
                                  variant="outlined"
                                />
                                {item.selfPlayer && (
                                  <>
                                    <Chip
                                      size="small"
                                      label={`分數 ${item.selfPlayer.finalScore}`}
                                      className="border-emerald-300/30 bg-emerald-300/10 text-emerald-100"
                                      variant="outlined"
                                    />
                                    <Chip
                                      size="small"
                                      label={`答對 ${item.selfPlayer.correctCount}/${item.questionCount}`}
                                      className="border-sky-300/30 bg-sky-300/10 text-sky-100"
                                      variant="outlined"
                                    />
                                    <Chip
                                      size="small"
                                      label={`Combo x${item.selfPlayer.maxCombo}`}
                                      className="border-fuchsia-300/30 bg-fuchsia-300/10 text-fuchsia-100"
                                      variant="outlined"
                                    />
                                  </>
                                )}
                              </div>

                              <div className="grid gap-1 text-sm text-[var(--mc-text-muted)] sm:grid-cols-3 sm:gap-x-4">
                                <div className="inline-flex min-w-0 items-center gap-1.5">
                                  <AccessTime sx={{ fontSize: 16 }} />
                                  <span className="truncate">{formatDateTime(item.endedAt)}</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5">
                                  <Quiz sx={{ fontSize: 16 }} />
                                  <span>{item.questionCount} 題</span>
                                </div>
                                <div className="inline-flex items-center gap-1.5">
                                  <MeetingRoom sx={{ fontSize: 16 }} />
                                  <span>
                                    {item.playerCount} 人 · {formatRelative(item.endedAt)}
                                  </span>
                                </div>
                              </div>

                              {playlistLabel && (
                                <div className="mt-2 truncate text-xs text-[var(--mc-text-muted)]/90">
                                  {playlistLabel}
                                </div>
                              )}

                              {replayUnavailable && (
                                <div className="mt-2 text-xs text-amber-100/85">
                                  回放內容已精簡，仍可查看本場摘要與分數資訊。
                                </div>
                              )}
                            </div>

                            <div className="mt-1 flex shrink-0 items-center gap-2 text-[var(--mc-text-muted)]">
                              <span className="hidden text-xs tracking-[0.14em] sm:inline">
                                檢視詳情
                              </span>
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--mc-border)] bg-white/5 transition group-hover:border-amber-300/30 group-hover:bg-amber-300/10 group-hover:text-amber-100">
                                <ChevronRightRounded sx={{ fontSize: 18 }} />
                              </span>
                            </div>
                          </div>

                          <div
                            className="pointer-events-none absolute right-4 top-3 text-[10px] tracking-[0.3em] text-[var(--mc-text-muted)]/60"
                            style={{ animationDelay: `${groupIndex * 80 + itemIndex * 60}ms` }}
                          >
                            ARCHIVE
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );

  const detailView = selectedSummary && (
    <section className="mt-5 space-y-4">
      <div className="relative overflow-hidden rounded-[24px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(16,14,11,0.95),rgba(8,7,5,0.99))] p-4 sm:p-5">
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--mc-border)] bg-[var(--mc-surface)]/80 px-3 py-1.5 text-xs font-semibold tracking-[0.14em] text-[var(--mc-text)] transition hover:border-amber-300/30 hover:bg-amber-300/10"
              onClick={() => setSelectedMatchId(null)}
            >
              <ArrowBackRounded sx={{ fontSize: 16 }} />
              返回對戰歷史
            </button>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Chip
                size="small"
                label={`第 ${selectedSummary.roundNo} 場`}
                className="border-amber-300/30 bg-amber-300/10 text-amber-100"
                variant="outlined"
              />
              <Chip
                size="small"
                label={selectedSummary.roomName || selectedSummary.roomId}
                className="border-[var(--mc-border)] text-[var(--mc-text)]"
                variant="outlined"
              />
            </div>

            <h2 className="mt-3 text-lg font-semibold text-[var(--mc-text)] sm:text-xl">
              對戰詳情
            </h2>
            <p className="mt-1 text-sm text-[var(--mc-text-muted)]">
              {formatDateTime(selectedSummary.endedAt)} · {selectedSummary.playerCount} 人 ·{" "}
              {selectedSummary.questionCount} 題
            </p>
          </div>

          <div className="grid min-w-[220px] gap-2 text-sm sm:grid-cols-1">
            <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/70 px-3 py-2">
              <div className="text-[10px] uppercase tracking-[0.22em] text-[var(--mc-text-muted)]">
                我的成績
              </div>
              {selectedSummary.selfPlayer ? (
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[var(--mc-text)]">
                  <span>分數 {selectedSummary.selfPlayer.finalScore}</span>
                  <span>答對 {selectedSummary.selfPlayer.correctCount}</span>
                  <span>Combo x{selectedSummary.selfPlayer.maxCombo}</span>
                </div>
              ) : (
                <div className="mt-1 text-[var(--mc-text-muted)]">此場沒有你的玩家紀錄</div>
              )}
            </div>
            {parseSummaryPlaylistLabel(selectedSummary) && (
              <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/70 px-3 py-2 text-sm text-[var(--mc-text-muted)]">
                <span className="mr-2 text-[10px] uppercase tracking-[0.22em] text-[var(--mc-text-muted)]">
                  歌單
                </span>
                <span className="text-[var(--mc-text)]">
                  {parseSummaryPlaylistLabel(selectedSummary)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoadingSelectedReplay && !selectedReplay ? (
        <div className="rounded-[24px] border border-[var(--mc-border)] bg-[linear-gradient(180deg,rgba(20,17,13,0.88),rgba(8,7,5,0.98))] p-6">
          <div className="flex items-center justify-center rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/60 px-4 py-12 text-[var(--mc-text-muted)]">
            <div className="inline-flex items-center gap-3">
              <CircularProgress size={18} thickness={5} sx={{ color: "#f59e0b" }} />
              載入對戰回顧中...
            </div>
          </div>
        </div>
      ) : selectedReplay ? (
        <div className="relative overflow-hidden rounded-[24px] border border-[var(--mc-border)]/80 bg-[linear-gradient(180deg,rgba(13,12,10,0.96),rgba(7,6,5,0.98))] p-3 shadow-[0_12px_26px_-18px_rgba(0,0,0,0.62)] sm:p-4">
          <GameSettlementPanel
            key={selectedSummary.matchId}
            room={selectedReplay.room}
            participants={selectedReplay.participants}
            messages={selectedReplay.messages}
            playlistItems={selectedReplay.playlistItems ?? []}
            trackOrder={selectedReplay.trackOrder}
            playedQuestionCount={selectedReplay.playedQuestionCount}
            startedAt={selectedReplay.startedAt}
            endedAt={selectedReplay.endedAt}
            meClientId={clientId}
            questionRecaps={selectedReplay.questionRecaps}
            hideActions
            mode="history"
          />
        </div>
      ) : (
        <div className="rounded-[24px] border border-amber-300/16 bg-amber-300/5 px-4 py-5 text-sm text-amber-100/90">
          這場對戰尚未取得完整回放內容，可能已被精簡或仍在同步中，請稍後再試。
        </div>
      )}
    </section>
  );

  return (
    <div className="mx-auto w-full max-w-[1320px] min-w-0 px-1 sm:px-0">
      {archiveHeader}
      {selectedMatchId ? detailView : listView}
    </div>
  );
};

export default RoomHistoryPage;
