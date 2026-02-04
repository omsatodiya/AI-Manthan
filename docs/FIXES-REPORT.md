# End-to-End Codebase Fixes Report

**Generated:** February 5, 2025  
**Scope:** ConnectIQ / AI Manthan - Full codebase analysis and issue identification

---

## Executive Summary

This report documents issues found during static analysis, build verification, and lint checks. Issues are categorized by severity: **Critical** (blocks build/runtime), **High** (functional bugs), **Medium** (code quality), and **Low** (minor improvements).

---

## 1. CRITICAL ISSUES

### 1.1 Build Failure: "Cannot find module for page"

**Affected:** `/admin`, `/admin/templates`, `/login`

**Root Cause:** During `next build`, page data collection fails. Likely causes:
- Server components (e.g., `/chat`) call `getCurrentUserAction()` → `getDb()` which throws when `DATABASE_PROVIDER` is unset
- Missing or incorrect environment variables during build

**Fix:**
1. Ensure `.env` has `DATABASE_PROVIDER=supabase` and `JWT_SECRET=<secret>` before building
2. Add these to `.env.example` (see 1.2)
3. Clear `.next` and rebuild: `Remove-Item -Recurse -Force .next; pnpm build`

---

### 1.2 Missing Environment Variables in .env.example

**Missing:**
- `DATABASE_PROVIDER` – Required by `lib/database/index.ts`; defaults to throwing if unset
- `JWT_SECRET` – Required by auth middleware, login, signup, and `getCurrentUserAction`
- `TENANT` – Used for dev tenant fallback when subdomain is absent (login/signup)

**Fix:** Add to `.env.example`:
```
DATABASE_PROVIDER=supabase
JWT_SECRET=your_jwt_secret_key_min_32_chars
TENANT=cev
```

---

### 1.3 API Route Mismatch: PATCH /api/messages/read

**Location:** `hooks/use-message-pagination.tsx` line 208

**Issue:** Hook calls `fetch("/api/messages/read", { method: "PATCH", ... })` but the PATCH handler lives in `app/api/messages/route.ts`, so the actual endpoint is `/api/messages`, not `/api/messages/read`.

**Fix:** Either:
- Create `app/api/messages/read/route.ts` and move the PATCH handler there, or
- Change the hook to call `/api/messages` with method PATCH

---

### 1.4 Incorrect Supabase Array Update in PATCH /api/messages

**Location:** `app/api/messages/route.ts` lines 354–365

**Issue:** Uses `read_by: \`array_append(read_by, '${currentUser.id}')\`` as a literal string. Supabase expects a value, not raw SQL. This will not append to the array.

**Fix:** Fetch current `read_by`, append in JS, then update:
```typescript
const { data: messages } = await supabase
  .from("messages")
  .select("id, read_by")
  .eq("conversation_id", conversationId)
  .neq("sender_id", currentUser.id);

for (const msg of messages || []) {
  const readBy = (msg.read_by || []) as string[];
  if (!readBy.includes(currentUser.id)) {
    await supabase
      .from("messages")
      .update({ read_by: [...readBy, currentUser.id] })
      .eq("id", msg.id);
  }
}
```

---

## 2. HIGH SEVERITY ISSUES

### 2.1 Supabase Column Naming: fullName vs full_name

**Location:** `ConversationList.tsx`, `app/api/messages/route.ts`, `app/api/conversations/route.ts`, `app/api/connections/route.ts`

**Issue:** Code selects `fullName` but Supabase/PostgreSQL typically uses `full_name`. If the DB uses snake_case, these selects will fail or return null.

**Fix:** Use `full_name` in Supabase selects and map to `fullName` in the response, or ensure the DB schema uses camelCase consistently.

---

### 2.2 getSupabaseServerClient Not Async

**Location:** `lib/database/clients.ts`

**Issue:** `getSupabaseServerClient()` is synchronous while `getSupabaseClient()` is async. Callers use `await getSupabaseServerClient()`, which works but is inconsistent and can cause confusion.

**Fix:** Either make `getSupabaseServerClient` async for consistency, or remove the unnecessary `await` at call sites.

---

### 2.3 Dead Code: lib/middleware.ts

**Location:** `lib/middleware.ts`

**Issue:** Exports `updateSession` but is never imported. Root `middleware.ts` uses custom JWT auth. This file references Supabase auth and `/auth/login`, which does not exist (auth is at `/login`).

**Fix:** Remove `lib/middleware.ts` if unused, or integrate it into the main middleware if Supabase auth is desired.

---

### 2.4 Mark Messages Read Logic Bug

**Location:** `hooks/use-message-pagination.tsx` lines 218–227

**Issue:** `markMessagesAsRead` updates local state incorrectly: it adds `msg.senderId` to `readBy` for all messages. Read status should only change for messages the current user received, not sent.

**Fix:** Only mark messages where `msg.senderId !== currentUser.id` as read.

---

## 3. MEDIUM SEVERITY (Lint / Code Quality)

### 3.1 ESLint Errors (Blocking)

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `hooks/use-message-pagination.tsx` | 16, 19 | `@typescript-eslint/no-explicit-any` | Replace `any` with `unknown` or proper types for `attachments`, `metadata` |
| `hooks/use-realtime-chat.tsx` | 392 | `prefer-const` | Change `let reactions` to `const reactions` |

### 3.2 ESLint Warnings

| File | Issue | Fix |
|------|-------|-----|
| `contexts/tenant-context.tsx` | Unused import `Tenant` | Remove import |
| `hooks/use-realtime-chat.tsx` | Unnecessary `username` in useCallback deps | Remove from dependency array |
| `hooks/use-realtime-chat.tsx` | Unused `success` variable (lines 255, 368) | Use `_success` or remove |
| `hooks/use-toast.ts` | `actionTypes` only used as type | Use `satisfies` or extract type |

---

## 4. LOW SEVERITY / RECOMMENDATIONS

### 4.1 Inconsistent TENANT Env Var

**Issue:** `.env.example` has `NEXT_PUBLIC_TENANT` but login/signup use `process.env.TENANT` for dev fallback.

**Fix:** Document both: `NEXT_PUBLIC_TENANT` for client, `TENANT` for server-side dev fallback.

---

### 4.2 getSupabaseServerClient Caching

**Issue:** `getSupabaseServerClient()` creates a new client each call. For serverless, a fresh client per request is often correct, but the name suggests a shared instance.

**Fix:** Add a short comment explaining the per-request behavior.

---

### 4.3 Package.json Lint Script

**Issue:** `"lint": "eslint"` – no file arguments. May not lint the project correctly.

**Fix:** Use `"lint": "next lint"` to match Next.js conventions. (Applied)

---

## 5. FIXES APPLIED

### Previous Session
1. **.env.example** – Added `DATABASE_PROVIDER`, `JWT_SECRET`, `TENANT`
2. **API route** – Created `app/api/messages/read/route.ts` for PATCH handler
3. **PATCH read_by** – Corrected Supabase array update logic
4. **ESLint** – Fixed `any` types, `prefer-const`, unused variables in hooks
5. **package.json** – Updated lint script to `next lint`
6. **use-message-pagination** – Message type uses `Record<string, unknown>` for attachments/metadata
7. **use-realtime-chat** – Reverted first `reactions` to `let` (reassigned in replacedReactionType branch)

### Latest Session (All Remaining Issues)
8. **2.1 full_name** – Updated all Supabase user selects to use `full_name` and map to `fullName` (ConversationList, messages/conversations/connections APIs, ChatComponent, ChatPageClient, connections page, lib/functions/user.ts, lib/functions/user-info.ts)
9. **2.2 getSupabaseServerClient** – Removed unnecessary `await` at call sites (messages route, conversations route)
10. **2.3 Dead code** – Deleted unused `lib/middleware.ts`
11. **2.4 markMessagesAsRead** – Fixed logic: only update received messages, add `currentUserId` to readBy; added `currentUserId` to hook props
12. **4.1 TENANT** – Documented in .env.example (client vs server-side)

---

## 6. VERIFICATION CHECKLIST

After applying fixes:

- [ ] Set `DATABASE_PROVIDER=supabase` and `JWT_SECRET` in `.env`
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` in `.env` (build imports modules that require these)
- [ ] Run `pnpm build` – should complete once all required env vars are set
- [ ] Run `pnpm lint` – should pass with no errors
- [ ] Test login flow at `/login`
- [ ] Test chat: create conversation, send message, verify read status
- [ ] Test admin templates at `/admin/templates`
- [ ] Verify tenant context loads for logged-in users

---

## 7. DATABASE SCHEMA NOTES

The README SQL uses `full_name` (snake_case). The codebase uses `fullName` (camelCase) in several places. Ensure your Supabase schema matches what the code expects:

- If using `full_name`: update `lib/functions/user.ts` and API routes to select `full_name` and map to `fullName`
- If using `fullName`: ensure migrations/create scripts use camelCase column names

---

## 8. MANUAL TESTING REFERENCE

See `docs/manual-testing-checklist.md` for detailed chat and feature test scenarios.
