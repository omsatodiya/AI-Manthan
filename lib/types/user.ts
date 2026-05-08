import { TenantRole, MemberStatus } from "./tenant";

export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  otp?: string | null;
  otpExpires?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  tenantId?: string | null;
}

// Global User (Lobby)
export interface SessionUser {
  id: string;
  fullName: string;
  email: string;
}

// Tenant User (Tenant Dashboard)
export interface TenantSessionUser extends SessionUser {
  tenantId: string;
  tenantName: string;
  role: TenantRole;  // from tenant_members
  status: MemberStatus;  // from tenant_members
  permissions?: string[] | null;
}

