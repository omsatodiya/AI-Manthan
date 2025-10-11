# User Panel Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [User Dashboard](#user-dashboard)
4. [User Information Flow](#user-information-flow)
5. [Tenant/Community Selection](#tenantcommunity-selection)
6. [Navigation & Access Control](#navigation--access-control)
7. [Server Actions](#server-actions)
8. [UI Components](#ui-components)
9. [Data Management](#data-management)
10. [Technical Implementation](#technical-implementation)
11. [Extensibility](#extensibility)
12. [Troubleshooting](#troubleshooting)
13. [Route Map](#route-map)
14. [Question Fields and Mapping](#question-fields-and-mapping)
15. [Server Action I/O](#server-action-io)
16. [State and UI Behavior](#state-and-ui-behavior)
17. [Security Considerations](#security-considerations)
18. [Accessibility](#accessibility)
19. [Performance Notes](#performance-notes)
20. [Testing Tips](#testing-tips)
21. [FAQ](#faq)

## Overview

The user panel is the authenticated end-user experience that allows users to review and update their profile, answer onboarding questions, select a tenant/community, and manage basic account actions like logout and account deletion.

- **Primary routes**: `/user` (dashboard), `/user/info` (progressive questionnaire)
- **Auth required**: Yes (redirects unauthenticated users to `/login`)
- **Role awareness**: Shows admin link to `/admin` when `role === "admin"`

Related docs: see [Authentication System](./authentication-system.md) and [Tenant System](./tenant-system.md).

## Architecture

```
┌─────────────────┐    ┌──────────────────────┐    ┌─────────────────┐
│   User UI       │    │ Server Layer         │    │   Database      │
│                 │    │                      │    │                 │
│ • /user         │◄──►│ • Server Actions     │◄──►│ • Users         │
│ • /user/info    │    │   - user.ts          │    │ • User Info     │
│ • Navbar/Auth   │    │   - user-info.ts     │    │ • Tenants       │
│ • Question UI   │    │ • API (auth)         │    │ • Memberships   │
└─────────────────┘    └──────────────────────┘    └─────────────────┘
```

### Component Hierarchy
```
User Panel
├── Dashboard (app/user/page.tsx)
│   ├── Profile Card (name/email/role)
│   ├── Account Actions (logout/delete)
│   ├── Quick Links (/user/info, /admin for admins)
│   └── Appearance (light/dark toggle)
├── User Info Wizard (app/user/info/page.tsx)
│   ├── Progress header + progress bar
│   ├── QuestionRenderer (components/user/question-renderer.tsx)
│   └── Save & Next / Previous controls
└── Shared
    ├── Navbar (components/layout/navbar.tsx)
    └── Tenant Selector (components/user/tenant-selector.tsx)
```

## User Dashboard

**File**: `app/user/page.tsx`

- Fetches the current user via `getCurrentUserAction()` and guards access.
- Shows profile (email, role) and allows updating full name via `updateUserNameAction(newName)`.
- Provides logout (`logoutAction()`) and account deletion (`deleteUserAction()`), with confirmation dialog.
- Shows role-aware quick links; admins see link to `/admin`.
- Includes theme toggle using `next-themes`.
- Includes a Community/Tenant selection card rendering `TenantSelector`.

### Data flow
- On mount: load current user → store in state → populate name form default values.
- Name update: submit validates with Zod and calls server action → optimistic update and toast feedback.
- Logout/Delete: call server action → navigate to home page on success.

## User Information Flow

**File**: `app/user/info/page.tsx`

A progressive questionnaire that persists answers incrementally.

- Loads current user and any previously saved answers via `getUserInfoAction()`.
- Renders one question at a time from `questions` in `constants/user/questions`.
- Validates each step with the question-specific Zod `schema` before saving.
- Persists partial answers on each step via `saveUserInfoAction(dataToSave)`.
- Tracks progress with `getTotalQuestions()` and shows a progress bar.
- Provides Back to Profile, Previous, and Save & Next/Save & Complete actions.

### Question rendering
- `components/user/question-renderer.tsx` supports `radio` and `checkbox` question types.
- Integrates with `react-hook-form` via `FormField` and renders `RadioGroup` or `Checkbox` lists.

### Stored answers shape (subset)
- `role`, `organizationType`, `businessStage`, `teamSize`
- Multi-selects: `industry`, `goals`, `opportunityType`, `focusAreas`, `collabTarget`, `collabType`, `templateType`, `eventType`, `eventFormat`
- Singles: `partnershipOpen`, `templateTone`, `templateAutomation`, `eventScale`

## Tenant/Community Selection

- The dashboard includes `TenantSelector` (`components/user/tenant-selector.tsx`) to select a community/tenant context.
- Related server action: `getTenantMembersAction()` in `app/actions/user.ts` fetches memberships via Supabase.
- See [Tenant System](./tenant-system.md) for architecture and data model details.

## Navigation & Access Control

- Unauthenticated users: Both `/user` and `/user/info` render an "Access Denied" card with a button to `/login`.
- Role-based Links: The dashboard filters quick links so that `/admin` is shown only when `user.role` includes `"admin"`.
- Navbar (`components/layout/navbar.tsx`) also checks auth state and redirects away from protected routes on logout.

## Server Actions

- `app/actions/auth.ts`
  - `getCurrentUserAction()` → reads JWT cookie and loads `AuthUser`.
  - `logoutAction()` → clears session and cookie; used by Navbar and Dashboard.
- `app/actions/user.ts`
  - `updateUserNameAction(newName: string)` → persists full name and revalidates `/user`.
  - `deleteUserAction()` → deletes user record, logs out, returns success/failure.
  - `getTenantMembersAction()` → returns memberships for the current user from Supabase (`tenant_members`).
- `app/actions/user-info.ts`
  - `getUserInfoAction(tenantId?)` → loads saved user info.
  - `saveUserInfoAction(data, tenantId?)` → saves partial questionnaire results.

## UI Components

- `components/user/question-renderer.tsx` → abstract rendering for `radio` and `checkbox` questions.
- `components/user/tenant-selector.tsx` → community/tenant picker UI.
- `components/ui/*` → button, form, inputs, card, progress, dialogs; shared primitives.

## Data Management

- Database access via `lib/database` adapter (`getDb()`); user info is persisted through server actions.
- `getSupabaseClient()` is used to fetch tenant memberships from Supabase (`tenant_members` with joined `tenants`).
- Types:
  - `AuthUser`, `UserInfo`, `Tenant`, `TenantMember` in `lib/types/*`.

## Technical Implementation

- Framework: Next.js App Router with client components for interactive pages.
- Forms: `react-hook-form` with Zod runtime validation per question step.
- Animations: Framer Motion for subtle transitions in both dashboard and wizard.
- Toasts: `sonner` for success/error feedback.
- Theming: `next-themes` toggle on `/user` page.
- Revalidation: `revalidatePath("/user")` after name update for fresh UI state.

## Extensibility

- Add a new question:
  1. Append to `constants/user/questions` with `id`, `title`, `type`, `options`, and `schema`.
  2. Update `saveUserInfoAction` mapping if a new field is introduced.
  3. Ensure types in `lib/types/user-info.ts` include the new field.
- Add a new quick link:
  - Extend `navLinks` in `app/user/page.tsx` and optionally gate by `roles`.
- Add new tenant-aware data:
  - Pass `tenantId` through `getUserInfoAction`/`saveUserInfoAction` and UI.

## Troubleshooting

- Not logged in / Access Denied:
  - Confirm a valid auth cookie; see [Authentication System](./authentication-system.md).
- Name update not reflecting:
  - Ensure `updateUserNameAction` runs successfully and `revalidatePath("/user")` is called.
- Questionnaire answers not persisting:
  - Verify step validation (Zod) passes, and that `saveUserInfoAction` returns `success: true`.
- Tenant membership not loading:
  - Check Supabase credentials and `tenant_members` table; see [Tenant System](./tenant-system.md).

## Route Map

- `/user` → User Dashboard (guarded, reads current user; renders profile, links, theme and tenant controls)
- `/user/info` → Questionnaire wizard (guarded, step-wise save via server action)
- `/login`, `/signup`, `/forgot-password`, `/reset-password` → see [Authentication System](./authentication-system.md)
- `/admin` → visible only to admins; see [Admin Panel](./admin-panel.md)

## Question Fields and Mapping

Each question has a unique `id` that maps directly to persisted fields in `UserInfo`.

- Radio (single value): `role`, `organizationType`, `businessStage`, `teamSize`, `partnershipOpen`, `templateTone`, `templateAutomation`, `eventScale`
- Checkbox (string array): `industry`, `goals`, `opportunityType`, `focusAreas`, `collabTarget`, `collabType`, `templateType`, `eventType`, `eventFormat`

When saving a step, `app/user/info/page.tsx` builds `dataToSave` with only the current field, then calls `saveUserInfoAction(dataToSave)`.

## Server Action I/O

Example request/response shapes to and from server actions.

```typescript
// app/actions/user.ts
export async function updateUserNameAction(newName: string): Promise<{ success: boolean; message: string; }>;
export async function deleteUserAction(): Promise<{ success: boolean; message: string; }>;
export async function getTenantMembersAction(): Promise<
  | { success: true; user: AuthUser; tenantMembers: TenantMember[] }
  | { success: false; error: string }
>;

// app/actions/user-info.ts
export async function getUserInfoAction(tenantId?: string): Promise<
  | { success: true; data: UserInfo | null }
  | { success: false; message: string }
>;

export async function saveUserInfoAction(
  data: Partial<UserInfo>,
  tenantId?: string
): Promise<{ success: boolean; message?: string }>;
```

Typical client-side flow on `/user/info` when saving a step:

```typescript
const result = await saveUserInfoAction({ goals: values.goals });
if (result.success) {
  // advance or complete
} else {
  // show toast with result.message
}
```

## State and UI Behavior

- Loading states: both `/user` and `/user/info` show a centered spinner while fetching.
- Access guard: if `getCurrentUserAction()` returns `null`, render an access card with a button to `/login`.
- Optimistic form update: after successful name change, local user state is updated to reflect the new name immediately.
- Wizard progression: `Previous` disabled at first step; `Save & Complete` appears at final step.
- Toaster feedback: success on save/progress; error on validation or network failure.
- Theme toggle: switches between light/dark; persists via `next-themes`.

## Security Considerations

- Authentication: all user routes rely on `getCurrentUserAction()`; unauthenticated users never hit protected data paths.
- Authorization: admin link is hidden for non-admin users; for server-side enforcement of admin-only pages, see [Admin Panel](./admin-panel.md) and middleware patterns.
- Data isolation: when introducing tenant-aware fields, ensure queries are scoped by `tenantId` and user membership.
- Error handling: server actions return generic messages to avoid leaking internals.

## Accessibility

- Form controls: ensure each option is labeled; `QuestionRenderer` uses `FormLabel` tied to inputs.
- Keyboard navigation: `RadioGroup` and `Checkbox` components are keyboard friendly.
- Focus states: rely on UI primitives that include visible focus rings.
- Announcements: toasts communicate success/errors; consider ARIA live regions if needed.

## Performance Notes

- Batch fetches: `/user/info` uses `Promise.all` to get user and user info in parallel.
- Revalidation: limited to `/user` on profile updates to avoid broad invalidations.
- Client components: keep state minimal and co-locate effects; avoid unnecessary re-renders.
- Framer Motion: keep animation durations short and avoid animating large lists.

## Testing Tips

- Unit test `QuestionRenderer` for both `radio` and `checkbox` flows.
- Integration test the wizard: validation errors, successful save, prev/next behavior.
- E2E test: login → `/user` → change name → `/user/info` → complete questionnaire.
- Mock server actions when testing UI to avoid hitting real backends.

## FAQ

- How do I add a tenant-aware questionnaire?
  - Pass the selected `tenantId` through to `getUserInfoAction`/`saveUserInfoAction` and persist per-tenant responses.
- Can users skip questions?
  - Each step validates via Zod; optional questions can have schemas that allow empty values.
- How do I add a new quick action on the dashboard?
  - Add to `navLinks` in `app/user/page.tsx`. Gate by `roles` if needed.
