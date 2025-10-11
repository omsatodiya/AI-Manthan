# Admin Panel Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Dashboard](#dashboard)
4. [User Management](#user-management)
5. [Analytics & Reporting](#analytics--reporting)
6. [Security & Access Control](#security--access-control)
7. [API & Server Actions](#api--server-actions)
8. [UI Components](#ui-components)
9. [Data Management](#data-management)
10. [Technical Implementation](#technical-implementation)
11. [Best Practices](#best-practices)

## Overview

The admin panel provides comprehensive administrative capabilities for managing users, viewing analytics, and overseeing the application. It features a role-based access control system that ensures only authorized administrators can access administrative functions.

- Analytics and users are scoped to the active tenant (via `tenant_id`).

### Key Features
- **User Management**: Create, read, update, and delete users (scoped by tenant)
- **Analytics Dashboard**: Tenant-only statistics and user metrics
- **Role-based Access**: Admin-only access with proper authentication
- **Data Tables**: Sortable, filterable, and paginated data display
- **Real-time Updates**: Server actions with automatic data refresh
- **Responsive Design**: Mobile-friendly admin interface

## Architecture

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin UI      │    │   Server Layer  │    │   Database      │
│                 │    │                 │    │                 │
│ • Dashboard     │◄──►│ • Server Actions│◄──►│ • Supabase      │
│ • User Tables   │    │ • API Routes    │    │ • RLS Policies  │
│ • Dialogs       │    │ • Middleware    │    │ • Triggers      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Hierarchy
```
Admin Panel
├── Dashboard (app/admin/page.tsx)
│   ├── Analytics Cards
│   └── Management Links
├── User Management (app/admin/users/)
│   ├── Users Table (page.tsx)
│   ├── Columns Definition (columns.tsx)
│   └── User Dialogs
│       ├── Create User Dialog
│       ├── Edit User Dialog
│       └── Delete User Dialog
└── Server Actions (app/actions/admin.ts)
```

## Dashboard

### Main Dashboard (`app/admin/page.tsx`)

**Purpose**: Central hub for administrative overview and navigation.

**Features**:
- Tenant-scoped analytics display (via `tenantId` from context)
- Quick navigation to management sections
- Animated UI with Framer Motion
- Responsive design

**Implementation (excerpt):**
```typescript
export default function AdminDashboard() {
  const { tenantId, isLoading: tenantLoading } = useTenant();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (tenantLoading) return;
    setIsLoading(true);
    (async () => {
      try {
        const data = await getAdminAnalyticsAction(tenantId || undefined);
        setAnalytics(data);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [tenantId, tenantLoading]);

  // ... render cards for analytics.totalUsers, analytics.totalAdmins
}
```

### Analytics Data Structure

**AdminAnalytics Interface**:
```typescript
// lib/types/database.ts
export interface AdminAnalytics {
  totalUsers: number;
  totalAdmins: number;
  totalRegularUsers: number;
  recentSignups: number;
  // Additional metrics can be added here
}
```

## User Management

### Users Page (`app/admin/users/page.tsx`)

**Purpose**: Tenant-scoped user management interface with data table functionality.

**Features**:
- Paginated user data table
- Sorting and filtering capabilities
- Create, edit, and delete user operations
- Real-time data updates
- Loading states and error handling

**Implementation (excerpt):**
```typescript
const { tenantId } = useTenant();
useEffect(() => {
  setIsLoading(true);
  getUsersAction({
    pageIndex,
    pageSize,
    query: filter,
    sort: sorting[0] ? { id: sorting[0].id, desc: sorting[0].desc } : undefined,
    tenantId: tenantId || undefined,
  }).then((result) => {
    setData({ users: result.users, pageCount: result.pageCount });
    setIsLoading(false);
  });
}, [pageIndex, filter, sorting, tenantId]);
```

### Data Table Columns (`app/admin/users/columns.tsx`)

**Purpose**: Define table structure and actions for user data.

**Features**:
- Sortable columns
- Action dropdown menus
- User information display
- Role-based actions

**Implementation**:
```typescript
export const getColumns = (
  openEditDialog: (user: User) => void,
  openDeleteDialog: (user: User) => void
): ColumnDef<User>[] => [
  {
    accessorKey: "fullName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Full Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Role
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openEditDialog(user)}>
              Edit User
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => openDeleteDialog(user)}
              className="text-red-600"
            >
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
```

## Analytics & Reporting

### Analytics Data Fetching

**Server Action (app/actions/admin.ts):**
```typescript
export async function getAdminAnalyticsAction(tenantId?: string) {
  const db = await getDb();
  return db.getAdminAnalytics(tenantId);
}
```

**Database Implementation (lib/functions/user.ts):**
```typescript
async getAdminAnalytics(tenantId?: string) {
  const supabase = await getSupabaseClient();
  if (tenantId) {
    const [{ count: totalUsers }, { count: totalAdmins }] = await Promise.all([
      supabase.from("users").select("id", { count: "exact" }).eq("tenant_id", tenantId).range(0, 0),
      supabase.from("users").select("id", { count: "exact" }).eq("tenant_id", tenantId).eq("role", "admin").range(0, 0),
    ]);
    return { totalUsers: totalUsers || 0, totalAdmins: totalAdmins || 0 };
  }
  const [{ count: totalUsers }, { count: totalAdmins }] = await Promise.all([
    supabase.from("users").select("id", { count: "exact" }).range(0, 0),
    supabase.from("users").select("id", { count: "exact" }).eq("role", "admin").range(0, 0),
  ]);
  return { totalUsers: totalUsers || 0, totalAdmins: totalAdmins || 0 };
}
```

### Analytics Display

**Dashboard Analytics Cards**:
```typescript
// Analytics cards with real-time data
<motion.div variants={itemVariants}>
  <Card className="hover:bg-accent transition-colors">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">Total Users</CardTitle>
      <Users className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{analytics?.totalUsers || 0}</div>
      <p className="text-xs text-muted-foreground">
        +{analytics?.recentSignups || 0} from last week
      </p>
    </CardContent>
  </Card>
</motion.div>
```

## Security & Access Control

### Role-based Access Control
- Only app users with `role = 'admin'` can access the admin panel
- Tenant isolation enforced by passing `tenantId` and filtering by `tenant_id`

**Middleware**: Enforces admin-only access and blocks auth routes on apex domain in production; in development, allows apex if `TENANT` is set.

## API & Server Actions

- `getAdminAnalyticsAction(tenantId?: string)`: returns tenant-scoped analytics
- `getUsersAction(params & { tenantId?: string })`: returns tenant-scoped users

## Data Management

- All admin queries should pass `tenantId` where applicable
- Database functions should apply `eq("tenant_id", tenantId)` when provided

## UI Components

### Create User Dialog (`components/admin/users/create-user-dialog.tsx`)

**Purpose**: Modal dialog for creating new users with form validation.

**Features**:
- Form validation with Zod
- Role selection
- Optional password field
- Success/error feedback
- Auto-generated passwords

**Implementation**:
```typescript
export function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { role: "user" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const result = await createAdminUserAction(values);
    
    if (result.success) {
      toast.success("User Created", { description: result.message });
      onOpenChange(false);
      form.reset();
    } else {
      toast.error("Creation Failed", { description: result.message });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            A secure, random password will be generated if you leave the
            password field blank.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password (Optional)</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? "Creating..." : "Create User"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### Edit User Dialog (`components/admin/users/edit-user-dialog.tsx`)

**Purpose**: Modal dialog for editing existing user information.

**Features**:
- Pre-populated form fields
- Role modification
- Name and email updates
- Validation and error handling

### Delete User Dialog (`components/admin/users/delete-user-dialog.tsx`)

**Purpose**: Confirmation dialog for user deletion.

**Features**:
- User information display
- Confirmation step
- Irreversible action warning
- Success feedback

## Data Management

### Data Table Component (`components/custom/data-table.tsx`)

**Purpose**: Reusable data table with pagination, sorting, and filtering.

**Features**:
- Server-side pagination
- Column sorting
- Search filtering
- Loading states
- Refresh functionality
- Customizable actions

**Implementation**:
```typescript
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount: number;
  onPageChange: (page: number) => void;
  onSortChange: (sorting: SortingState) => void;
  onFilterChange: (filter: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
  pageIndex: number;
  pageSize: number;
  sorting: SortingState;
  children?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  onPageChange,
  onSortChange,
  onFilterChange,
  onRefresh,
  isLoading,
  pageIndex,
  pageSize,
  sorting,
  children,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    pageCount,
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: onSortChange,
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const newState = updater({ pageIndex, pageSize });
        onPageChange(newState.pageIndex);
      }
    },
    manualPagination: true,
    manualSorting: true,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search..."
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="max-w-sm"
          />
          <Button variant="outline" size="icon" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="text-sm text-muted-foreground">
          Showing {pageIndex * pageSize + 1} to{" "}
          {Math.min((pageIndex + 1) * pageSize, data.length)} of {data.length} entries
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex - 1)}
            disabled={pageIndex === 0}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(pageIndex + 1)}
            disabled={pageIndex >= pageCount - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
```

## Technical Implementation

### Type Definitions

**Admin Types**:
```typescript
// lib/types/database.ts
export interface AdminAnalytics {
  totalUsers: number;
  totalAdmins: number;
  totalRegularUsers: number;
  recentSignups: number;
}

export interface GetUsersParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface PaginatedUsersResult {
  users: User[];
  pageCount: number;
}
```

**User Types**:
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
```

### Database Schema

**Users Table**:
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

-- RLS Policies
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete users" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid()::text AND role = 'admin'
    )
  );
```

### Database Functions

**User CRUD Operations**:
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
    return data ? this.mapUserFromDb(data) : null;
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
    return data ? this.mapUserFromDb(data) : null;
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
    return result ? this.mapUserFromDb(result) : null;
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

  mapUserFromDb(data: any): User {
    return {
      id: data.id,
      fullName: data.full_name,
      email: data.email,
      passwordHash: data.password_hash,
      role: data.role,
      tenantId: data.tenant_id,
      otp: data.otp,
      otpExpires: data.otp_expires,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },
};
```

## Best Practices

### 1. Security Best Practices

**Access Control**:
- Implement role-based access control at multiple levels
- Use middleware for route protection
- Validate permissions in server actions
- Implement proper RLS policies

**Data Protection**:
- Never expose sensitive data in client-side code
- Use server actions for all data operations
- Implement proper input validation
- Sanitize user inputs

### 2. Performance Best Practices

**Database Optimization**:
- Use pagination for large datasets
- Implement proper indexing
- Use efficient queries with proper filtering
- Cache frequently accessed data

**UI Performance**:
- Implement loading states
- Use optimistic updates where appropriate
- Debounce search inputs
- Lazy load components when possible

### 3. User Experience Best Practices

**Feedback**:
- Provide clear success/error messages
- Show loading states during operations
- Implement confirmation dialogs for destructive actions
- Use toast notifications for quick feedback

**Navigation**:
- Provide clear navigation paths
- Implement breadcrumbs for complex flows
- Use consistent button styles and placements
- Provide keyboard shortcuts where appropriate

### 4. Code Organization Best Practices

**Component Structure**:
- Separate concerns (UI, logic, data)
- Use TypeScript for type safety
- Implement proper error boundaries
- Use consistent naming conventions

**State Management**:
- Use React hooks for local state
- Implement proper loading and error states
- Use server actions for data mutations
- Implement optimistic updates where appropriate

## Troubleshooting

### Common Issues

1. **"Access Denied" Errors**
   - Check user role and permissions
   - Verify middleware configuration
   - Check RLS policies in database
   - Ensure proper authentication

2. **Data Not Loading**
   - Check database connection
   - Verify server action implementation
   - Check for JavaScript errors in console
   - Verify API endpoint responses

3. **Pagination Issues**
   - Check page count calculation
   - Verify pagination parameters
   - Ensure proper data fetching logic
   - Check for race conditions

4. **Form Validation Errors**
   - Check Zod schema definitions
   - Verify form field names
   - Check validation rules
   - Ensure proper error handling

### Debug Tools

1. **Database Debugging**:
   ```sql
   -- Check user data
   SELECT id, full_name, email, role, created_at 
   FROM users 
   ORDER BY created_at DESC;
   
   -- Check admin users
   SELECT * FROM users WHERE role = 'admin';
   ```

2. **Browser DevTools**:
   - Check Network tab for API calls
   - Inspect Console for errors
   - Use React DevTools for component state
   - Check Application tab for cookies

3. **Server Logs**:
   - Check server action logs
   - Monitor database query performance
   - Check for authentication errors
   - Monitor error rates

## Future Enhancements

### Planned Features
1. **Advanced Analytics**: More detailed metrics and charts
2. **Bulk Operations**: Mass user operations
3. **User Activity Logs**: Track user actions and changes
4. **Advanced Filtering**: More sophisticated search and filter options
5. **Export Functionality**: Export user data to CSV/Excel
6. **User Groups**: Organize users into groups
7. **Permission Management**: Granular permission system
8. **Audit Trail**: Track all administrative actions

### Technical Improvements
1. **Real-time Updates**: WebSocket integration for live data
2. **Advanced Caching**: Redis integration for better performance
3. **Search Optimization**: Full-text search capabilities
4. **Data Visualization**: Charts and graphs for analytics
5. **Mobile Optimization**: Better mobile admin experience
6. **API Rate Limiting**: Protect against abuse
7. **Backup/Restore**: User data backup functionality
8. **Multi-language Support**: Internationalization

---

This documentation provides a comprehensive overview of the admin panel system. For specific implementation details, refer to the source code in the respective files mentioned throughout this document.

