"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Building2,
  LayoutDashboard,
  Users,
  MessageSquare
} from "lucide-react";
import {
  CommunityManagementProvider,
  useCommunityManagement
} from "@/components/community/community-management-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function CommunityManagementLayoutContent({ children }: { children: React.ReactNode }) {
  const { managedTenants, selectedTenantId, setSelectedTenantId, isLoading } = useCommunityManagement();
  const pathname = usePathname();

  const navItems = [
    { label: "Overview", href: "/community-management", icon: LayoutDashboard },
    { label: "Join Requests", href: "/community-management/requests", icon: MessageSquare },
    { label: "Members", href: "/community-management/users", icon: Users },
  ];

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (managedTenants.length === 0) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] dark:from-[#0b0e14] dark:via-[#111827] dark:to-[#0b1220] pb-20 pt-24">
      <div className="container mx-auto max-w-6xl px-4">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="h-3 w-3" />
              Management Portal
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-medium tracking-tight text-foreground">
              Community <span className="text-primary italic font-sans font-bold">Management</span>
            </h1>
          </div>

          <div className="flex flex-col gap-2 min-w-[240px]">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
              Select Community
            </label>
            <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
              <SelectTrigger className="bg-card border-primary/20 hover:border-primary/40 transition-colors h-12 rounded-xl shadow-sm">
                <SelectValue placeholder="Choose a community" />
              </SelectTrigger>
              <SelectContent>
                {managedTenants.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary/70" />
                      {t.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mb-8 bg-secondary/30 p-1.5 rounded-2xl w-fit border border-border/50">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                asChild
                variant="ghost"
                className={cn(
                  "relative rounded-xl h-10 px-6 font-sans font-medium transition-all duration-300",
                  isActive ? "text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Link href={item.href}>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-card border border-border/50 rounded-xl"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </span>
                </Link>
              </Button>
            );
          })}
        </div>

        {/* Page Content */}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default function CommunityManagementLayout({ children }: { children: React.ReactNode }) {
  return (
    <CommunityManagementProvider>
      <CommunityManagementLayoutContent>
        {children}
      </CommunityManagementLayoutContent>
    </CommunityManagementProvider>
  );
}
