"use client";

import { GlobalZoneGuard } from "@/components/auth/global-zone-guard";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Sparkles,
  LayoutGrid
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMyApplicationsAction } from "@/app/actions/tenant-application";
import { TenantApplication } from "@/lib/types/tenant-application";
import { format } from "date-fns";

export default function OrganizationRequestsPage() {
  const [applications, setApplications] = useState<TenantApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      const result = await getMyApplicationsAction();
      if (result.success && result.applications) {
        setApplications(result.applications);
      }
      setIsLoading(false);
    };

    fetchApplications();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200/50 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200/50 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-200/50 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending Review
          </Badge>
        );
    }
  };

  return (
    <>
      <GlobalZoneGuard />
      <div className="relative min-h-screen pb-20 bg-gradient-to-br from-[#f6f7fb] via-[#f2f7f4] to-[#fef7f3] dark:from-[#0b0e14] dark:via-[#111827] dark:to-[#0b1220]">
      <div className="container mx-auto max-w-5xl pt-24 px-4 sm:px-6 relative z-10">
        <div className="flex flex-col gap-10">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4 items-center text-center"
          >
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-primary text-xs font-bold uppercase tracking-wider mb-4 font-sans border border-primary/10">
                <LayoutGrid className="h-3 w-3" />
                Network Expansion
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight text-foreground mb-6">
                <span className="font-serif font-medium">Organization</span>
                <span className="block font-sans font-bold text-primary dark:text-foreground mt-1 md:mt-2">
                  Requests
                </span>
              </h1>
              <p className="text-lg text-foreground/80 max-w-2xl mt-4 leading-relaxed mx-auto font-sans">
                Track your applications to create and lead a new community node in the network.
              </p>
            </div>
          </motion.div>

          <div className="w-full">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-48 rounded-2xl bg-card border border-border/70 animate-pulse" />
                ))}
              </div>
            ) : applications.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6"
              >
                {applications.map((app, index) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="bg-card border border-border/70 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group h-full flex flex-col">
                      <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <CardTitle className="text-xl font-serif font-medium group-hover:text-primary transition-colors">
                              {app.orgName}
                            </CardTitle>
                            <CardDescription className="font-mono text-xs flex items-center gap-1.5">
                              <span className="text-primary/70">iq.app/</span>
                              {app.requestedSlug}
                            </CardDescription>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                            <Building2 className="h-5 w-5" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-6 flex-1 flex flex-col justify-between">
                        <div className="space-y-4">
                          <p className="text-sm text-foreground/70 font-sans line-clamp-3 leading-relaxed">
                            {app.description || "No description provided."}
                          </p>
                          
                          <div className="flex items-center justify-between pt-2">
                            <div className="text-[10px] text-foreground/50 font-sans flex items-center gap-1.5 uppercase tracking-wider font-bold">
                              <Clock className="h-3 w-3" />
                              {format(new Date(app.createdAt), "MMM d, yyyy")}
                            </div>
                            {getStatusBadge(app.status)}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 px-4 bg-card/30 backdrop-blur-sm rounded-3xl border border-dashed border-border/60"
              >
                <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-primary mb-6">
                  <Sparkles className="h-10 w-10" />
                </div>
                <h3 className="text-2xl font-serif font-medium mb-2 text-center">Start your journey</h3>
                <p className="text-foreground/70 text-center max-w-sm mb-8 font-sans">
                  You haven&apos;t requested any organizations yet. Ready to lead your own community?
                </p>
                <Button asChild className="bg-primary hover:bg-chart-2 text-primary-foreground font-sans font-semibold h-12 px-8 rounded-xl shadow-lg shadow-primary/20">
                  <Link href="/apply-community" className="flex items-center gap-2">
                    Create Application
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
        </div>
      </div>
    </>
  );
}
