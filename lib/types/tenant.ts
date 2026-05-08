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
  role: TenantRole;
  status: MemberStatus;
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

/*
Add TenantRole union type ("owner" | "admin" | "employee" | "member").
Add MemberStatus union type ("pending" | "active" | "rejected").
Update TenantMember to use the new TenantRole and include status.
*/

export type TenantRole = "owner" | "admin" | "employee" | "member";

export type MemberStatus = "pending" | "active" | "rejected";

