import type { SiteAnnouncement } from "./siteAnnouncement";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error?: {
    code?: string;
    message?: string;
  };
};

export async function fetchActiveSiteAnnouncement(
  signal?: AbortSignal,
): Promise<SiteAnnouncement | null> {
  const response = await fetch(`${API_URL}/api/announcements/active`, {
    method: "GET",
    signal,
  });

  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<SiteAnnouncement | null> | null;

  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.error?.message ??
        `Failed to fetch active announcement: ${response.status}`,
    );
  }

  return payload.data;
}
