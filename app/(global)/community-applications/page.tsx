"use client";

import { GlobalZoneGuard } from "@/components/auth/global-zone-guard";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback } from "react";
import { 
  Building2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  Sparkles,
  LayoutGrid,
  ExternalLink,
  ShieldCheck
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
import { getMyJoinRequestsAction } from "@/app/actions/tenant-member";
import { TenantMember } from "@/lib/types/tenant";
import { format } from "date-fns";
import { toast } from "sonner";

export default function CommunityApplicationsPage() {
  const [requests, setRequests] = useState<TenantMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setIsLoading(true);
    const result = await getMyJoinRequestsAction();
    if (result.success && result.requests) {
      setRequests(result.requests);
    } else if (!result.success) {
      toast.error(result.error || "Failed to load requests");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200/50 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Joined
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200/50 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Declined
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
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-primary text-xs font-bold uppercase tracking-wider mb-4 font-sans">
                  <LayoutGrid className="h-3 w-3" />
                  Network Dashboard
                </div>
                <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight text-foreground mb-6">
                  <span className="font-serif font-medium">Community</span>
                  <span className="block font-sans font-bold text-primary dark:text-foreground mt-1 md:mt-2">
                    Applications
                  </span>
                </h1>
                <p className="text-lg text-foreground/80 max-w-2xl mt-4 leading-relaxed mx-auto font-sans">
                  Monitor the status of your requests to join the ConnectIQ ecosystem.
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
              ) : requests.length > 0 ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  {requests.map((req, index) => (
                    <motion.div
                      key={req.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="bg-card border border-border/70 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group h-full flex flex-col">
                        <CardHeader className="pb-4 border-b border-border/30 bg-muted/20">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <CardTitle className="text-xl font-serif font-medium group-hover:text-primary transition-colors">
                                {req.tenant?.name || "Unknown Community"}
                              </CardTitle>
                              <CardDescription className="font-mono text-xs flex items-center gap-1.5">
                                <span className="text-primary/70">iq.app/</span>
                                {req.tenant?.slug || "..."}
                              </CardDescription>
                            </div>
                            <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <Building2 className="h-5 w-5" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6 flex-1 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex items-center gap-4 text-sm text-foreground/70 font-sans">
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck className="h-4 w-4 text-primary/60" />
                                <span className="capitalize">{req.role}</span>
                              </div>
                              <div className="h-1 w-1 rounded-full bg-border" />
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4 text-primary/60" />
                                {format(new Date(req.joinedAt), "MMM d, yyyy")}
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                              {getStatusBadge(req.status)}
                              {req.status === "active" && (
                                <Button variant="ghost" size="sm" asChild className="text-primary font-bold hover:bg-primary/5">
                                  <Link href={`/community?tenantId=${req.tenantId}`} className="flex items-center gap-1.5">
                                    Visit Community
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                </Button>
                              )}
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
                  className="flex flex-col items-center justify-center py-20 px-4"
                >
                  <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-primary mb-6">
                    <Sparkles className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-serif font-medium mb-2">No applications yet</h3>
                  <p className="text-foreground/70 text-center max-w-sm mb-8 font-sans">
                    Explore and apply to join communities in the network.
                  </p>
                  <Button asChild className="bg-primary hover:bg-chart-2 text-primary-foreground font-sans font-semibold h-12 px-8">
                    <Link href="/join-community" className="flex items-center gap-2">
                      Browse Communities
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
