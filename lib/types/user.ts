export interface User {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  tenantId?: string | null;
  otp?: string | null;
  otpExpires?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  tenantId?: string | null;
}
