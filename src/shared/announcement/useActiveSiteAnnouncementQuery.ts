import { useQuery } from "@tanstack/react-query";

import { fetchActiveSiteAnnouncement } from "./announcementApi";

export const activeSiteAnnouncementQueryKey = [
  "site-announcement",
  "active",
] as const;

export function useActiveSiteAnnouncementQuery(options?: {
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: activeSiteAnnouncementQueryKey,
    queryFn: ({ signal }) => fetchActiveSiteAnnouncement(signal),
    enabled: options?.enabled ?? true,
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}
