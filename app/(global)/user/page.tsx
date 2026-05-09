import { UserDashboard } from "@/components/user/user-dashboard";

export default function GlobalUserPage() {
  return (
    <main className="min-h-screen bg-secondary p-4 sm:p-6 md:p-8 dark:bg-background">
      <UserDashboard showTenantCards={false} />
    </main>
  );
}
