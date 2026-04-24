import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@shared/auth/AuthContext";

import { mockCareerOverviewData } from "../mocks/career.mock";
import type {
  CareerOverviewData,
  CareerOverviewQueryResult,
} from "../types/career";
import { fetchCareerOverview } from "./careerOverviewApi";

const ENABLE_CAREER_OVERVIEW_API =
  import.meta.env.VITE_ENABLE_CAREER_OVERVIEW_API === "true";

type RemoteCareerOverviewState = {
  requestKey: string;
  data: CareerOverviewData | null;
  error: string | null;
};

const buildCareerOverviewRequestKey = ({
  clientId,
  hasAuthToken,
}: {
  clientId: string | null;
  hasAuthToken: boolean;
}) => {
  return `${hasAuthToken ? "auth" : "guest"}:${clientId ?? "anonymous"}`;
};

export const useCareerOverviewData = (): CareerOverviewQueryResult => {
  const { clientId, authToken, refreshAuthToken } = useAuth();

  const fallbackData = useMemo(() => mockCareerOverviewData, []);

  const requestKey = useMemo(
    () =>
      buildCareerOverviewRequestKey({
        clientId,
        hasAuthToken: Boolean(authToken),
      }),
    [authToken, clientId],
  );

  const [remoteState, setRemoteState] =
    useState<RemoteCareerOverviewState | null>(null);

  useEffect(() => {
    if (!ENABLE_CAREER_OVERVIEW_API) return;

    let cancelled = false;
    const currentRequestKey = requestKey;

    void fetchCareerOverview({
      clientId,
      authToken,
      refreshAuthToken,
      fallback: fallbackData,
    })
      .then((nextData) => {
        if (cancelled) return;

        setRemoteState({
          requestKey: currentRequestKey,
          data: nextData,
          error: null,
        });
      })
      .catch((caughtError) => {
        if (cancelled) return;

        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "讀取生涯總覽失敗";

        setRemoteState({
          requestKey: currentRequestKey,
          data: null,
          error: message,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [authToken, clientId, fallbackData, refreshAuthToken, requestKey]);

  if (!ENABLE_CAREER_OVERVIEW_API) {
    return {
      data: fallbackData,
      isLoading: false,
      error: null,
    };
  }

  const matchedRemoteState =
    remoteState?.requestKey === requestKey ? remoteState : null;

  return {
    data: matchedRemoteState?.data ?? fallbackData,
    isLoading: matchedRemoteState === null,
    error: matchedRemoteState?.error ?? null,
  };
};

export default useCareerOverviewData;
