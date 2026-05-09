import { getDb } from "@/lib/database";
import { notFound } from "next/navigation";
import {
  Megaphone,
  Users,
  MessageCircle,
  FileText,
  Users2,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  LayoutDashboard
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TenantPageProps {
  params: Promise<{
    tenant: string;
  }>;
}

export default async function TenantPage({ params }: TenantPageProps) {
  const { tenant: tenantSlug } = await params;
  const db = await getDb();

  // 1. Fetch Tenant & Owner Info
  const tenant = await db.findTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  // Get owner info from tenant_members
  const { data: members } = await (await import("@/lib/database/clients")).getSupabaseClient().then(supabase =>
    supabase.from("tenant_members").select("*, user:users(*)").eq("tenant_id", tenant.id).eq("role", "owner").single()
  );

  const owner = members?.user;

  const features = [
    {
      title: "Announcements",
      description: "Stay updated with latest news and official broadcasts.",
      href: "/announcements",
      icon: Megaphone,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Community",
      description: "Interactive Sangam Chat and AI-powered community hub.",
      href: "/community",
      icon: Users2,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Direct Chat",
      description: "Message members directly and collaborate in real-time.",
      href: "/chat",
      icon: MessageCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Connections",
      description: "Expand your network and connect with like-minded peers.",
      href: "/connections",
      icon: Users,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Templates",
      description: "Access standardized document templates and resources.",
      href: "/templates",
      icon: FileText,
      color: "text-rose-500",
      bg: "bg-rose-500/10",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50/50 dark:bg-[#0b0e14] pt-24 pb-12 px-4 md:px-8">
      <div className="max-w-7xl mx-auto space-y-10">

        {/* Header Section */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-card border shadow-xl shadow-primary/5 p-8 md:p-12">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-20 -mt-20 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/10 rounded-full -ml-20 -mb-20 blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
                <LayoutDashboard className="h-3 w-3" />
                Community Command Center
              </div>
              <h1 className="text-4xl md:text-6xl font-serif font-bold text-foreground">
                {tenant.name}
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
                Welcome to your dedicated workspace. Orchestrate, collaborate, and grow together.
              </p>

              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-3 p-2 pr-6 rounded-full bg-slate-100 dark:bg-slate-800/50 border">
                  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {owner?.fullName?.charAt(0).toUpperCase() || "O"}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Owner</p>
                    <p className="text-sm font-semibold">{owner?.fullName || "Community Lead"}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="h-8 px-4 gap-1.5 font-sans">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Node
                </Badge>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="h-48 w-48 bg-gradient-to-br from-primary to-chart-2 rounded-3xl rotate-12 flex items-center justify-center shadow-2xl">
                <Sparkles className="h-20 w-20 text-white animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="group hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/20 overflow-hidden rounded-3xl cursor-pointer">
              <Link href={feature.href}>
                <CardHeader className="relative space-y-4 pb-6">
                  <div className={`h-14 w-14 rounded-2xl ${feature.bg} ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-500`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-serif">{feature.title}</CardTitle>
                    <CardDescription className="text-base line-clamp-2">
                      {feature.description}
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 flex items-center justify-between text-primary font-bold group-hover:gap-4 transition-all">
                  <span className="text-sm">Explore Module</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Link>
            </Card>
          ))}

          {/* Join Stats Placeholder Card */}
          <Card className="rounded-3xl border-2 border-dashed bg-transparent flex flex-col items-center justify-center p-8 text-center space-y-4 opacity-60">
            <div className="h-12 w-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
              <Users className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-muted-foreground font-sans">More community insights coming soon...</p>
          </Card>
        </div>

      </div>
    </main>
  );
}
