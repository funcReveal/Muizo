import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@shared/auth/AuthContext";

import { collectionReviewApi } from "./collectionReviewApi";

type UseCollectionReviewListOptions = {
  collectionId: string | null | undefined;
  enabled?: boolean;
  limit?: number;
};

export const useCollectionReviewList = ({
  collectionId,
  enabled = true,
  limit = 6,
}: UseCollectionReviewListOptions) => {
  const { authToken, authUser, refreshAuthToken } = useAuth();
  const normalizedCollectionId = collectionId?.trim() ?? "";

  return useQuery({
    queryKey: [
      "collection-review",
      "reviews",
      normalizedCollectionId,
      authUser?.id ?? "guest",
      limit,
    ],
    enabled: enabled && normalizedCollectionId.length > 0,
    staleTime: 30_000,
    queryFn: ({ signal }) =>
      collectionReviewApi.fetchReviews({
        collectionId: normalizedCollectionId,
        authToken,
        refreshAuthToken,
        limit,
        signal,
      }),
  });
};
