"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Loader2,
  MessageSquare,
  ShieldCheck
} from "lucide-react";
import {
  getPendingJoinRequestsAction,
  updateJoinRequestAction,
  deleteJoinRequestAction
} from "@/app/actions/tenant-member";
import { TenantMember, TenantRole } from "@/lib/types/tenant";
import { useCommunityManagement } from "@/components/community/community-management-context";
import { DataTable } from "@/components/custom/data-table";
import { getRequestColumns } from "./columns";
import { EditMemberDialog } from "@/components/community/edit-member-dialog";
import { toast } from "sonner";
import { Check } from "lucide-react";

export default function JoinRequestsPage() {
  const { selectedTenantId, managedTenants, isLoading: contextLoading } = useCommunityManagement();

  const [requests, setRequests] = useState<TenantMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Accept Dialog State
  const [acceptingMember, setAcceptingMember] = useState<TenantMember | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [refreshCounter, setRefreshCounter] = useState(0);
  const handleRefresh = useCallback(() => setRefreshCounter(prev => prev + 1), []);

  const fetchRequests = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    setIsLoading(true);
    try {
      const result = await getPendingJoinRequestsAction(tenantId);
      if (result.success && result.requests) {
        setRequests(result.requests);
      } else {
        toast.error(result.error || "Failed to load requests");
      }
    } catch {
      console.error("fetchRequests error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTenantId) {
      fetchRequests(selectedTenantId);
    }
  }, [selectedTenantId, fetchRequests, refreshCounter]);

  const handleAccept = async (role: TenantRole) => {
    if (!acceptingMember) return;
    setIsProcessing(true);
    try {
      const result = await updateJoinRequestAction(acceptingMember.id, "active", role);
      if (result.success) {
        toast.success(`Accepted ${acceptingMember.user?.fullName} as ${role}`);
        handleRefresh();
        setAcceptingMember(null);
      } else {
        toast.error(result.error || "Failed to accept request");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = useCallback(async (member: TenantMember) => {
    if (!confirm(`Are you sure you want to reject ${member.user?.fullName}'s request?`)) return;
    try {
      const result = await updateJoinRequestAction(member.id, "rejected", "member");
      if (result.success) {
        toast.success(`Rejected request from ${member.user?.fullName}`);
        handleRefresh();
      } else {
        toast.error(result.error || "Failed to reject request");
      }
    } catch {
      toast.error("An unexpected error occurred");
    }
  }, [handleRefresh]);

  const handleDelete = useCallback(async (member: TenantMember) => {
    if (!confirm(`Are you sure you want to permanently delete ${member.user?.fullName}'s request?`)) return;
    try {
      const result = await deleteJoinRequestAction(member.id);
      if (result.success) {
        toast.success(`Deleted request from ${member.user?.fullName}`);
        handleRefresh();
      } else {
        toast.error(result.error || "Failed to delete request");
      }
    } catch {
      toast.error("An unexpected error occurred");
    }
  }, [handleRefresh]);

  const columns = useMemo(() => getRequestColumns(
    (m) => setAcceptingMember(m),
    handleReject,
    handleDelete
  ), [handleReject, handleDelete]);

  const currentTenant = managedTenants.find(t => t.id === selectedTenantId);

  if (contextLoading && !selectedTenantId) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
        <p className="text-muted-foreground font-serif text-lg animate-pulse">Syncing with global network...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-medium tracking-tight">Onboarding Requests</h1>
          <p className="text-muted-foreground mt-1">
            Review and approve new members for <span className="text-foreground font-medium">{currentTenant?.name || "your node"}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Unified Info Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[2rem] bg-gradient-to-br from-primary/90 to-primary text-primary-foreground p-8 shadow-2xl shadow-primary/20 relative overflow-hidden group border border-white/10"
          >
            <div className="absolute -top-4 -right-4 p-4 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
              <Users className="h-28 w-28" />
            </div>
            
            <div className="relative z-10">
              <h3 className="text-sm font-medium opacity-80 uppercase tracking-widest mb-4">Pending Approval</h3>
              <div className="text-6xl font-bold font-sans tracking-tighter mb-4">
                {isLoading ? (
                  <Loader2 className="h-10 w-10 animate-spin" />
                ) : requests.length}
              </div>
              <div className="h-1 w-12 bg-white/30 rounded-full mb-4" />
              <p className="text-sm opacity-90 leading-relaxed font-sans">
                Awaiting administrative decision to join the network.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-md p-8 space-y-6 shadow-sm"
          >
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground ml-1">Onboarding Tips</h4>
            <div className="space-y-6">
              <div className="flex gap-4 group">
                <div className="h-10 w-10 rounded-2xl bg-chart-2/10 flex items-center justify-center text-chart-2 shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Instant Access</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Accepted members gain immediate node privileges.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 group">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Role Delegation</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Assign precise roles to control network authority.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-card/40 backdrop-blur-md border border-border/50 rounded-[2.5rem] p-12 flex flex-col items-center justify-center space-y-4 min-h-[400px]"
              >
                <Loader2 className="h-10 w-10 animate-spin text-primary/30" />
                <p className="text-muted-foreground animate-pulse">Retrieving member queue...</p>
              </motion.div>
            ) : requests.length > 0 ? (
              <motion.div
                key="table"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card/40 backdrop-blur-md border border-border/50 rounded-[2.5rem] overflow-hidden shadow-xl"
              >
                <div className="p-2">
                  <DataTable
                    columns={columns}
                    data={requests}
                    pageCount={1}
                    onPageChange={() => { }}
                    onSortChange={() => { }}
                    onFilterChange={() => { }}
                    onRefresh={handleRefresh}
                    isLoading={isLoading}
                    pageIndex={0}
                    pageSize={100}
                    sorting={[]}
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex flex-col items-center justify-center py-24 px-8 bg-card/40 backdrop-blur-md rounded-[2.5rem] border border-dashed border-border/80 shadow-inner relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />
                <div className="relative z-10 flex flex-col items-center">
                  <div className="h-24 w-24 rounded-[2rem] bg-secondary flex items-center justify-center text-primary/30 mb-8 shadow-inner ring-1 ring-white/10">
                    <MessageSquare className="h-12 w-12" />
                  </div>
                  <h3 className="text-3xl font-serif font-medium mb-3 tracking-tight">Queue is Empty</h3>
                  <p className="text-muted-foreground text-center max-w-sm leading-relaxed text-lg font-light">
                    You&apos;re all caught up. No pending applications require your attention at this time.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Onboarding Dialog */}
      <EditMemberDialog
        member={acceptingMember}
        isOpen={!!acceptingMember}
        onOpenChange={(open) => !open && setAcceptingMember(null)}
        onConfirm={handleAccept}
        isProcessing={isProcessing}
      />
    </div>
  );
}
