export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  otp?: string | null;
  otpExpires?: number | null;
}

export interface DatabaseAdapter {
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(user: Omit<User, "otp" | "otpExpires">): Promise<User | null>;
  updateUser(id: string, data: Partial<User>): Promise<User | null>;
  deleteUserById(id: string): Promise<boolean>;
  getAdminAnalytics(): Promise<AdminAnalytics>;
  getPaginatedUsers(params: GetUsersParams): Promise<PaginatedUsersResult>;
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
}