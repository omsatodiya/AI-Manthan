import { redirect } from "next/navigation";
import { getDb } from "@/lib/database";
import { getCurrentUserAction } from "@/app/actions/auth";
import { TenantHydrator } from "@/components/tenant/tenant-hydrator";
import { cookies } from "next/headers";

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantLayout({
  children,
  params,
}: TenantLayoutProps) {
  const { tenant: tenantSlug } = await params;
  const db = await getDb();

  // 1. Fetch Tenant by Slug
  const tenant = await db.findTenantBySlug(tenantSlug);
  if (!tenant) {
    // Clear the invalid tenant cookie to prevent incorrect redirection states
    const cookieStore = await cookies();
    cookieStore.delete("current_tenant");
    // If community doesn't exist, go back to lobby
    redirect("/");
  }

  // 2. Fetch Current User
  const user = await getCurrentUserAction();
  if (!user) {
    // If not logged in, redirect to global login
    // We append the current host to return back after login if needed
    redirect("/login");
  }

  // 3. Verify Membership
  const members = await db.getTenantMembers(tenant.id);
  const membership = members.find((m) => m.userId === user.id);

  if (!membership || membership.status !== "active") {
    // If not a member or pending, redirect to unauthorized page
    redirect("/unauthorized");
  }

  // 4. Authorized: Render the community workspace
  return (
    <div className="flex flex-col min-h-screen">
      <TenantHydrator tenantId={tenant.id} />
      {children}
    </div>
  );
}
