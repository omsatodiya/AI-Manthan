"use client";

import { motion } from "framer-motion";
import { 
  Users, 
  MessageSquare, 
  Settings, 
  ArrowRight,
  Activity,
  Loader2
} from "lucide-react";
import { useCommunityManagement } from "@/components/community/community-management-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCommunityAnalyticsAction } from "@/app/actions/tenant-member";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function CommunityOverviewPage() {
  const { selectedTenantId, managedTenants } = useCommunityManagement();
  const [stats, setStats] = useState({
    totalMembers: 0,
    pendingRequests: 0,
    activeAdmins: 0,
    engagement: "84%" // Keeping one dummy for aesthetic unless we have logic for it
  });
  const [isLoading, setIsLoading] = useState(true);
  
  const currentTenant = managedTenants.find(t => t.id === selectedTenantId);

  useEffect(() => {
    if (selectedTenantId) {
      setIsLoading(true);
      getCommunityAnalyticsAction(selectedTenantId).then(result => {
        if (result.success && result.stats) {
          setStats(prev => ({
            ...prev,
            totalMembers: result.stats.totalMembers,
            activeAdmins: result.stats.activeAdmins,
            pendingRequests: result.stats.pendingRequests
          }));
        } else if (!result.success) {
          toast.error(result.error || "Failed to load community stats");
        }
        setIsLoading(false);
      });
    }
  }, [selectedTenantId]);

  if (!currentTenant) return null;

  const statCards = [
    { label: "Total Members", value: stats.totalMembers.toString(), icon: Users, trend: "Community scale", color: "text-blue-600" },
    { label: "Active Requests", value: stats.pendingRequests.toString(), icon: MessageSquare, trend: stats.pendingRequests > 0 ? "Requires attention" : "All caught up", color: stats.pendingRequests > 0 ? "text-amber-600" : "text-green-600" },
    { label: "Active Admins", value: stats.activeAdmins.toString(), icon: Settings, trend: "Node authority", color: "text-purple-600" },
    { label: "Engagement", value: stats.engagement, icon: Activity, trend: "Network health", color: "text-green-600" },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] bg-card border border-border/50 p-8 shadow-sm"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Settings className="h-32 w-32 rotate-12" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-serif font-medium mb-2">Welcome back, Administrator</h2>
          <p className="text-muted-foreground leading-relaxed">
            You are currently managing <strong>{currentTenant.name}</strong>. From here, you can oversee your community&apos;s activity, manage membership requests, and configure settings.
          </p>
          <div className="flex gap-4 mt-6">
            <Button asChild className="rounded-xl h-11 px-6 font-bold shadow-lg shadow-primary/20">
              <Link href="/community-management/requests">
                Review Requests <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-xl h-11 px-6 font-bold">
              <Link href="/community-management/users">
                Manage Members
              </Link>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all rounded-2xl overflow-hidden">
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</CardTitle>
                <stat.icon className={stat.color + " h-4 w-4"} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-sans">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /> : stat.value}
                </div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <span className={stat.color}>{stat.trend}</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-border/50 bg-card/50 rounded-3xl overflow-hidden">
          <CardHeader>
            <CardTitle className="font-serif">Recent Community Activity</CardTitle>
            <CardDescription>Stay updated with what&apos;s happening in your node.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {[1, 2, 3].map((_, i) => (
              <div key={i} className="flex gap-4 items-start pb-4 border-b border-border/30 last:border-0 last:pb-0">
                <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">New member joined the community</p>
                  <p className="text-xs text-muted-foreground mt-0.5">2 hours ago • Verified via global network</p>
                </div>
              </div>
            ))}
            <Button variant="ghost" className="w-full text-primary font-bold hover:bg-primary/5 rounded-xl">
              View All Activity Log
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-none bg-gradient-to-br from-primary to-chart-1 text-primary-foreground rounded-3xl shadow-xl shadow-primary/20">
            <CardHeader>
              <CardTitle className="text-xl font-serif">Community Health</CardTitle>
              <CardDescription className="text-primary-foreground/70">Your node is performing at peak efficiency.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-6">
                <div className="h-32 w-32 rounded-full border-8 border-primary-foreground/20 border-t-primary-foreground animate-[spin_3s_linear_infinite] flex items-center justify-center">
                  <div className="text-2xl font-bold font-sans">98%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
