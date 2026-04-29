import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@shared/auth/AuthContext";

import { collectionReviewApi } from "./collectionReviewApi";
import type { CollectionReviewSummary, CollectionReviewValue } from "./types";

type UseCollectionReviewOptions = {
  collectionId: string | null | undefined;
  enabled?: boolean;
};

const buildCollectionReviewQueryKey = (
  collectionId: string | null | undefined,
  authUserId: string | null | undefined,
) => [
  "collection-review",
  "summary",
  collectionId ?? "",
  authUserId ?? "guest",
];

export const useCollectionReview = ({
  collectionId,
  enabled = true,
}: UseCollectionReviewOptions) => {
  const queryClient = useQueryClient();
  const { authToken, authUser, refreshAuthToken } = useAuth();

  const normalizedCollectionId = collectionId?.trim() ?? "";
  const queryKey = buildCollectionReviewQueryKey(
    normalizedCollectionId,
    authUser?.id,
  );

  const summaryQuery = useQuery({
    queryKey,
    enabled: enabled && normalizedCollectionId.length > 0,
    staleTime: 30_000,
    queryFn: ({ signal }) =>
      collectionReviewApi.fetchSummary({
        collectionId: normalizedCollectionId,
        authToken,
        refreshAuthToken,
        signal,
      }),
  });

  const upsertMutation = useMutation({
    mutationFn: (value: CollectionReviewValue) =>
      collectionReviewApi.upsertMyReview({
        collectionId: normalizedCollectionId,
        authToken,
        refreshAuthToken,
        value,
      }),
    onSuccess: (summary) => {
      queryClient.setQueryData<CollectionReviewSummary>(queryKey, summary);
      void queryClient.invalidateQueries({
        queryKey: ["collection-review", "reviews", normalizedCollectionId],
      });
    },
  });

  return {
    summary: summaryQuery.data ?? null,
    myReview: summaryQuery.data?.myReview ?? null,
    isLoading: summaryQuery.isLoading,
    isFetching: summaryQuery.isFetching,
    isError: summaryQuery.isError,
    error: summaryQuery.error,
    refetch: summaryQuery.refetch,
    submitReview: upsertMutation.mutateAsync,
    isSubmitting: upsertMutation.isPending,
    submitError: upsertMutation.error,
  };
};
