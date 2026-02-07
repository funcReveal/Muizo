import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Box, Button } from "@mui/material";
import { useRoom } from "../../Room/model/useRoom";
import { ensureFreshAuthToken } from "../../../shared/auth/token";

const WORKER_API_URL = import.meta.env.VITE_WORKER_API_URL;

type DbCollection = {
  id: string;
  owner_id: string;
  title: string;
  description?: string | null;
  visibility?: string;
};

const DEFAULT_DURATION_SEC = 30;

const parseDurationToSeconds = (duration?: string): number | null => {
  if (!duration) return null;
  const parts = duration.split(":").map((part) => Number(part));
  if (parts.some((value) => Number.isNaN(value))) return null;
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  return null;
};

const extractVideoId = (url: string | undefined | null) => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host.includes("youtu.be")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }
    const id = parsed.searchParams.get("v");
    if (id) return id;
    const path = parsed.pathname.split("/").filter(Boolean);
    if (path[0] === "shorts" && path[1]) return path[1];
    if (path[0] === "embed" && path[1]) return path[1];
    return null;
  } catch {
    return null;
  }
};

const createServerId = () =>
  crypto.randomUUID?.() ??
  `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;

const buildJsonHeaders = (token: string) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

const CollectionsCreatePage = () => {
  const navigate = useNavigate();
  const {
    authToken,
    authUser,
    playlistUrl,
    playlistItems,
    lastFetchedPlaylistTitle,
    playlistError,
    playlistLoading,
    handleFetchPlaylist,
    setPlaylistUrl,
    authLoading,
    refreshAuthToken,
    youtubePlaylists,
    youtubePlaylistsLoading,
    youtubePlaylistsError,
    fetchYoutubePlaylists,
    importYoutubePlaylist,
    loginWithGoogle,
  } = useRoom();

  const [collectionTitle, setCollectionTitle] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [playlistSource, setPlaylistSource] = useState<"url" | "youtube">(
    "url",
  );
  const youtubeFetchedRef = useRef(false);
  const [youtubeQuery, setYoutubeQuery] = useState("");
  const [youtubeMenuOpen, setYoutubeMenuOpen] = useState(false);

  const ownerId = authUser?.id ?? null;
  const hasPlaylistItems = playlistItems.length > 0;
  const playlistCountLabel = `共 ${playlistItems.length} 首`;
  const filteredPlaylists = youtubeQuery.trim()
    ? youtubePlaylists.filter((item) =>
        item.title.toLowerCase().includes(youtubeQuery.trim().toLowerCase()),
      )
    : youtubePlaylists;

  useEffect(() => {
    if (!lastFetchedPlaylistTitle) return;
    setCollectionTitle(lastFetchedPlaylistTitle);
  }, [lastFetchedPlaylistTitle]);

  const collectionPreview = useMemo(() => {
    if (!hasPlaylistItems) return null;
    const first = playlistItems[0];
    return {
      title: collectionTitle || lastFetchedPlaylistTitle || "未命名收藏庫",
      subtitle: first?.title ?? "",
      count: playlistItems.length,
    };
  }, [
    collectionTitle,
    hasPlaylistItems,
    lastFetchedPlaylistTitle,
    playlistItems,
  ]);

  useEffect(() => {
    if (playlistSource !== "youtube") return;
    if (!authUser) return;
    if (youtubeFetchedRef.current) return;
    youtubeFetchedRef.current = true;
    void fetchYoutubePlaylists();
  }, [playlistSource, authUser, fetchYoutubePlaylists]);

  const ensureYoutubePlaylists = () => {
    if (!authUser) return;
    if (youtubeFetchedRef.current) return;
    youtubeFetchedRef.current = true;
    void fetchYoutubePlaylists();
  };

  const handleCreateCollection = async () => {
    if (!WORKER_API_URL) {
      setCreateError("尚未設定收藏庫 API 位置 (WORKER_API_URL)");
      return;
    }
    if (!authToken || !ownerId) {
      setCreateError("請先使用 Google 登入後再建立收藏庫");
      return;
    }
    if (!collectionTitle.trim()) {
      setCreateError("請先輸入收藏庫名稱");
      return;
    }
    if (!hasPlaylistItems) {
      setCreateError("請先取得播放清單");
      return;
    }

    setCreateError(null);
    setIsCreating(true);

    const create = async (token: string, allowRetry: boolean) => {
      const res = await fetch(`${WORKER_API_URL}/collections`, {
        method: "POST",
        headers: buildJsonHeaders(token),
        body: JSON.stringify({
          owner_id: ownerId,
          title: collectionTitle.trim(),
          description: null,
          visibility,
        }),
      });

      if (res.status === 401 && allowRetry) {
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          return create(refreshed, false);
        }
      }

      const payload = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(payload?.error ?? "Failed to create collection");
      }
      return payload?.data as DbCollection;
    };

    try {
      const token = await ensureFreshAuthToken({
        token: authToken,
        refreshAuthToken,
      });
      if (!token) {
        throw new Error("Unauthorized");
      }
      const created = await create(token, true);
      if (!created?.id) {
        throw new Error("Missing collection id");
      }

      const insertItems = playlistItems.map((item, idx) => {
        const durationSec =
          parseDurationToSeconds(item.duration) ?? DEFAULT_DURATION_SEC;
        const safeDuration = Math.max(1, durationSec);
        const endSec = Math.min(DEFAULT_DURATION_SEC, safeDuration);
        return {
          id: createServerId(),
          sort: idx,
          source_id: extractVideoId(item.url),
          provider: "youtube",
          title: item.title || item.answerText || "Untitled",
          channel_title: item.uploader ?? null,
          start_sec: 0,
          end_sec: Math.max(1, endSec),
          answer_text: item.answerText || item.title || "Untitled",
          ...(durationSec ? { duration_sec: durationSec } : {}),
        };
      });

      const insert = async (token: string, allowRetry: boolean) => {
        const res = await fetch(
          `${WORKER_API_URL}/collections/${created.id}/items`,
          {
            method: "POST",
            headers: buildJsonHeaders(token),
            body: JSON.stringify({ items: insertItems }),
          },
        );
        if (res.status === 401 && allowRetry) {
          const refreshed = await refreshAuthToken();
          if (refreshed) {
            return insert(refreshed, false);
          }
        }
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error ?? "Failed to insert items");
        }
        return null;
      };

      await insert(token, true);
      navigate(`/collections/${created.id}/edit`, { replace: true });
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : "建立失敗");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Box className="mx-auto w-full max-w-6xl px-4 pb-6 pt-4">
      <Box className="relative overflow-hidden rounded-3xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/70 p-5 text-[var(--mc-text)] shadow-[0_30px_70px_-50px_rgba(15,23,42,0.8)]">
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_60%)]" />
        </div>

        <div className="relative">
          <div className="text-[11px] uppercase tracking-[0.35em] text-[var(--mc-text-muted)]">
            Collection Studio
          </div>
          <div className="mt-1.5 text-2xl font-semibold text-[var(--mc-text)]">
            建立收藏庫
          </div>
          <div className="mt-1 text-sm text-[var(--mc-text-muted)]">
            在同一頁完成播放清單匯入、收藏庫命名與可見度設定。
          </div>

          {!authToken && !authLoading && (
            <div className="mt-3 rounded-xl border border-amber-400/40 bg-amber-950/40 px-3 py-2 text-xs text-amber-200">
              請先使用 Google 登入後再建立收藏庫。
            </div>
          )}

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <div className="grid gap-3 lg:grid-rows-[auto_auto_auto_1fr]">
              <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/70 p-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-[var(--mc-text-muted)]">
                    播放清單來源
                  </div>
                  <div className="inline-flex rounded-full border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/60 p-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setPlaylistSource("url")}
                      className={`rounded-full px-3 py-1 transition ${
                        playlistSource === "url"
                          ? "bg-[var(--mc-accent)]/15 text-[var(--mc-text)]"
                          : "text-[var(--mc-text-muted)] hover:text-[var(--mc-text)]"
                      }`}
                    >
                      貼上連結
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlaylistSource("youtube")}
                      className={`rounded-full px-3 py-1 transition ${
                        playlistSource === "youtube"
                          ? "bg-[var(--mc-accent-2)]/15 text-[var(--mc-text)]"
                          : "text-[var(--mc-text-muted)] hover:text-[var(--mc-text)]"
                      }`}
                    >
                      YouTube 清單
                    </button>
                  </div>
                </div>

                <div className="relative mt-3 min-h-[120px]">
                  <div
                    className={`space-y-3 transition-all duration-200 ${
                      playlistSource === "url"
                        ? "opacity-100 translate-x-0"
                        : "pointer-events-none opacity-0 -translate-x-2"
                    }`}
                    hidden={playlistSource !== "url"}
                  >
                    <div className="text-[11px] text-[var(--mc-text-muted)]">
                      直接貼上公開或未列出播放清單連結
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input
                        value={playlistUrl}
                        onChange={(e) => setPlaylistUrl(e.target.value)}
                        placeholder="貼上 YouTube 播放清單網址"
                        className="min-w-[220px] flex-1 rounded-lg border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/70 px-3 py-2 text-sm text-[var(--mc-text)]"
                      />
                      <Button
                        variant="contained"
                        onClick={handleFetchPlaylist}
                        disabled={playlistLoading}
                      >
                        {playlistLoading ? "取得中..." : "取得播放清單"}
                      </Button>
                    </div>
                    {playlistError && (
                      <div className="text-xs text-rose-300">
                        {playlistError}
                      </div>
                    )}
                    {hasPlaylistItems && (
                      <div className="text-[11px] text-[var(--mc-text-muted)]">
                        {playlistCountLabel}
                      </div>
                    )}
                  </div>

                  <div
                    className={`space-y-3 transition-all duration-200 ${
                      playlistSource === "youtube"
                        ? "opacity-100 translate-x-0"
                        : "pointer-events-none opacity-0 translate-x-2"
                    }`}
                    hidden={playlistSource !== "youtube"}
                  >
                    <div className="text-[11px] text-[var(--mc-text-muted)]">
                      透過 Google 授權取得你的 YouTube 播放清單
                      {!authUser && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={loginWithGoogle}
                        >
                          連結 Google
                        </Button>
                      )}
                      {youtubePlaylistsError && (
                        <span className="text-[11px] text-rose-300">
                          {youtubePlaylistsError}
                        </span>
                      )}
                    </div>

                    {filteredPlaylists.length > 0 && (
                      <div className="space-y-2">
                        <div className="relative">
                          <input
                            value={youtubeQuery}
                            onChange={(e) => setYoutubeQuery(e.target.value)}
                            onFocus={() => {
                              ensureYoutubePlaylists();
                              setYoutubeMenuOpen(true);
                            }}
                            onBlur={() => {
                              window.setTimeout(
                                () => setYoutubeMenuOpen(false),
                                120,
                              );
                            }}
                            placeholder={`${youtubePlaylistsLoading ? "讀取播放清單中..." : "搜尋你的播放清單"}`}
                            className="w-full rounded-lg border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/70 px-3 py-2 text-sm text-[var(--mc-text)]"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              ensureYoutubePlaylists();
                              setYoutubeMenuOpen((prev) => !prev);
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[var(--mc-text-muted)]"
                          >
                            {youtubeMenuOpen ? "收合" : "展開"}
                          </button>
                          {youtubeMenuOpen && (
                            <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/95 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.8)]">
                              <div className="max-h-56 overflow-y-auto py-2">
                                {filteredPlaylists.length === 0 && (
                                  <div className="px-3 py-2 text-xs text-[var(--mc-text-muted)]">
                                    找不到符合的播放清單
                                  </div>
                                )}
                                {filteredPlaylists.map((playlist) => (
                                  <button
                                    key={playlist.id}
                                    type="button"
                                    onClick={() => {
                                      importYoutubePlaylist(playlist.id);
                                      setYoutubeMenuOpen(false);
                                    }}
                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-xs text-[var(--mc-text)] hover:bg-[var(--mc-surface)]/70"
                                  >
                                    <span className="truncate">
                                      {playlist.title}
                                    </span>
                                    <span className="ml-2 text-[10px] text-[var(--mc-text-muted)]">
                                      {playlist.itemCount} 首
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/70 p-3">
                <div className="text-xs text-[var(--mc-text-muted)]">
                  收藏庫名稱
                </div>
                <input
                  value={collectionTitle}
                  onChange={(e) => {
                    setCollectionTitle(e.target.value);
                  }}
                  placeholder="輸入收藏庫名稱"
                  className="mt-2 w-full rounded-lg border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/70 px-3 py-2 text-sm text-[var(--mc-text)]"
                />
                <div className="mt-2 text-[11px] text-[var(--mc-text-muted)]">
                  建議使用播放清單名稱，再微調成你的收藏庫標題。
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/70 p-3">
                <div className="text-xs text-[var(--mc-text-muted)]">
                  可見度
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      visibility === "private"
                        ? "border-amber-400/60 bg-amber-400/10 text-amber-100"
                        : "border-[var(--mc-border)] text-[var(--mc-text-muted)] hover:border-[var(--mc-accent)]/60"
                    }`}
                  >
                    私密
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      visibility === "public"
                        ? "border-emerald-400/60 bg-emerald-400/10 text-emerald-100"
                        : "border-[var(--mc-border)] text-[var(--mc-text-muted)] hover:border-[var(--mc-accent)]/60"
                    }`}
                  >
                    公開
                  </button>
                </div>
                <div className="mt-2 text-[11px] text-[var(--mc-text-muted)]">
                  私密收藏庫僅自己可見；公開後可用於房間與分享。
                </div>
              </div>

              {createError && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-950/50 px-3 py-2 text-xs text-rose-200">
                  {createError}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--mc-border)] bg-[var(--mc-surface)]/70 p-3 h-full">
              <div className="text-xs text-[var(--mc-text-muted)]">
                收藏庫預覽
              </div>
              {collectionPreview ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/60 p-3">
                    <div className="text-base font-semibold text-[var(--mc-text)]">
                      {collectionPreview.title}
                    </div>
                    <div className="mt-1 text-xs text-[var(--mc-text-muted)]">
                      第一首：{collectionPreview.subtitle || "未命名"}
                    </div>
                    <div className="mt-1 text-[11px] text-[var(--mc-text-muted)]">
                      {collectionPreview.count} 首歌曲
                    </div>
                  </div>
                  <div className="rounded-xl border border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/60 p-3 text-[11px] text-[var(--mc-text-muted)]">
                    建立後可進入編輯頁調整答題文字與剪輯區間。
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-[var(--mc-border)] bg-[var(--mc-surface-strong)]/40 p-3 text-[11px] text-[var(--mc-text-muted)]">
                  取得播放清單後會顯示預覽。
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outlined" onClick={() => navigate("/collections")}>
              返回收藏庫
            </Button>
            <Button
              variant="contained"
              onClick={handleCreateCollection}
              disabled={isCreating || authLoading || !authToken}
            >
              {isCreating ? "建立中..." : "建立收藏庫"}
            </Button>
          </div>
        </div>
      </Box>
    </Box>
  );
};

export default CollectionsCreatePage;
