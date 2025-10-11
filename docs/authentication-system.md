# Authentication System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication Flow](#authentication-flow)
4. [API Endpoints](#api-endpoints)
5. [Security Implementation](#security-implementation)
6. [Middleware & Route Protection](#middleware--route-protection)
7. [Frontend Integration](#frontend-integration)
8. [Password Management](#password-management)
9. [Session Management](#session-management)
10. [Error Handling](#error-handling)
11. [Technical Implementation](#technical-implementation)
12. [Best Practices](#best-practices)

## Overview

The authentication system provides secure user authentication and authorization for the application. It supports user registration, login, password reset, and role-based access control with JWT tokens and secure cookie management.

### Key Features
- **JWT-based Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin and user roles with different permissions
- **Password Security**: bcrypt hashing with salt rounds
- **Session Management**: HTTP-only cookies with secure settings
- **Password Reset**: OTP-based password recovery system
- **Route Protection**: Middleware-based route guarding
- **Multi-tenant Support**: Tenant-aware authentication (subdomain-first, tenantId in JWT)

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ • Auth Pages    │◄──►│ • API Routes    │◄──►│ • Supabase      │
│ • Middleware    │    │ • Server Actions│    │ • Users Table   │
│ • Context       │    │ • JWT Handling  │    │ • RLS Policies  │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Hierarchy
```
Authentication System
├── API Routes (/api/auth/*)
│   ├── login
│   ├── signup
│   ├── logout
│   ├── forgot-password
│   ├── reset-password
│   └── verify-otp
├── Server Actions (app/actions/auth.ts)
├── Middleware (middleware.ts)
├── Frontend Pages (app/(auth)/*)
│   ├── login
│   ├── signup
│   ├── forgot-password
│   └── reset-password
└── Database Functions (lib/functions/user.ts)
```

## Authentication Flow

### 1. User Registration Flow
```
Subdomain Resolve → Validate → Tenant-Scoped Email Check → Password Hash → User Creation (with tenant_id) → Membership Create → JWT (with tenantId) → Cookie Set → Redirect
```

### 2. User Login Flow
```
Subdomain Resolve → Validate → Tenant-Scoped Email Lookup → Password Verify → JWT (with tenantId) → Cookie Set → Role-based Redirect
```

### 3. Password Reset Flow
```
Email Input → User Lookup → OTP Generation → Email Send → OTP Verification → Password Update → Success
```

### 4. Session Validation Flow
```
Request → Cookie Extract → JWT Verify → User Lookup → Role Check → Access Grant/Deny
```

## API Endpoints

### 1. Login (`POST /api/auth/login`)

Tenant-aware login resolves tenant from subdomain (fallback to `TENANT` only in development), then scopes user lookup to that tenant.

**Request Body:**
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**Response:**
```typescript
interface LoginResponse {
  message: string;
  role: string;
}
```

**Implementation (excerpt):**
```typescript
// app/api/auth/login/route.ts
export async function POST(request: Request) {
  const db = await getDb();
  const body: LoginRequest = await request.json();
  const { email, password } = body;

  // Resolve tenant from subdomain; in dev, fallback to TENANT
  const hdrs = await headers();
  const host = hdrs.get("host") || "";
  const parts = host.split(":")[0].split(".");
  const subdomain = parts.length > 2 ? parts[0].toLowerCase() : null;

  let tenantId: string | null = null;
  const tenant = subdomain
    ? await (await getDb()).findTenantBySlug(subdomain)
    : null;
  tenantId = tenant?.id || null;
  if (!tenantId && process.env.NODE_ENV !== "production" && process.env.TENANT) {
    const devTenantRow = await (await getDb()).findTenantBySlug(process.env.TENANT.toLowerCase());
    tenantId = devTenantRow?.id || null;
  }

  const user = tenantId
    ? await (await getDb()).findUserByEmailInTenant(email, tenantId)
    : await db.findUserByEmail(email);

  // ... password verify, sign JWT with tenantId, set cookie
}
```

### 2. Signup (`POST /api/auth/signup`)

Tenant-aware signup creates users with `tenant_id` and attaches a membership. Duplicate emails are only blocked within the same tenant.

**Request Body:**
```typescript
interface SignupRequest {
  fullName: string;
  email: string;
  password: string;
  role?: "admin" | "user";
}
```

**Response:**
```typescript
interface SignupResponse {
  message: string;
  role: string;
}
```

**Implementation (excerpt):**
```typescript
// app/api/auth/signup/route.ts
export async function POST(request: Request) {
  const db = await getDb();
  const body: SignupRequest = await request.json();
  const { fullName, email, password, role = "user" } = body;

  // Resolve tenant same as login
  // ... derive tenantId

  // Block only if email exists in this tenant
  const existingUser = await (await getDb()).findUserByEmailInTenant(email, tenantId);
  if (existingUser) {
    return NextResponse.json(
      { message: "User already exists in this tenant" },
      { status: 409 }
    );
  }

  // Create user with tenant_id and add membership
  // ... create user, add tenant_members row, sign JWT with tenantId
}
```

### 3. Logout (`POST /api/auth/logout`)

**Response:**
```typescript
interface LogoutResponse {
  message: string;
}
```

**Implementation:**
```typescript
// app/api/auth/logout/route.ts
export async function POST() {
  const response = NextResponse.json(
    { message: "Logout successful" },
    { status: 200 }
  );
  
  // Clear the auth token cookie
  response.cookies.set("auth_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 0, // Expire immediately
    path: "/",
  });

  return response;
}
```

### 4. Forgot Password (`POST /api/auth/forgot-password`)

**Request Body:**
```typescript
interface ForgotPasswordRequest {
  email: string;
}
```

**Response:**
```typescript
interface ForgotPasswordResponse {
  message: string;
}
```

**Implementation:**
```typescript
// app/api/auth/forgot-password/route.ts
export async function POST(request: Request) {
  const { email }: ForgotPasswordRequest = await request.json();

  const user = await db.findUserByEmail(email);

  if (user) {
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await db.updateUser(user.id, { otp, otpExpires });
    await sendOTPEmail(user.email, otp);
  }

  // Always return success for security
  return NextResponse.json(
    { message: "If an account exists, an OTP has been sent." },
    { status: 200 }
  );
}
```

### 5. Reset Password (`POST /api/auth/reset-password`)

**Request Body:**
```typescript
interface ResetPasswordRequest {
  email: string;
  otp: string;
  password: string;
}
```

**Response:**
```typescript
interface ResetPasswordResponse {
  message: string;
}
```

### 6. Verify OTP (`POST /api/auth/verify-otp`)

**Request Body:**
```typescript
interface VerifyOTPRequest {
  email: string;
  otp: string;
}
```

**Response:**
```typescript
interface VerifyOTPResponse {
  message: string;
}
```

## Security Implementation

### 1. Password Security

**Hashing:**
```typescript
import bcrypt from "bcryptjs";

// Hash password during registration
const passwordHash = await bcrypt.hash(password, 10);

// Verify password during login
const isMatch = await bcrypt.compare(password, user.passwordHash);
```

**Password Requirements:**
- Minimum length validation
- Complexity requirements (handled by frontend)
- Secure storage with bcrypt

### 2. JWT Security

Include `tenantId` in JWT payload.
```typescript
import { SignJWT } from "jose";

const token = await new SignJWT({
  userId: user.id,
  email: user.email,
  role: user.role,
  tenantId: tenantId || null,
})
  .setProtectedHeader({ alg: "HS256" })
  .setExpirationTime("1d")
  .sign(secret);
```

**Token Verification:**
```typescript
import { jwtVerify } from "jose";

const { payload } = await jwtVerify(token, secret);
const userId = payload.userId as string;
```

### 3. Cookie Security

**Secure Cookie Settings:**
```typescript
response.cookies.set("auth_token", token, {
  httpOnly: true,                    // Prevent XSS
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "strict",               // CSRF protection
  maxAge: 86400,                    // 24 hours
  path: "/",                        // Available site-wide
});
```

### 4. Environment Variables

**Required Environment Variables:**
```env
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=production
```

Add development-only tenant override (for local testing without subdomain):
```env
TENANT=acm
```

## Middleware & Route Protection

### Middleware Implementation

- Auth routes (login/signup/forgot/reset, `/api/auth/*`) are blocked on apex domain in production. In development, they’re allowed on apex if `TENANT` is set.
- Protected routes (`/admin/*`, `/user/*`) require a valid session; admin section requires `role = 'admin'`.

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;
  const host = request.headers.get("host") || "";
  const onTenantSubdomain = host.split(":")[0].split(".").length > 2;

  const isAuthPath =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/api/auth/");

  if (isAuthPath && !onTenantSubdomain) {
    if (process.env.NODE_ENV === "production" || !process.env.TENANT) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  const isAdminPath = pathname.startsWith("/admin");
  const isUserPath = pathname.startsWith("/user");

  if (isAdminPath || isUserPath) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const userRole = payload.role as "admin" | "user";

      // Role-based access control
      if (isAdminPath && userRole !== "admin") {
        return NextResponse.redirect(new URL("/user", request.url));
      }

      return NextResponse.next();
    } catch (err) {
      // Invalid token - redirect to login
      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/user/:path*"],
};
```

### Route Protection Strategy

1. **Public Routes**: Home, login, signup, forgot password
2. **Protected Routes**: `/user/*`, `/admin/*`
3. **Role-based Routes**: Admin-only routes within `/admin/*`

## Frontend Integration

### 1. Login Page

**File: `app/(auth)/login/page.tsx`**
```typescript
export default function LoginPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    toast.success("Logged in successfully!");

    // Role-based redirect
    if (data.role === "admin") {
      router.push("/admin");
    } else {
      router.push("/user");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* Form fields */}
      </form>
    </Form>
  );
}
```

### 2. Server Actions

**File: `app/actions/auth.ts`**
```typescript
export async function getCurrentUserAction(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;
    const tenantId = payload.tenantId as string | null;

    if (!userId) return null;

    const user = await db.findUserById(userId);
    if (!user) {
      cookieStore.delete("auth_token");
      return null;
    }

    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    cookieStore.delete("auth_token");
    return null;
  }
}

export async function logoutAction() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    // Fallback cookie clearing
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
  } catch (error) {
    console.error("Logout error:", error);
    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
  }
}
```

### 3. Navbar Integration

**File: `components/layout/navbar.tsx`**
```typescript
export function Navbar() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUserAction();
        setUser(currentUser);
      } catch {
        setUser(null);
      }
    };
    checkUser();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutAction();
      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav>
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar>
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button asChild>
          <Link href="/login">Sign In</Link>
        </Button>
      )}
    </nav>
  );
}
```

## Password Management

### 1. Password Reset Flow

**Step 1: Request Reset**
```typescript
// User enters email
const { email } = await request.json();
const user = await db.findUserByEmail(email);

if (user) {
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  await db.updateUser(user.id, { otp, otpExpires });
  await sendOTPEmail(user.email, otp);
}
```

**Step 2: Verify OTP**
```typescript
const { email, otp } = await request.json();
const user = await db.findUserByEmail(email);

if (!user || !user.otp || user.otp !== otp || Date.now() > user.otpExpires) {
  return NextResponse.json({ message: "Invalid or expired OTP" }, { status: 400 });
}

return NextResponse.json({ message: "OTP verified" }, { status: 200 });
```

**Step 3: Reset Password**
```typescript
const { email, otp, password } = await request.json();
const user = await db.findUserByEmail(email);

// Verify OTP again
if (!user.otp || user.otp !== otp || Date.now() > user.otpExpires) {
  return NextResponse.json({ message: "Invalid or expired session" }, { status: 400 });
}

// Update password
const passwordHash = await bcrypt.hash(password, 10);
await db.updateUser(user.id, {
  passwordHash,
  otp: null,
  otpExpires: null,
});

return NextResponse.json({ message: "Password reset successful" }, { status: 200 });
```

### 2. Email Integration

**OTP Email Template:**
```typescript
// lib/email.ts
export async function sendOTPEmail(email: string, otp: string) {
  const transporter = nodemailer.createTransporter({
    // Email configuration
  });

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "Password Reset OTP",
    html: `
      <h2>Password Reset</h2>
      <p>Your OTP is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 10 minutes.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}
```

## Session Management

JWT now carries `tenantId`; server actions like `getCurrentUserAction` can include it in the returned `AuthUser`.

### 1. Session Lifecycle

**Session Creation:**
- User logs in successfully
- JWT token generated with 24-hour expiration
- Token stored in HTTP-only cookie
- User redirected based on role

**Session Validation:**
- Middleware checks token on protected routes
- Server actions validate token for user data
- Invalid tokens trigger logout

**Session Termination:**
- User clicks logout
- Token cookie deleted
- User redirected to home page

### 2. Token Refresh

**Current Implementation:**
- Tokens expire after 24 hours
- Users must re-login after expiration
- No automatic refresh mechanism

**Future Enhancement:**
```typescript
// Potential refresh token implementation
interface RefreshToken {
  token: string;
  expiresAt: string;
  userId: string;
}

// Refresh endpoint
export async function POST(request: Request) {
  const refreshToken = request.cookies.get("refresh_token")?.value;
  
  if (!refreshToken) {
    return NextResponse.json({ message: "No refresh token" }, { status: 401 });
  }

  // Validate refresh token and generate new access token
  const newAccessToken = await generateNewAccessToken(refreshToken);
  
  // Set new access token cookie
  response.cookies.set("auth_token", newAccessToken, cookieOptions);
  
  return NextResponse.json({ message: "Token refreshed" });
}
```

## Error Handling

### 1. API Error Responses

**Standard Error Format:**
```typescript
interface ApiErrorResponse {
  message: string;
  error?: string;
  statusCode?: number;
}
```

**Common Error Scenarios:**
```typescript
// Missing credentials
if (!email || !password) {
  return NextResponse.json(
    { message: "Missing email or password" },
    { status: 400 }
  );
}

// User not found
if (!user) {
  return NextResponse.json(
    { message: "Invalid credentials" },
    { status: 401 }
  );
}

// Password mismatch
if (!isMatch) {
  return NextResponse.json(
    { message: "Invalid credentials" },
    { status: 401 }
  );
}

// User already exists
if (existingUser) {
  return NextResponse.json(
    { message: "User already exists" },
    { status: 409 }
  );
}
```

### 2. Frontend Error Handling

**Login Error Handling:**
```typescript
async function onSubmit(values: z.infer<typeof formSchema>) {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }

    toast.success("Logged in successfully!");
    router.push(data.role === "admin" ? "/admin" : "/user");
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Login failed";
    toast.error(message);
  }
}
```

### 3. Server Action Error Handling

**Authentication Error Handling:**
```typescript
export async function getCurrentUserAction(): Promise<AuthUser | null> {
  try {
    // ... authentication logic
    return user;
  } catch (error) {
    console.error("Authentication error in server action:", error);
    cookieStore.delete("auth_token");
    return null;
  }
}
```

## Technical Implementation

### 1. Database Schema

Enforce uniqueness per-tenant (same email can exist across tenants):
```sql
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id);
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_email_tenant_unique' AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;
    ALTER TABLE public.users ADD CONSTRAINT users_email_tenant_unique UNIQUE (email, tenant_id);
  END IF;
END $$;
```

**Users Table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'user')) NOT NULL DEFAULT 'user',
  tenant_id UUID REFERENCES tenants(id),
  otp TEXT,
  otp_expires BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**RLS Policies:**
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);
```

### 2. Type Definitions

**User Types:**
```typescript
// lib/types/user.ts
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
```

**API Types:**
```typescript
// lib/types/api.ts
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
```

### 3. Database Functions

**User CRUD Operations:**
```typescript
// lib/functions/user.ts
export const userFunctions = {
  async findUserByEmail(email: string): Promise<User | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();
    
    if (error && error.code !== "PGRST116") console.error(error);
    return data as User | null;
  },

  async findUserById(id: string): Promise<User | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", id)
      .single();
    
    if (error && error.code !== "PGRST116") console.error(error);
    return data as User | null;
  },

  async createUser(user: Omit<User, "otp" | "otpExpires">): Promise<User | null> {
    const supabase = await getSupabaseClient();
    const { data, error } = await supabase
      .from("users")
      .insert({
        id: user.id,
        full_name: user.fullName,
        email: user.email.toLowerCase(),
        password_hash: user.passwordHash,
        role: user.role,
        tenant_id: user.tenantId,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      })
      .select()
      .single();
    
    if (error) console.error(error);
    return data ? {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      passwordHash: data.password_hash,
      role: data.role,
      tenantId: data.tenant_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    } : null;
  },

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const supabase = await getSupabaseClient();
    const updateData: any = {};
    
    if (data.fullName) updateData.full_name = data.fullName;
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.passwordHash) updateData.password_hash = data.passwordHash;
    if (data.role) updateData.role = data.role;
    if (data.tenantId !== undefined) updateData.tenant_id = data.tenantId;
    if (data.otp !== undefined) updateData.otp = data.otp;
    if (data.otpExpires !== undefined) updateData.otp_expires = data.otpExpires;
    if (data.updatedAt) updateData.updated_at = data.updatedAt;

    const { data: result, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    
    if (error) console.error(error);
    return result ? {
      id: result.id,
      fullName: result.full_name,
      email: result.email,
      passwordHash: result.password_hash,
      role: result.role,
      tenantId: result.tenant_id,
      otp: result.otp,
      otpExpires: result.otp_expires,
      createdAt: result.created_at,
      updatedAt: result.updated_at,
    } : null;
  },

  async deleteUserById(id: string): Promise<boolean> {
    const supabase = await getSupabaseClient();
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", id);
    
    if (error) console.error(error);
    return !error;
  },
};
```

## Best Practices

### 1. Security Best Practices

**Password Security:**
- Use bcrypt with appropriate salt rounds (10+)
- Never store plain text passwords
- Implement password complexity requirements
- Use secure password reset flows

**JWT Security:**
- Use strong, random JWT secrets
- Set appropriate expiration times
- Use HTTP-only cookies for token storage
- Implement proper token validation

**Cookie Security:**
- Use `httpOnly` to prevent XSS
- Use `secure` in production
- Use `sameSite: "strict"` for CSRF protection
- Set appropriate `maxAge`

### 2. Error Handling Best Practices

**Consistent Error Messages:**
- Use generic messages for security (don't reveal if user exists)
- Log detailed errors server-side
- Provide user-friendly error messages
- Handle network errors gracefully

**Input Validation:**
- Validate all inputs on both client and server
- Use TypeScript for type safety
- Sanitize user inputs
- Implement rate limiting

### 3. Performance Best Practices

**Database Optimization:**
- Use proper indexing on email and id fields
- Implement connection pooling
- Use prepared statements
- Cache frequently accessed data

**Session Management:**
- Use appropriate token expiration times
- Implement token refresh if needed
- Clean up expired sessions
- Monitor session usage

### 4. Development Best Practices

**Code Organization:**
- Separate concerns (API routes, server actions, database functions)
- Use TypeScript for type safety
- Implement proper error boundaries
- Use consistent naming conventions

**Testing:**
- Write unit tests for authentication logic
- Test error scenarios
- Mock external dependencies
- Test security vulnerabilities

## Troubleshooting

### Common Issues

1. **"JWT_SECRET missing" Error**
   - Ensure JWT_SECRET is set in environment variables
   - Check .env file configuration
   - Verify environment variable loading

2. **"Invalid credentials" on Valid Login**
   - Check password hashing consistency
   - Verify email case sensitivity
   - Check database connection

3. **Token Expiration Issues**
   - Verify token expiration time
   - Check system clock synchronization
   - Implement proper error handling

4. **Cookie Not Set**
   - Check cookie settings (httpOnly, secure, sameSite)
   - Verify domain and path settings
   - Check browser cookie policies

### Debug Tools

1. **JWT Debugging:**
   ```typescript
   // Decode JWT payload (for debugging only)
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('JWT Payload:', payload);
   ```

2. **Cookie Debugging:**
   ```typescript
   // Check cookie in browser dev tools
   document.cookie; // View all cookies
   ```

3. **Database Debugging:**
   ```sql
   -- Check user data
   SELECT id, full_name, email, role, created_at 
   FROM users 
   WHERE email = 'user@example.com';
   ```

## Future Enhancements

### Planned Features
1. **Two-Factor Authentication (2FA)**: SMS or TOTP-based 2FA
2. **Social Login**: Google, GitHub, Microsoft OAuth integration
3. **Account Lockout**: Brute force protection
4. **Session Management**: Active session tracking and management
5. **Audit Logging**: Authentication event logging

### Technical Improvements
1. **Refresh Tokens**: Implement refresh token mechanism
2. **Rate Limiting**: API rate limiting for authentication endpoints
3. **Password Policies**: Configurable password complexity rules
4. **Account Verification**: Email verification for new accounts
5. **Multi-device Sessions**: Manage sessions across multiple devices

---

This documentation provides a comprehensive overview of the authentication system. For specific implementation details, refer to the source code in the respective files mentioned throughout this document.
