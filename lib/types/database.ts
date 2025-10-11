import { User } from "./user";
import { UserInfo } from "./user-info";
import { Tenant, TenantMember, TenantInvitation } from "./tenant";

export interface DatabaseAdapter {
  findUserByEmail(email: string): Promise<User | null>;
  findUserByEmailInTenant(email: string, tenantId: string): Promise<User | null>;
  setUserTenantId(userId: string, tenantId: string | null): Promise<boolean>;
  findUserById(id: string): Promise<User | null>;
  createUser(
    user: Omit<User, "otp" | "otpExpires" | "createdAt" | "updatedAt">
  ): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User | null>;
  deleteUserById(id: string): Promise<boolean>;
  getAdminAnalytics(tenantId?: string): Promise<AdminAnalytics>;
  getPaginatedUsers(params: GetUsersParams): Promise<PaginatedUsersResult>;

  getUserInfo(userId: string, tenantId?: string): Promise<UserInfo | null>;
  createUserInfo(
    userInfo: Omit<UserInfo, "id" | "createdAt" | "updatedAt">
  ): Promise<UserInfo | null>;
  updateUserInfo(
    userId: string,
    data: Partial<Omit<UserInfo, "id" | "userId" | "createdAt" | "updatedAt">>,
    tenantId?: string
  ): Promise<UserInfo | null>;

  findTenantById(id: string): Promise<Tenant | null>;
  findTenantBySlug(slug: string): Promise<Tenant | null>;
  createTenant(
    tenant: Omit<Tenant, "id" | "createdAt" | "updatedAt">
  ): Promise<Tenant | null>;
  updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant | null>;
  deleteTenant(id: string): Promise<boolean>;

  getTenantMembers(tenantId: string): Promise<TenantMember[]>;
  getTenantMembersByUser(userId: string): Promise<TenantMember[]>;
  addTenantMember(
    member: Omit<TenantMember, "id" | "joinedAt">
  ): Promise<TenantMember | null>;
  updateTenantMember(
    id: string,
    data: Partial<TenantMember>
  ): Promise<TenantMember | null>;
  removeTenantMember(id: string): Promise<boolean>;

  createTenantInvitation(
    invitation: Omit<TenantInvitation, "id" | "createdAt">
  ): Promise<TenantInvitation | null>;
  findTenantInvitationByToken(token: string): Promise<TenantInvitation | null>;
  acceptTenantInvitation(
    token: string,
    userId: string
  ): Promise<TenantMember | null>;
  deleteTenantInvitation(id: string): Promise<boolean>;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalAdmins: number;
}

export interface PaginatedUsersResult {
  users: User[];
  totalCount: number;
  pageCount: number;
}

export interface GetUsersParams {
  pageIndex: number;
  pageSize: number;
  query?: string;
  sort?: { id: string; desc: boolean };
  tenantId?: string;
}
