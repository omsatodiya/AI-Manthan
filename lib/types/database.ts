import { User } from "./user";
import { UserInfo } from "./user-info";
import { Tenant, TenantMember, TenantInvitation } from "./tenant";
import { TenantApplication, CreateTenantApplicationData, ReviewTenantApplicationData } from "./tenant-application";
import { Announcement, CreateAnnouncementData, UpdateAnnouncementData } from "./announcement";
import { AnnouncementOpportunity, CreateAnnouncementOpportunityData } from "./announcement-opportunity";

export interface DatabaseAdapter {
  findUserByEmail(email: string): Promise<User | null>;
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
  findUserMatches(
    userId: string,
    embedding: number[],
    options: {
      threshold: number;
      limit: number;
      tenantId?: string;
    }
  ): Promise<UserMatch[]>;

  findTenantById(id: string): Promise<Tenant | null>;
  findTenantBySlug(slug: string): Promise<Tenant | null>;
  createTenant(
    tenant: Omit<Tenant, "id" | "createdAt" | "updatedAt">
  ): Promise<Tenant | null>;
  updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant | null>;
  deleteTenant(id: string): Promise<boolean>;

  getTenantMembers(tenantId: string, status?: import("./tenant").MemberStatus): Promise<TenantMember[]>;
  getTenantMembersByUser(userId: string): Promise<TenantMember[]>;
  getManagedTenants(userId: string): Promise<TenantMember[]>;
  addTenantMember(
    member: Omit<TenantMember, "id" | "joinedAt" | "user" | "tenant">
  ): Promise<TenantMember | null>;
  updateTenantMember(
    id: string,
    data: Partial<Omit<TenantMember, "user" | "tenant">>
  ): Promise<TenantMember | null>;
  removeTenantMember(id: string): Promise<boolean>;

  createTenantApplication(
    applicantId: string,
    data: CreateTenantApplicationData
  ): Promise<TenantApplication | null>;
  getTenantApplications(params?: {
    status?: import("./tenant-application").ApplicationStatus;
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<{ applications: TenantApplication[]; totalCount: number }>;
  getMyTenantApplications(applicantId: string): Promise<TenantApplication[]>;
  updateTenantApplication(
    id: string,
    data: ReviewTenantApplicationData,
    reviewedBy: string
  ): Promise<TenantApplication | null>;

  createTenantInvitation(
    invitation: Omit<TenantInvitation, "id" | "createdAt">
  ): Promise<TenantInvitation | null>;
  findTenantInvitationByToken(token: string): Promise<TenantInvitation | null>;
  acceptTenantInvitation(
    token: string,
    userId: string
  ): Promise<TenantMember | null>;
  deleteTenantInvitation(id: string): Promise<boolean>;

  createAnnouncement(
    data: CreateAnnouncementData,
    tenantId: string,
    createdBy: string
  ): Promise<Announcement | null>;
  getAnnouncements(tenantId: string): Promise<Announcement[]>;
  getAnnouncementById(id: string, tenantId: string): Promise<Announcement | null>;
  updateAnnouncement(
    id: string,
    data: UpdateAnnouncementData,
    tenantId: string
  ): Promise<Announcement | null>;
  deleteAnnouncement(id: string, tenantId: string): Promise<boolean>;

  createAnnouncementOpportunity(
    data: CreateAnnouncementOpportunityData
  ): Promise<AnnouncementOpportunity | null>;
  getAnnouncementOpportunities(tenantId: string): Promise<AnnouncementOpportunity[]>;
  getAnnouncementOpportunityById(
    id: string,
    tenantId: string
  ): Promise<AnnouncementOpportunity | null>;
  getUserAnnouncementOpportunities(
    userId: string,
    tenantId: string
  ): Promise<AnnouncementOpportunity[]>;
  updateAnnouncementOpportunity(
    id: string,
    data: Partial<CreateAnnouncementOpportunityData>,
    tenantId: string
  ): Promise<AnnouncementOpportunity | null>;
  deleteAnnouncementOpportunity(id: string, tenantId: string): Promise<boolean>;
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

export interface UserMatch {
  userId: string;
  similarity: number;
  tenantId?: string | null;
  user?: {
    id: string;
    name: string;
    email: string;
    tenantId?: string | null;
  };
}
