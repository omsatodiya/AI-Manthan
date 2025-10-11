export interface Announcement {
  id: string;
  title: string;
  description?: string | null;
  link?: string | null;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  isOpportunity?: boolean;
}

export interface CreateAnnouncementData {
  title: string;
  description?: string;
  link?: string;
}

export interface UpdateAnnouncementData {
  title?: string;
  description?: string;
  link?: string;
}
