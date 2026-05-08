# ConnectIQ: B2B2C Multi-Tenant Migration Plan

This document outlines the comprehensive roadmap to transition ConnectIQ from its current architecture into a secure, industry-ready B2B SaaS multi-tenant platform.

## Current State Analysis

**Architecture Flaws Identified:**
1. **Flawed User/Tenant Relationship:** The `User` type (`lib/types/user.ts`) currently has a direct `tenantId` field and a global `role` (`"admin" | "user"`). This restricts users to a single tenant and mixes global vs. tenant-specific permissions.
2. **Missing Application Workflow:** There is no mechanism for users to apply to create an organization (`tenant_applications`). Currently, `tenant.ts` only defines `Tenant`, `TenantMember`, and `TenantInvitation`.
3. **Inadequate Middleware Protection:** `middleware.ts` identifies if a request is on a subdomain (`hasSubdomain(host)`) but its JWT verification merely checks a global `payload.role` and redirects to `/admin` or `/user`. It does **not** cryptographically verify that the user is an active member of the specific tenant they are trying to access.
4. **Lack of Proper RLS Structure:** The current database types suggest a generic schema adapter pattern rather than leveraging native Supabase Row Level Security (RLS) policies tied to `auth.uid()` and tenant membership contexts.

---

## Database Migration Plan

We will restructure the database to fully decouple Global Identity from Tenant Membership.

### Step 1: Global Identity (The Lobby)
- **`users` table modifications:** Remove the `tenantId` and `role` columns from the global `users` table. Global users only need identity info (`id`, `fullName`, `email`, `passwordHash` or native Supabase Auth fields).
- *Supabase Auth:* We will rely primarily on `auth.users`. Custom fields can live in a `public.profiles` or global `users` table.

### Step 2: Organization Creation (The Super-Admin Gate)
- **Create `tenant_applications` table:**
  - `id` (uuid, PK)
  - `applicant_id` (uuid, FK to users)
  - `org_name` (text)
  - `requested_slug` (text)
  - `status` (enum: `'pending'`, `'approved'`, `'rejected'`)
  - `created_at` (timestamp)
- **Super-Admin Role:** A platform-level super admin will approve these applications. Approval triggers a database function to create the `Tenant` and insert the applicant into `tenant_members` as an `'owner'`.

### Step 3: Member Onboarding (The Tenant Gate)
- **Update `tenant_members` table:**
  - Add a `status` field (enum: `'pending'`, `'active'`, `'rejected'`).
  - Expand `role` to accommodate specific tenant roles: `'owner'`, `'admin'`, `'employee'`, `'member'`, or `null` for pending.
- **Join Workflow:** Users request to join -> `tenant_members` row created with `status: 'pending'`. Tenant admins update to `'active'`.

### Step 4: Row Level Security (RLS)
- Implement strict RLS on all tenant-specific tables (e.g., `announcements`, `events`).
- Policy logic: `tenant_id = current_setting('app.current_tenant_id')` or by joining `tenant_members` where `user_id = auth.uid()` and `status = 'active'`.

---

## Routing & Middleware Strategy

### Next.js 15 Middleware (`middleware.ts`)
The middleware will act as **The Vault Gatekeeper**, utilizing wildcard subdomain routing.

1. **Subdomain Parsing:** Extract the `tenant-slug` from the host header.
2. **Session Verification:** Validate the Supabase Auth session token.
3. **Tenant Resolution:** Fetch the `tenant_id` associated with the slug. (To optimize, use Edge Config, Redis, or an aggressively cached Supabase RPC call).
4. **Membership Validation:** 
   - Verify if the `auth.uid()` exists in `tenant_members` for that `tenant_id` and has an `active` status.
   - If missing or inactive, redirect the user to `app.connectiq.com/lobby` (Global Lobby).
5. **Request Rewriting:** If authorized, rewrite the URL so the Next.js App Router can consume it (e.g., `rewrite(new URL(\`/[tenant-slug]${pathname}\`, request.url))`).

### App Router Structure (`app/`)
- `app/(global)/lobby/page.tsx`: The Lobby for global users.
- `app/[tenant-slug]/(tenant-routes)/...`: All tenant-specific pages.

---

## Step-by-Step Execution Roadmap

To prevent breaking the application, the migration will be executed in the following isolated phases:

### Phase 1: Database Schema & Type Refactoring
- Write and execute Supabase SQL migrations to create `tenant_applications`.
- Update `tenant_members` schema to include `status`.
- Clean up `users` table (remove `tenantId` and `role`).
- Update all TypeScript interfaces in `lib/types/` to reflect these changes.

### Phase 2: Core Authentication & Supabase RLS
- Setup Supabase Auth correctly.
- Implement RLS policies on all existing tenant-scoped tables ensuring they check `tenant_members`.
- Update database helper functions in `lib/database/` to handle the new schema and RLS context.

### Phase 3: Middleware & Subdomain Routing
- Refactor `middleware.ts` to implement subdomain extraction, tenant resolution, and membership verification.
- Reorganize the `app/` directory to support `app/[tenant-slug]/` dynamic routing and an `app/(global)/` route group.

### Phase 4: The Lobby UI (Global Identity)
- Build the `/lobby` dashboard.
- Implement "Register a New Organization" flow (writes to `tenant_applications`).
- Implement "Request to Join" flow for existing orgs.

### Phase 5: Super-Admin & Tenant Gates UI
- Build the Super-Admin dashboard to approve/reject `tenant_applications`.
- Build the Tenant Admin dashboard (inside the tenant route) to manage pending member requests.
- Update global navigation and layouts to dynamically reflect the user's context (Lobby vs. Active Tenant).

### Phase 6: Cleanup & Final Validation
- Remove legacy single-tenant or global-role logic.
- Perform end-to-end testing of the registration, approval, subdomain resolution, and RLS enforcement flows.
