export const MAX_COLLECTIONS_PER_USER = 5;
export const MAX_COLLECTION_ITEMS_PER_COLLECTION = 500;
export const MAX_PRIVATE_COLLECTIONS_PER_USER = 2;

export const isAdminRole = (role?: string | null) => role === "admin";
