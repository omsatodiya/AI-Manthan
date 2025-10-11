export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  settings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantMember {
  id: string;
  userId: string;
  tenantId: string;
  role: "owner" | "member";
  permissions?: string[] | null;
  joinedAt: string;
  user?: import("./user").User | null;
  tenant?: Tenant | null;
}

export interface TenantInvitation {
  id: string;
  tenantId: string;
  email: string;
  role: "owner" | "member";
  invitedBy: string;
  token: string;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
}
