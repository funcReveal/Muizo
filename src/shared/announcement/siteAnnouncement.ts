export type SiteAnnouncementSeverity =
  | "info"
  | "maintenance"
  | "update"
  | "warning";

export type SiteAnnouncementStatus = "draft" | "published" | "archived";

export type SiteAnnouncement = {
  id: string;
  enabled: boolean;
  status?: SiteAnnouncementStatus;
  severity: SiteAnnouncementSeverity;
  title: string;
  shortMessage: string;
  detailTitle: string;
  detailDescription: string;
  startsAt?: string | null;
  endsAt?: string | null;
  maintenanceWindowLabel?: string | null;
  expectedDurationLabel?: string | null;
  impactItems?: string[];
  updateItems?: string[];
  note?: string | null;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
};

export const isSiteAnnouncementActive = (
  announcement: SiteAnnouncement,
  now = new Date(),
) => {
  if (!announcement.enabled) return false;

  const nowTime = now.getTime();

  if (announcement.startsAt) {
    const startsAtTime = new Date(announcement.startsAt).getTime();
    if (Number.isFinite(startsAtTime) && nowTime < startsAtTime) {
      return false;
    }
  }

  if (announcement.endsAt) {
    const endsAtTime = new Date(announcement.endsAt).getTime();
    if (Number.isFinite(endsAtTime) && nowTime > endsAtTime) {
      return false;
    }
  }

  return true;
};
