import { ensureFreshAuthToken } from "@shared/auth/token";

import type {
  CareerCollectionRankShortcutItem,
  CareerCompositeStats,
  CareerHeroStats,
  CareerHighlightItem,
  CareerOverviewData,
  CareerWeeklyStats,
} from "../types/career";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

type CareerOverviewApiResponse = {
  ok: boolean;
  data?: PartialCareerOverviewData;
  error?: string;
};

type PartialCareerOverviewData = {
  hero?: Partial<CareerHeroStats>;
  composite?: Partial<CareerCompositeStats>;
  weekly?: Partial<CareerWeeklyStats>;
  highlights?: CareerHighlightItem[];
  collectionShortcuts?: CareerCollectionRankShortcutItem[];
};

interface FetchCareerOverviewParams {
  clientId: string | null;
  authToken: string | null;
  refreshAuthToken: () => Promise<string | null>;
  fallback: CareerOverviewData;
}

const buildHeaders = async (
  authToken: string | null,
  refreshAuthToken: () => Promise<string | null>,
) => {
  if (!authToken) {
    return {
      "Content-Type": "application/json",
    };
  }

  const token = await ensureFreshAuthToken({
    token: authToken,
    refreshAuthToken,
  });

  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const mergeCareerOverviewData = (
  fallback: CareerOverviewData,
  incoming?: PartialCareerOverviewData,
): CareerOverviewData => {
  if (!incoming) return fallback;

  return {
    hero: {
      ...fallback.hero,
      ...(incoming.hero ?? {}),
    },
    composite: {
      ...fallback.composite,
      ...(incoming.composite ?? {}),
      trend:
        incoming.composite?.trend && incoming.composite.trend.length > 0
          ? incoming.composite.trend
          : fallback.composite.trend,
    },
    weekly: {
      ...fallback.weekly,
      ...(incoming.weekly ?? {}),
    },
    highlights:
      incoming.highlights && incoming.highlights.length > 0
        ? incoming.highlights
        : fallback.highlights,
    collectionShortcuts:
      incoming.collectionShortcuts && incoming.collectionShortcuts.length > 0
        ? incoming.collectionShortcuts
        : fallback.collectionShortcuts,
  };
};

export const fetchCareerOverview = async ({
  clientId,
  authToken,
  refreshAuthToken,
  fallback,
}: FetchCareerOverviewParams): Promise<CareerOverviewData> => {
  if (!API_URL) {
    return fallback;
  }

  const params = new URLSearchParams();
  if (clientId) params.set("clientId", clientId);

  const url = `${API_URL}/api/career/overview${
    params.size ? `?${params.toString()}` : ""
  }`;

  const headers = await buildHeaders(authToken, refreshAuthToken);

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  const payload = (await response
    .json()
    .catch(() => null)) as CareerOverviewApiResponse | null;

  if (!response.ok || !payload?.ok) {
    throw new Error(payload?.error ?? "讀取生涯總覽失敗");
  }

  return mergeCareerOverviewData(fallback, payload.data);
};
