"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCheck,
  UserX,
  Trash2,
  Building2,
  Loader2,
  ShieldCheck,
  LayoutDashboard,
  Check
} from "lucide-react";
import {
  getManagedTenantsAction,
  getPendingJoinRequestsAction,
  updateJoinRequestAction,
  deleteJoinRequestAction
} from "@/app/actions/tenant-member";
import { Tenant, TenantMember, TenantRole } from "@/lib/types/tenant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";

export default function CommunityManagementPage() {
  const [managedTenants, setManagedTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [requests, setRequests] = useState<TenantMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestsLoading, setIsRequestsLoading] = useState(false);

  // Accept Dialog State
  const [acceptingMember, setAcceptingMember] = useState<TenantMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<TenantRole>("member");
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchManagedTenants = useCallback(async () => {
    setIsLoading(true);
    const result = await getManagedTenantsAction();
    if (result.success && result.tenants) {
      setManagedTenants(result.tenants);
      if (result.tenants.length > 0) {
        setSelectedTenantId(result.tenants[0].id);
      }
    } else {
      toast.error(result.error || "Failed to load communities");
    }
    setIsLoading(false);
  }, []);

  const fetchRequests = useCallback(async (tenantId: string) => {
    if (!tenantId) return;
    setIsRequestsLoading(true);
    const result = await getPendingJoinRequestsAction(tenantId);
    if (result.success && result.requests) {
      setRequests(result.requests);
    } else {
      toast.error(result.error || "Failed to load requests");
    }
    setIsRequestsLoading(false);
  }, []);

  useEffect(() => {
    fetchManagedTenants();
  }, [fetchManagedTenants]);

  useEffect(() => {
    if (selectedTenantId) {
      fetchRequests(selectedTenantId);
    }
  }, [selectedTenantId, fetchRequests]);

  const handleAccept = async () => {
    if (!acceptingMember) return;
    setIsProcessing(true);
    const result = await updateJoinRequestAction(acceptingMember.id, "active", selectedRole);
    if (result.success) {
      toast.success(`Accepted ${acceptingMember.user?.fullName} as ${selectedRole}`);
      setRequests(prev => prev.filter(r => r.id !== acceptingMember.id));
      setAcceptingMember(null);
    } else {
      toast.error(result.error || "Failed to accept request");
    }
    setIsProcessing(false);
  };

  const handleReject = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to reject ${name}'s request?`)) return;
    const result = await updateJoinRequestAction(memberId, "rejected", "member");
    if (result.success) {
      toast.success(`Rejected request from ${name}`);
      setRequests(prev => prev.filter(r => r.id !== memberId));
    } else {
      toast.error(result.error || "Failed to reject request");
    }
  };

  const handleDelete = async (memberId: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete ${name}'s request?`)) return;
    const result = await deleteJoinRequestAction(memberId);
    if (result.success) {
      toast.success(`Deleted request from ${name}`);
      setRequests(prev => prev.filter(r => r.id !== memberId));
    } else {
      toast.error(result.error || "Failed to delete request");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading management portal...</p>
      </div>
    );
  }

  if (managedTenants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
        <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-primary mb-6">
          <Building2 className="h-10 w-10" />
        </div>
        <h1 className="text-3xl font-serif font-medium mb-4">No Communities Managed</h1>
        <p className="text-muted-foreground max-w-md mb-8">
          You don&apos;t currently have owner or admin permissions for any communities.
          If you believe this is an error, please contact the system administrator.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#f8fafc] dark:from-[#0b0e14] dark:via-[#111827] dark:to-[#0b1220] pb-20 pt-24">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="h-3 w-3" />
              Management Portal
            </div>
            <h1 className="text-4xl sm:text-5xl font-serif font-medium tracking-tight text-foreground">
              Community <span className="text-primary italic font-sans font-bold">Management</span>
            </h1>
            <p className="text-muted-foreground max-w-lg">
              Manage join requests, assign roles, and oversee your community&apos;s growth.
            </p>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20 overflow-hidden relative group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                <Users className="h-24 w-24" />
              </div>
              <CardHeader className="relative">
                <CardTitle className="text-lg font-medium opacity-90">Pending Requests</CardTitle>
                <div className="text-5xl font-bold font-sans mt-2">
                  {isRequestsLoading ? (
                    <Loader2 className="h-8 w-8 animate-spin" />
                  ) : requests.length}
                </div>
              </CardHeader>
              <CardContent className="relative pt-0">
                <p className="text-sm opacity-80">
                  New members waiting for your approval to join {managedTenants.find(t => t.id === selectedTenantId)?.name}.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 flex-shrink-0">
                    <Check className="h-3 w-3" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Accepting</strong> a member will notify them via email and grant immediate access.
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 flex-shrink-0">
                    <ShieldCheck className="h-3 w-3" />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    <strong>Roles</strong> determine permissions. Admin/Owner roles can also manage other requests.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {isRequestsLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-card/50 rounded-2xl border animate-pulse" />
                  ))}
                </motion.div>
              ) : requests.length > 0 ? (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {requests.map((request, index) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="group hover:shadow-md transition-all duration-300 border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden rounded-2xl">
                        <CardContent className="p-0">
                          <div className="flex flex-col sm:flex-row items-center gap-4 p-5 sm:p-6">
                            <Avatar className="h-14 w-14 border-2 border-background shadow-sm ring-2 ring-primary/10">
                              <AvatarFallback className="bg-secondary text-primary font-bold">
                                {request.user?.fullName?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 text-center sm:text-left min-w-0">
                              <h3 className="font-serif font-medium text-lg truncate">
                                {request.user?.fullName}
                              </h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {request.user?.email}
                              </p>
                              <Badge variant="secondary" className="mt-2 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/10 border-none font-sans text-[10px] uppercase tracking-widest font-bold">
                                Pending Approval
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:ml-4">
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-chart-2 shadow-sm rounded-lg h-10 px-4 font-sans font-semibold gap-2"
                                onClick={() => setAcceptingMember(request)}
                              >
                                <UserCheck className="h-4 w-4" />
                                <span className="hidden sm:inline">Accept</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-200 text-red-600 hover:bg-red-50 text-red-600/90 hover:text-red-600 shadow-sm rounded-lg h-10 px-4 gap-2"
                                onClick={() => handleReject(request.id, request.user?.fullName || "User")}
                              >
                                <UserX className="h-4 w-4" />
                                <span className="hidden sm:inline">Reject</span>
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-lg h-10 w-10"
                                onClick={() => handleDelete(request.id, request.user?.fullName || "User")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-20 px-4 bg-card/50 rounded-3xl border border-dashed border-border/60"
                >
                  <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center text-primary mb-6">
                    <LayoutDashboard className="h-10 w-10" />
                  </div>
                  <h3 className="text-2xl font-serif font-medium mb-2">Clear Skies!</h3>
                  <p className="text-muted-foreground text-center max-w-sm mb-8">
                    No pending join requests for this community. Everyone&apos;s already in the loop!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Role Selection Dialog */}
      <Dialog open={!!acceptingMember} onOpenChange={(open) => !open && setAcceptingMember(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-primary p-8 text-primary-foreground relative overflow-hidden">
            <ShieldCheck className="absolute -bottom-4 -right-4 h-32 w-32 opacity-10" />
            <DialogHeader className="relative">
              <DialogTitle className="text-2xl font-serif">Assign Member Role</DialogTitle>
              <DialogDescription className="text-primary-foreground/80 mt-1">
                Choose the appropriate access level for <strong>{acceptingMember?.user?.fullName}</strong>.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">
                Select Role
              </label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as TenantRole)}>
                <SelectTrigger className="h-12 rounded-xl border-primary/20 bg-secondary/30">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="bg-secondary/50 p-4 rounded-2xl space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Role Description</p>
              <p className="text-sm text-foreground/80 leading-relaxed">
                {selectedRole === "owner" && "Full control over community settings, billing, and all members."}
                {selectedRole === "admin" && "Can manage members, content, and most community settings."}
                {selectedRole === "employee" && "Access to internal tools and content management."}
                {selectedRole === "member" && "Standard access to community features and content."}
              </p>
            </div>
          </div>
          <DialogFooter className="p-8 pt-0 flex sm:justify-between gap-3">
            <Button variant="ghost" className="rounded-xl h-12 px-6" onClick={() => setAcceptingMember(null)}>
              Cancel
            </Button>
            <Button
              className="bg-primary hover:bg-chart-2 rounded-xl h-12 px-8 font-sans font-bold flex-1 sm:flex-none"
              onClick={handleAccept}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserCheck className="mr-2 h-4 w-4" />}
              Complete Onboarding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
