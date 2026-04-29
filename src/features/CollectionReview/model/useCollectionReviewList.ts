import { useInfiniteQuery } from "@tanstack/react-query";
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

  return useInfiniteQuery({
    queryKey: [
      "collection-review",
      "reviews",
      normalizedCollectionId,
      authUser?.id ?? "guest",
      limit,
    ],
    enabled: enabled && normalizedCollectionId.length > 0,
    staleTime: 30_000,
    initialPageParam: 0,
    queryFn: ({ pageParam, signal }) =>
      collectionReviewApi.fetchReviews({
        collectionId: normalizedCollectionId,
        authToken,
        refreshAuthToken,
        limit,
        offset: pageParam,
        signal,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextOffset : undefined,
  });
};
