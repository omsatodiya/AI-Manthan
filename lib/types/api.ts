export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  role: string;
}

export interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
  role?: "admin" | "user";
}

export interface SignupResponse {
  message: string;
  role: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  password: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerifyOTPRequest {
  email: string;
  otp: string;
}

export interface VerifyOTPResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

export interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
}

export interface ApiErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}
