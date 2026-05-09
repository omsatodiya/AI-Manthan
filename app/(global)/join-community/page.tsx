"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Search,
  Users,
  ArrowRight,
  Globe,
  ShieldCheck,
  Loader2,
  CheckCircle2,
  Zap,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getAllPublicCommunitiesAction,
  requestToJoinCommunityAction,
  getMyMembershipsAction
} from "@/app/actions/tenant-actions";
import { Tenant, TenantMember } from "@/lib/types/tenant";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function JoinCommunityPage() {
  const [communities, setCommunities] = useState<Tenant[]>([]);
  const [memberships, setMemberships] = useState<TenantMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [requestingId, setRequestingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [commResult, memberResult] = await Promise.all([
          getAllPublicCommunitiesAction(),
          getMyMembershipsAction()
        ]);

        if (commResult.success && commResult.communities) {
          setCommunities(commResult.communities);
        }
        if (memberResult.success && memberResult.memberships) {
          setMemberships(memberResult.memberships);
        }
      } catch (error) {
        console.error("Failed to load community data:", error);
        toast.error("Failed to load communities. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleJoinRequest = async (tenantId: string, name: string) => {
    setRequestingId(tenantId);
    try {
      const result = await requestToJoinCommunityAction(tenantId);
      if (result.success) {
        toast.success(`Request sent to ${name}!`);
        // Update local memberships state to show "Pending" immediately
        if (result.member) {
          setMemberships(prev => [...prev, result.member as TenantMember]);
        }
      } else {
        toast.error(result.error || "Failed to send request.");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    } finally {
      setRequestingId(null);
    }
  };

  const getMembershipStatus = (tenantId: string) => {
    const membership = memberships.find(m => m.tenantId === tenantId);
    return membership ? membership.status : null;
  };

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] dark:from-[#0b0e14] dark:via-[#111827] dark:to-[#0b1220] pb-20 pt-24">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

      <div className="container mx-auto max-w-6xl px-4 relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <Badge variant="outline" className="mb-4 py-1 px-4 bg-primary/5 text-primary border-primary/20 font-sans font-medium rounded-full">
            <Globe className="w-3 h-3 mr-2" />
            Global Network Discovery
          </Badge>
          <h1 className="text-4xl md:text-5xl font-serif font-medium mb-4 tracking-tight">
            Discover Your <span className="text-primary italic font-sans font-bold">Community</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Browse through verified public communities and request to join the ones that align with your mission.
          </p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-xl mx-auto mb-16"
        >
          <div className="relative group">
            <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl transition-all duration-500 group-hover:bg-primary/30 opacity-0 group-focus-within:opacity-100" />
            <div className="relative flex items-center bg-card border border-border/50 rounded-2xl p-2 shadow-sm focus-within:ring-2 ring-primary/20 transition-all">
              <Search className="w-5 h-5 ml-3 text-muted-foreground" />
              <Input
                placeholder="Search by name, slug or description..."
                className="border-0 focus-visible:ring-0 text-lg bg-transparent font-sans"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {filteredCommunities.length > 0 && (
                <Badge variant="secondary" className="mr-2 font-mono text-[10px]">
                  {filteredCommunities.length} FOUND
                </Badge>
              )}
            </div>
          </div>
        </motion.div>

        {/* Communities Grid */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-64 rounded-3xl bg-muted/20 animate-pulse border border-border/50" />
              ))}
            </motion.div>
          ) : filteredCommunities.length > 0 ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredCommunities.map((community, index) => {
                const status = getMembershipStatus(community.id);
                const isPending = status === "pending";
                const isActive = status === "active";
                const isRejected = status === "rejected";
                const isRequesting = requestingId === community.id;

                return (
                  <motion.div
                    key={community.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ y: -5 }}
                  >
                    <Card className="group h-full bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5">
                      <CardHeader className="pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                            <Building2 className="w-6 h-6" />
                          </div>
                          {isActive && (
                            <Badge className="bg-chart-2/10 text-chart-2 border-chart-2/20 rounded-full font-sans">
                              Active Member
                            </Badge>
                          )}
                          {isPending && (
                            <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 rounded-full font-sans">
                              Pending Approval
                            </Badge>
                          )}
                          {isRejected && (
                            <Badge variant="destructive" className="rounded-full font-sans">
                              Application Declined
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-2xl font-serif font-medium group-hover:text-primary transition-colors">
                          {community.name}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs text-primary/70">
                          @{community.slug}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed min-h-[4.5rem]">
                          {community.description || "No description provided. This community is focused on building sustainable networks and driving innovation through collaboration."}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-foreground/60 font-sans">
                          <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>Community Network</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-chart-2" />
                            <span>Verified Node</span>
                          </div>
                        </div>

                        <Button
                          className={cn(
                            "w-full rounded-xl h-12 font-sans font-bold transition-all",
                            isActive
                              ? "bg-secondary text-foreground hover:bg-secondary/80"
                              : isPending
                                ? "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100"
                                : "bg-primary hover:bg-chart-2 shadow-lg shadow-primary/10"
                          )}
                          disabled={isActive || isPending || isRejected || isRequesting}
                          onClick={() => handleJoinRequest(community.id, community.name)}
                        >
                          {isRequesting ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : isActive ? (
                            <span className="flex items-center gap-2">
                              Already a Member <CheckCircle2 className="w-4 h-4" />
                            </span>
                          ) : isPending ? (
                            "Request Pending..."
                          ) : isRejected ? (
                            "Access Restricted"
                          ) : (
                            <span className="flex items-center gap-2 group-hover:gap-3 transition-all">
                              Request to Join <ArrowRight className="w-4 h-4" />
                            </span>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 px-4 bg-card/30 backdrop-blur-sm border border-dashed border-border/50 rounded-[3rem]"
            >
              <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center mb-6 text-primary animate-bounce">
                <Search className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-serif font-medium mb-2 text-center">No Communities Found</h3>
              <p className="text-muted-foreground text-center max-w-sm mb-8">
                We couldn&apos;t find any public communities matching your search criteria. Try using different keywords.
              </p>
              <Button variant="outline" onClick={() => setSearchQuery("")} className="rounded-xl px-8 h-12 font-sans font-bold">
                Clear Search Query
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            {
              icon: Zap,
              title: "Instant Discovery",
              desc: "Join high-performance networks with a single click. No complex onboarding required."
            },
            {
              icon: ShieldCheck,
              title: "Verified Nodes",
              desc: "Every community in our network is verified for authenticity and safety."
            },
            {
              icon: Sparkles,
              title: "Collaborative Growth",
              desc: "Unlock premium resources and network effects by joining specialized communities."
            }
          ].map((item, i) => (
            <div key={i} className="flex gap-4 p-6 bg-card/20 rounded-2xl border border-border/30">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif font-medium mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground font-sans">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
