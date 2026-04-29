export type CollectionReviewValue = {
  rating: number;
  comment: string | null;
};

export type CollectionReview = {
  id: string;
  collectionId: string;
  userId: string;
  rating: number;
  comment: string | null;
  status: string;
  createdAt: number;
  updatedAt: number;
};

export type CollectionReviewListItem = CollectionReview & {
  displayName: string;
  avatarUrl: string | null;
};

export type CollectionReviewListPage = {
  items: CollectionReviewListItem[];
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
  nextOffset: number | null;
};

export type CollectionReviewSummary = {
  collectionId: string;
  ratingCount: number;
  ratingSum: number;
  ratingAvg: number;
  reviewCommentCount: number;
  myReview: CollectionReview | null;
};

export type CollectionReviewPanelProps = {
  collectionId: string | null | undefined;
  title?: string;
  description?: string;
  compact?: boolean;
  embedded?: boolean;
  variant?: "panel" | "inline";
  disabled?: boolean;
  className?: string;
  onSubmitted?: (summary: CollectionReviewSummary) => void;
};
