import { useEffect, useRef } from "react";

import type {
  DbCollection,
  DbCollectionItem,
  EditableItem,
} from "../ui/lib/editTypes";
import { collectionsApi } from "./collectionsApi";
import { ensureFreshAuthToken } from "../../../shared/auth/token";

type UseCollectionLoaderParams = {
  authToken: string | null;
  ownerId: string | null;
  collectionId?: string | null;
  authUser: {
    display_name?: string | null;
    provider?: string | null;
    provider_user_id?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
  displayUsername?: string | null;
  refreshAuthToken: () => Promise<string | null>;
  setCollections: (collections: DbCollection[]) => void;
  setCollectionsLoading: (value: boolean) => void;
  setCollectionsError: (value: string | null) => void;
  setActiveCollectionId: (value: string | null) => void;
  setCollectionTitle: (value: string) => void;
  setCollectionVisibility: (value: "private" | "public") => void;
  buildEditableItemsFromDb: (items: DbCollectionItem[]) => EditableItem[];
  setPlaylistItems: (items: EditableItem[]) => void;
  setItemsLoading: (value: boolean) => void;
  setItemsError: (value: string | null) => void;
  setHasUnsavedChanges: (value: boolean) => void;
  setSaveStatus: (value: "idle" | "saving" | "saved" | "error") => void;
  setSaveError: (value: string | null) => void;
  dirtyCounterRef: React.RefObject<number>;
};

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

export const useCollectionLoader = ({
  authToken,
  ownerId,
  collectionId,
  authUser,
  displayUsername,
  refreshAuthToken,
  setCollections,
  setCollectionsLoading,
  setCollectionsError,
  setActiveCollectionId,
  setCollectionTitle,
  setCollectionVisibility,
  buildEditableItemsFromDb,
  setPlaylistItems,
  setItemsLoading,
  setItemsError,
  setHasUnsavedChanges,
  setSaveStatus,
  setSaveError,
  dirtyCounterRef,
}: UseCollectionLoaderParams) => {
  const lastCollectionsAuthTokenRef = useRef<string | null>(null);
  const lastCollectionsKeyRef = useRef<string | null>(null);
  const lastItemsAuthTokenRef = useRef<string | null>(null);
  const lastItemsKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!ownerId || !authToken) {
      setCollectionsLoading(false);
      return;
    }
    const key = `${ownerId}:${collectionId ?? ""}`;
    // A token refresh updates authToken and would re-trigger this effect,
    // causing a visible "refresh" (spinners, refetch) despite no real data change.
    // Skip that case when only the token changed and the key is the same.
    const tokenChanged =
      lastCollectionsAuthTokenRef.current !== null &&
      lastCollectionsAuthTokenRef.current !== authToken;
    if (tokenChanged && lastCollectionsKeyRef.current === key) {
      lastCollectionsAuthTokenRef.current = authToken;
      return;
    }
    lastCollectionsAuthTokenRef.current = authToken;
    lastCollectionsKeyRef.current = key;
    let active = true;

    const run = async (token: string, allowRetry: boolean) => {
      const userRes = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: collectionsApi.buildJsonHeaders(token),
        body: JSON.stringify({
          id: ownerId,
          display_name:
            authUser?.display_name && authUser.display_name !== "（未提供名稱）"
              ? authUser.display_name
              : displayUsername && displayUsername !== "（未提供名稱）"
                ? displayUsername
                : "Guest",
          provider: authUser?.provider ?? "google",
          provider_user_id: authUser?.provider_user_id ?? ownerId,
          email: authUser?.email ?? null,
          avatar_url: authUser?.avatar_url ?? null,
        }),
      });

      if (userRes.status === 401 && allowRetry) {
        const refreshed = await refreshAuthToken();
        if (refreshed) {
          return run(refreshed, false);
        }
      }

      if (!userRes.ok) {
        const userPayload = await userRes.json().catch(() => null);
        throw new Error(userPayload?.error ?? "Failed to sync user");
      }

      let items: DbCollection[] = [];
      try {
        items = await collectionsApi.fetchCollections(token, ownerId);
      } catch (error) {
        if (String(error).includes("401") && allowRetry) {
          const refreshed = await refreshAuthToken();
          if (refreshed) {
            return run(refreshed, false);
          }
        }
        throw error;
      }
      if (!active) return;
      setCollections(items);
      if (collectionId) {
        const matched = items.find((item) => item.id === collectionId);
        setActiveCollectionId(collectionId);
        setCollectionTitle(matched?.title ?? "");
        setCollectionVisibility(matched?.visibility ?? "private");
      } else {
        setCollectionTitle("");
        setCollectionVisibility("private");
      }
    };

    const ensureAndLoad = async () => {
      const startedAt = performance.now();
      setCollectionsLoading(true);
      setCollectionsError(null);
      console.debug("[mq-collections] collections load start", {
        ownerId,
        collectionId: collectionId ?? null,
        startedAt: new Date().toISOString(),
      });
      try {
        const tokenRefreshStartedAt = performance.now();
        const token = await ensureFreshAuthToken({
          token: authToken,
          refreshAuthToken,
        });
        console.debug("[mq-collections] collections token ready", {
          ownerId,
          collectionId: collectionId ?? null,
          elapsedMs: Math.round(performance.now() - tokenRefreshStartedAt),
          hasToken: Boolean(token),
        });
        if (!token) {
          throw new Error("Unauthorized");
        }
        const fetchStartedAt = performance.now();
        await run(token, true);
        console.debug("[mq-collections] collections fetch success", {
          ownerId,
          collectionId: collectionId ?? null,
          elapsedMs: Math.round(performance.now() - fetchStartedAt),
        });
      } catch (error) {
        if (!active) return;
        console.error("[mq-collections] collections load failed", {
          ownerId,
          collectionId: collectionId ?? null,
          elapsedMs: Math.round(performance.now() - startedAt),
          error: error instanceof Error ? error.message : String(error),
        });
        setCollectionsError(
          error instanceof Error ? error.message : String(error),
        );
      } finally {
        console.debug("[mq-collections] collections load end", {
          ownerId,
          collectionId: collectionId ?? null,
          elapsedMs: Math.round(performance.now() - startedAt),
          active,
        });
        if (active) setCollectionsLoading(false);
      }
    };

    void ensureAndLoad();

    return () => {
      active = false;
    };
  }, [
    authToken,
    ownerId,
    collectionId,
    authUser?.display_name,
    authUser?.provider,
    authUser?.provider_user_id,
    authUser?.email,
    authUser?.avatar_url,
    displayUsername,
    refreshAuthToken,
    setCollections,
    setCollectionsLoading,
    setCollectionsError,
    setActiveCollectionId,
    setCollectionTitle,
    setCollectionVisibility,
  ]);

  useEffect(() => {
    if (!collectionId || !authToken) {
      setItemsLoading(false);
      return;
    }
    const key = collectionId;
    const tokenChanged =
      lastItemsAuthTokenRef.current !== null &&
      lastItemsAuthTokenRef.current !== authToken;
    if (tokenChanged && lastItemsKeyRef.current === key) {
      lastItemsAuthTokenRef.current = authToken;
      return;
    }
    lastItemsAuthTokenRef.current = authToken;
    lastItemsKeyRef.current = key;
    let active = true;

    const run = async (token: string, allowRetry: boolean) => {
      let items: DbCollectionItem[] = [];
      try {
        items = await collectionsApi.fetchCollectionItems(token, collectionId);
      } catch (error) {
        if (String(error).includes("401") && allowRetry) {
          const refreshed = await refreshAuthToken();
          if (refreshed) {
            return run(refreshed, false);
          }
        }
        throw error;
      }
      const enriched = buildEditableItemsFromDb(items);
      if (!active) return;
      setPlaylistItems(enriched);
      setItemsError(null);
      setHasUnsavedChanges(false);
      dirtyCounterRef.current = 0;
      setSaveStatus("idle");
      setSaveError(null);
    };

    const ensureAndLoad = async () => {
      const startedAt = performance.now();
      setItemsLoading(true);
      setItemsError(null);
      console.debug("[mq-collections] items load start", {
        collectionId,
        startedAt: new Date().toISOString(),
      });
      try {
        const tokenRefreshStartedAt = performance.now();
        const token = await ensureFreshAuthToken({
          token: authToken,
          refreshAuthToken,
        });
        console.debug("[mq-collections] items token ready", {
          collectionId,
          elapsedMs: Math.round(performance.now() - tokenRefreshStartedAt),
          hasToken: Boolean(token),
        });
        if (!token) {
          throw new Error("Unauthorized");
        }
        const fetchStartedAt = performance.now();
        await run(token, true);
        console.debug("[mq-collections] items fetch success", {
          collectionId,
          elapsedMs: Math.round(performance.now() - fetchStartedAt),
        });
      } catch (error) {
        if (!active) return;
        console.error("[mq-collections] items load failed", {
          collectionId,
          elapsedMs: Math.round(performance.now() - startedAt),
          error: error instanceof Error ? error.message : String(error),
        });
        setItemsError(error instanceof Error ? error.message : String(error));
      } finally {
        console.debug("[mq-collections] items load end", {
          collectionId,
          elapsedMs: Math.round(performance.now() - startedAt),
          active,
        });
        if (active) setItemsLoading(false);
      }
    };

    void ensureAndLoad();

    return () => {
      active = false;
    };
  }, [
    authToken,
    collectionId,
    buildEditableItemsFromDb,
    refreshAuthToken,
    setItemsLoading,
    setItemsError,
    setPlaylistItems,
    setHasUnsavedChanges,
    setSaveStatus,
    setSaveError,
    dirtyCounterRef,
  ]);
};
