# Multi-Tenant System Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Type System](#type-system)
5. [Core Components](#core-components)
6. [API & Actions](#api--actions)
7. [Frontend Integration](#frontend-integration)
8. [Security & RLS](#security--rls)
9. [Usage Examples](#usage-examples)
10. [Technical Implementation](#technical-implementation)

## Overview

The multi-tenant system enables users to belong to multiple organizations (tenants) with different roles and permissions. Each user can have different information and settings per tenant, allowing for flexible organizational structures.

### Key Features
- **Multi-tenant Architecture**: Users can belong to multiple tenants
- **Role-based Access Control**: Tenant roles are owner/member; user roles are admin/user
- **Tenant-specific Data**: User information can vary per tenant
- **Invitation System**: Secure tenant invitation and onboarding
- **Context Management**: React Context for tenant state management
- **Database Isolation**: Row-level security for data protection

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│                 │    │                 │    │                 │
│ • TenantContext │◄──►│ • Server Actions│◄──►│ • Supabase      │
│ • Hooks         │    │ • API Routes    │    │ • RLS Policies  │
│ • Components    │    │ • Database      │    │ • Triggers      │
│                 │    │   Adapters      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Hierarchy
```
TenantProvider (Context)
├── useTenantData (Hook)
├── useTenantSelection (Hook)
├── TenantSelector (Component)
├── TenantCard (Component)
└── TenantBadge (Component)
```

## Database Schema

### Core Tables

#### 1. `tenants`
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2. `tenant_members`
```sql
CREATE TABLE tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'member')) NOT NULL,
  permissions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, tenant_id)
);
```

#### 3. `tenant_invitations`
```sql
CREATE TABLE tenant_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('owner', 'member')) NOT NULL,
  invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 4. `users` (Updated)
```sql
-- Primary tenant association for convenience/reporting
ALTER TABLE users ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id);

-- Composite uniqueness so same email can exist in different tenants
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

#### 5. `user_info` (Updated)
```sql
ALTER TABLE user_info ADD COLUMN tenant_id UUID REFERENCES tenants(id);
```

### Relationships
- **Users ↔ Tenants**: Many-to-many via `tenant_members`
- **Users ↔ UserInfo**: One-to-many (per tenant)
- **Tenants ↔ Invitations**: One-to-many

## Type System

### Core Types (`lib/types/tenant.ts`)

```typescript
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  settings?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface TenantMember {
  id: string;
  userId: string;
  tenantId: string;
  role: "owner" | "member";
  permissions?: string[] | null;
  joinedAt: string;
  user?: User | null;
  tenant?: Tenant | null;
}

export interface TenantInvitation {
  id: string;
  tenantId: string;
  email: string;
  role: "owner" | "member";
  invitedBy: string;
  token: string;
  expiresAt: string;
  acceptedAt?: string | null;
  createdAt: string;
}
```

### Updated Types

#### User Types
```typescript
export interface User {
  // ... existing fields
  tenantId?: string | null; // Primary tenant association
}

export interface UserInfo {
  // ... existing fields
  tenantId?: string | null; // Tenant-specific information
}
```

## Core Components

### 1. TenantProvider (`contexts/tenant-context.tsx`)

**Purpose**: Global tenant state management using React Context.

**Key Features**:
- Manages current tenant selection
- Persists selection in localStorage
- Provides tenant switching functionality
- Handles loading states

**API**:
```typescript
interface TenantContextType {
  tenantId: string | null;
  setTenantId: (tenantId: string) => void;
  isLoading: boolean;
  availableTenants: Pick<Tenant, "id" | "name" | "slug">[];
  setAvailableTenants: (tenants: Pick<Tenant, "id" | "name" | "slug">[]) => void;
}
```

### 2. useTenantData Hook (`hooks/use-tenant-data.ts`)

**Purpose**: Fetches and manages tenant membership data.

**Features**:
- Fetches user's tenant memberships
- Transforms raw API data to typed objects
- Handles loading and error states
- Provides refetch functionality

**Return Type**:
```typescript
interface UseTenantDataReturn {
  tenantMembers: TenantMember[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
```

### 3. useTenantSelection Hook (`hooks/use-tenant-selection.ts`)

**Purpose**: Manages tenant selection logic and state.

**Features**:
- Integrates with TenantContext
- Provides available tenants list
- Handles automatic tenant selection
- Manages current tenant state

**Return Type**:
```typescript
interface UseTenantSelectionReturn {
  selectedTenantId: string | null;
  setSelectedTenantId: (tenantId: string) => void;
  availableTenants: Array<{ id: string; name: string; role: string }>;
  currentTenant: TenantMember | null;
  isLoading: boolean;
  error: string | null;
}
```

### 4. UI Components

#### TenantSelector (`components/tenant/tenant-selector.tsx`)
- Dropdown selector for tenant switching
- Shows user role for each tenant
- Displays current tenant badge

#### TenantCard (`components/tenant/tenant-card.tsx`)
- Card-based tenant display
- Shows tenant information and role
- Supports selection state

#### TenantBadge (`components/tenant/tenant-badge.tsx`)
- Badge component for tenant/role display
- Multiple variants (default, secondary, outline, destructive)
- Optional role display

## API & Actions

### Server Actions

#### `getTenantMembersAction()` (`app/actions/user.ts`)
```typescript
export async function getTenantMembersAction() {
  // Fetches user's tenant memberships with tenant details
  // Returns: { success: boolean, tenantMembers?: TenantMember[], error?: string }
}
```

### Database Functions (`lib/functions/tenant.ts`)

#### Core CRUD Operations
```typescript
// Tenant Management
findTenantById(id: string): Promise<Tenant | null>
findTenantBySlug(slug: string): Promise<Tenant | null>
createTenant(tenant: Omit<Tenant, "id" | "createdAt" | "updatedAt">): Promise<Tenant | null>
updateTenant(id: string, data: Partial<Tenant>): Promise<Tenant | null>
deleteTenant(id: string): Promise<boolean>

// Member Management
getTenantMembers(tenantId: string): Promise<TenantMember[]>
getTenantMembersByUser(userId: string): Promise<TenantMember[]>
addTenantMember(member: Omit<TenantMember, "id" | "joinedAt">): Promise<TenantMember | null>
updateTenantMember(id: string, data: Partial<TenantMember>): Promise<TenantMember | null>
removeTenantMember(id: string): Promise<boolean>

// Invitation Management
createTenantInvitation(invitation: Omit<TenantInvitation, "id" | "createdAt">): Promise<TenantInvitation | null>
findTenantInvitationByToken(token: string): Promise<TenantInvitation | null>
acceptTenantInvitation(token: string, userId: string): Promise<TenantMember | null>
deleteTenantInvitation(id: string): Promise<boolean>
```

### User Info Integration

#### Tenant-Specific User Information
```typescript
// Get user info for specific tenant
getUserInfo(userId: string, tenantId?: string): Promise<UserInfo | null>

// Create/update tenant-specific user info
createUserInfo(userInfo: Omit<UserInfo, "id" | "createdAt" | "updatedAt">): Promise<UserInfo | null>
updateUserInfo(userId: string, data: Partial<UserInfo>, tenantId?: string): Promise<UserInfo | null>
```

## Frontend Integration

### 1. Provider Setup
```typescript
// In your app layout or root component
import { TenantProvider } from "@/contexts/tenant-context";

export default function RootLayout({ children }) {
  return (
    <TenantProvider>
      {children}
    </TenantProvider>
  );
}
```

### 2. Using Tenant Context
```typescript
import { useTenant } from "@/contexts/tenant-context";

function MyComponent() {
  const { tenantId, setTenantId, availableTenants } = useTenant();
  
  return (
    <div>
      <p>Current Tenant: {tenantId}</p>
      {/* Tenant switching is disabled; selection inferred from subdomain */}
    </div>
  );
}
```

### 3. Using Tenant Data Hook
```typescript
import { useTenantData } from "@/hooks/use-tenant-data";

function TenantList() {
  const { tenantMembers, loading, error, refetch } = useTenantData();
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      {tenantMembers.map(member => (
        <div key={member.id}>
          {member.tenant?.name} - {member.role}
        </div>
      ))}
    </div>
  );
}
```

### 4. Using Tenant Selection Hook
```typescript
import { useTenantSelection } from "@/hooks/use-tenant-selection";
import { useTenantData } from "@/hooks/use-tenant-data";

function TenantSelector() {
  const { tenantMembers, loading, error } = useTenantData();
  const { 
    selectedTenantId, 
    setSelectedTenantId, 
    availableTenants 
  } = useTenantSelection(tenantMembers, loading, error);
  
  return (
    <select 
      value={selectedTenantId || ''} 
      onChange={(e) => setSelectedTenantId(e.target.value)}
    >
      {availableTenants.map(tenant => (
        <option key={tenant.id} value={tenant.id}>
          {tenant.name} ({tenant.role})
        </option>
      ))}
    </select>
  );
}
```

## Security & RLS

### Row Level Security Policies

#### 1. Users Table
```sql
-- Users can only see their own data
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);
```

#### 2. Tenants Table
```sql
-- Users can only see tenants they're members of
CREATE POLICY "Users can view tenant data" ON tenants
  FOR SELECT USING (
    id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid()::text
    )
  );
```

#### 3. Tenant Members Table
```sql
-- Users can only see memberships they're part of
CREATE POLICY "Users can view tenant memberships" ON tenant_members
  FOR SELECT USING (
    user_id = auth.uid()::text OR tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid()::text AND role IN ('owner')
    )
  );
```

#### 4. User Info Table
```sql
-- Users can only see their own info, optionally filtered by tenant
CREATE POLICY "Users can view own info" ON user_info
  FOR SELECT USING (
    user_id = auth.uid()::text AND
    (tenant_id IS NULL OR tenant_id IN (
      SELECT tenant_id FROM tenant_members 
      WHERE user_id = auth.uid()::text
    ))
  );
```

### Security Considerations

1. **Data Isolation**: Each tenant's data is isolated through RLS policies
2. **Role-based Access**: Different roles have different permissions
3. **Invitation Security**: Invitations use secure tokens with expiration
4. **Input Validation**: All inputs are validated and sanitized
5. **SQL Injection Prevention**: Using parameterized queries

## Usage Examples

### 1. Creating a New Tenant
```typescript
import { getDb } from "@/lib/database";

async function createTenant(name: string, slug: string) {
  const db = await getDb();
  
  const tenant = await db.createTenant({
    name,
    slug,
    description: "New organization",
    settings: {}
  });
  
  // Add creator as owner
  if (tenant) {
    await db.addTenantMember({
      userId: currentUser.id,
      tenantId: tenant.id,
      role: "owner",
      permissions: []
    });
  }
  
  return tenant;
}
```

### 2. Inviting a User to a Tenant
```typescript
import { getDb } from "@/lib/database";
import crypto from "crypto";

async function inviteUserToTenant(tenantId: string, email: string, role: string) {
  const db = await getDb();
  
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  
  const invitation = await db.createTenantInvitation({
    tenantId,
    email,
    role: role as "owner" | "member",
    invitedBy: currentUser.id,
    token,
    expiresAt: expiresAt.toISOString()
  });
  
  // Send invitation email with token
  await sendInvitationEmail(email, token);
  
  return invitation;
}
```

### 3. Accepting a Tenant Invitation
```typescript
async function acceptInvitation(token: string) {
  const db = await getDb();
  
  const member = await db.acceptTenantInvitation(token, currentUser.id);
  
  if (member) {
    // Refresh tenant data
    await refetchTenantData();
    // Redirect to tenant dashboard
    router.push(`/tenant/${member.tenantId}`);
  }
  
  return member;
}
```

### 4. Getting Tenant-Specific User Information
```typescript
async function getUserInfoForTenant(tenantId: string) {
  const db = await getDb();
  
  const userInfo = await db.getUserInfo(currentUser.id, tenantId);
  
  if (!userInfo) {
    // Create default user info for this tenant
    userInfo = await db.createUserInfo({
      userId: currentUser.id,
      tenantId,
      role: "member",
      // ... other default values
    });
  }
  
  return userInfo;
}
```

## Technical Implementation

### 1. Database Adapter Pattern
The system uses a database adapter pattern to abstract database operations:

```typescript
// lib/database/index.ts
export async function getDb(): Promise<DatabaseAdapter> {
  if (!cachedDbAdapter) {
    cachedDbAdapter = (await import('../functions')).SupabaseAdapter;
  }
  return cachedDbAdapter;
}
```

### 2. Type Safety
All database operations are fully typed using TypeScript interfaces:

```typescript
// lib/types/database.ts
export interface DatabaseAdapter {
  // Tenant operations
  findTenantById(id: string): Promise<Tenant | null>;
  createTenant(tenant: Omit<Tenant, "id" | "createdAt" | "updatedAt">): Promise<Tenant | null>;
  // ... other operations
}
```

### 3. Error Handling
Comprehensive error handling throughout the system:

```typescript
try {
  const result = await db.createTenant(tenantData);
  if (!result) {
    throw new Error("Failed to create tenant");
  }
  return { success: true, data: result };
} catch (error) {
  console.error("Tenant creation error:", error);
  return { success: false, message: "Failed to create tenant" };
}
```

### 4. Performance Optimizations
- **Caching**: Database adapter is cached to avoid repeated imports
- **Lazy Loading**: Components load tenant data only when needed
- **Optimistic Updates**: UI updates immediately with rollback on error
- **Pagination**: Large tenant lists are paginated

### 5. State Management
- **React Context**: Global tenant state management
- **Local Storage**: Persistence of tenant selection
- **Server State**: Server actions for data fetching
- **Client State**: React hooks for local state management

### 6. Data Flow
```
User Action → Server Action → Database Adapter → Supabase → RLS Policy → Data
     ↓
UI Update ← Hook State ← Context State ← Response Data ← Database Response
```

## Best Practices

### 1. Tenant Selection
- Always validate tenant access before operations
- Provide clear feedback for unauthorized access
- Handle tenant switching gracefully

### 2. Data Isolation
- Use tenantId parameter in all relevant queries
- Implement proper RLS policies
- Validate tenant membership before data access

### 3. Error Handling
- Provide user-friendly error messages
- Log detailed errors for debugging
- Implement proper fallback states

### 4. Performance
- Cache frequently accessed tenant data
- Use pagination for large datasets
- Optimize database queries with proper indexing

### 5. Security
- Validate all inputs
- Use parameterized queries
- Implement proper authentication checks
- Follow principle of least privilege

## Troubleshooting

### Common Issues

1. **Tenant Not Found**
   - Check if user is a member of the tenant
   - Verify RLS policies are correctly configured
   - Ensure tenant exists in database

2. **Permission Denied**
   - Verify user role in tenant
   - Check RLS policies for the specific operation
   - Ensure proper authentication

3. **Data Not Loading**
   - Check network connectivity
   - Verify server action implementation
   - Check browser console for errors

4. **Context Not Available**
   - Ensure TenantProvider wraps the component
   - Check if context is properly initialized
   - Verify hook usage within provider

### Debug Tools
```sql
-- Check user's tenant memberships
SELECT tm.*, t.name, t.slug 
FROM tenant_members tm 
JOIN tenants t ON tm.tenant_id = t.id 
WHERE tm.user_id = 'user-id';
```

```sql
-- Verify per-tenant analytics
SELECT count(*) FROM public.users WHERE tenant_id = '<TENANT_UUID>';
SELECT count(*) FROM public.users WHERE tenant_id = '<TENANT_UUID>' AND role = 'admin';
```

## Future Enhancements

### Planned Features
1. **Tenant Settings Management**: UI for tenant configuration
2. **Advanced Permissions**: Granular permission system
3. **Tenant Analytics**: Usage and performance metrics (scoped by tenant_id)
4. **Bulk Operations**: Mass user management
5. **API Rate Limiting**: Per-tenant rate limits
6. **Audit Logging**: Track all tenant operations

### Technical Improvements
1. **Caching Layer**: Redis for tenant data caching
2. **Event System**: Real-time tenant updates
3. **Migration Tools**: Tenant data migration utilities
4. **Monitoring**: Tenant-specific monitoring and alerts
5. **Backup/Restore**: Tenant data backup solutions

---

This documentation provides a comprehensive overview of the multi-tenant system. For specific implementation details, refer to the source code in the respective files mentioned throughout this document.
