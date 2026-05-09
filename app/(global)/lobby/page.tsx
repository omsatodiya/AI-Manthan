import { getCurrentUserAction } from "@/app/actions/auth";
import { getMyJoinRequestsAction } from "@/app/actions/tenant-member";
import { getMyApplicationsAction } from "@/app/actions/tenant-application";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building2, LayoutGrid, Clock, Plus, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function LobbyPage() {
  const user = await getCurrentUserAction();
  if (!user) {
    redirect("/login");
  }

  const [membershipsResult, applicationsResult] = await Promise.all([
    getMyJoinRequestsAction(),
    getMyApplicationsAction()
  ]);

  const memberships = (membershipsResult.success ? membershipsResult.requests : []) ?? [];
  const applications = (applicationsResult.success ? applicationsResult.applications : []) ?? [];

  const activeCommunities = memberships?.filter(m => m.status === 'active') || [];
  const pendingMemberships = memberships?.filter(m => m.status === 'pending') || [];

  return (
    <main className="min-h-screen bg-secondary/30 dark:bg-background p-6 md:p-12 pt-24">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-serif text-foreground">
              Welcome back, {user.fullName.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground text-lg">
              Select a workspace to continue or discover new communities.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full shadow-lg">
            <Link href="/tenant-applications" className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Register My Org
            </Link>
          </Button>
        </div>

        {/* Active Workspaces */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <LayoutGrid className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-semibold font-serif">Your Workspaces</h2>
          </div>

          {activeCommunities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCommunities.map((m) => (
                <Card key={m.id} className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 overflow-hidden">
                  <CardHeader className="bg-primary/5 group-hover:bg-primary/10 transition-colors">
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{m.tenant?.name}</span>
                      <Building2 className="h-5 w-5 text-primary/40" />
                    </CardTitle>
                    <CardDescription>{m.tenant?.slug}.connectiq.com</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Button asChild className="w-full rounded-xl group-hover:scale-[1.02] transition-transform">
                      {/* In a real production environment, this would be an absolute URL to the subdomain */}
                      <a href={`http://${m.tenant?.slug}.localhost:3000`} className="flex items-center gap-2">
                        Enter Workspace
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-3xl border-2 border-dashed">
              <p className="text-muted-foreground text-lg">You haven&apos;t joined any communities yet.</p>
              <Button asChild variant="link" className="mt-2 text-primary">
                <Link href="/community">Browse featured communities</Link>
              </Button>
            </div>
          )}
        </section>

        {/* Pending Requests */}
        {(pendingMemberships.length > 0 || applications.length > 0) && (
          <section className="space-y-6">
            <div className="flex items-center gap-3 border-b pb-4">
              <Clock className="h-6 w-6 text-amber-500" />
              <h2 className="text-2xl font-semibold font-serif">Pending Requests</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingMemberships.map((m) => (
                <Card key={m.id} className="border-amber-200 bg-amber-50/30 dark:bg-amber-900/10">
                  <CardHeader>
                    <CardTitle className="text-lg">Join: {m.tenant?.name}</CardTitle>
                    <CardDescription>Waiting for community admin approval</CardDescription>
                  </CardHeader>
                </Card>
              ))}
              {applications.filter(a => a.status === 'pending').map((a) => (
                <Card key={a.id} className="border-blue-200 bg-blue-50/30 dark:bg-blue-900/10">
                  <CardHeader>
                    <CardTitle className="text-lg">Org: {a.orgName}</CardTitle>
                    <CardDescription>Waiting for platform admin review</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
