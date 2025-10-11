export interface AnnouncementOpportunity {
  id: string;
  title: string;
  description?: string | null;
  link?: string | null;
  tenantId: string;
  userId: string;
  response?: Record<string, unknown> | null;
  createdAt: string;
}

export interface CreateAnnouncementOpportunityData {
  title: string;
  description?: string;
  link?: string;
  tenantId: string;
  userId: string;
  response?: Record<string, unknown>;
}
