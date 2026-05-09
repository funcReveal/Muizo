export type CollectionOption = {
  id: string;
  title: string;
  description?: string | null;
  visibility?: "private" | "public";
  use_count?: number;
  favorite_count?: number | null;
  rating_count?: number | null;
  rating_avg?: number | null;
  item_count?: number;
  playable_item_count?: number | null;
  readToken?: string | null;
};
