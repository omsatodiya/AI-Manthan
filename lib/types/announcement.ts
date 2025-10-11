export interface Announcement {
  id: string;
  title: string;
  description?: string | null;
  link?: string | null;
  tenantId: string;
  createdBy: string;
  createdAt: string;
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
