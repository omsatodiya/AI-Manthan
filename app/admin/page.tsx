import { getDb } from "@/lib/database";
import { getSessionUser } from "@/lib/auth/session";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";

export default async function AdminDashboardPage() {
  const db = await getDb();
  const user = await getSessionUser();
  const analytics = await db.getAdminAnalytics(user?.tenantId ?? undefined);

  return <AdminDashboardClient initialAnalytics={analytics} />;
}
