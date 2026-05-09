"use client";

import { useEffect, useState, useMemo } from "react";
import { SortingState } from "@tanstack/react-table";
import { Loader2, UserPlus } from "lucide-react";
import { TenantMember, TenantRole } from "@/lib/types/tenant";
import {
  getTenantMembersPaginatedAction,
  updateJoinRequestAction,
  removeMemberFromTenantAction
} from "@/app/actions/tenant-member";
import { useCommunityManagement } from "@/components/community/community-management-context";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { DataTable } from "@/components/custom/data-table";
import { getColumns } from "./columns";
import { Button } from "@/components/ui/button";
import { EditMemberDialog } from "@/components/community/edit-member-dialog";
import { RemoveMemberDialog } from "@/components/community/remove-member-dialog";
import { toast } from "sonner";

const SEARCH_DEBOUNCE_MS = 400;

export default function MemberManagementPage() {
  const { selectedTenantId, isLoading: contextLoading } = useCommunityManagement();

  const [data, setData] = useState<{ members: TenantMember[]; pageCount: number }>({
    members: [],
    pageCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  const [refreshCounter, setRefreshCounter] = useState(0);
  const handleRefresh = () => setRefreshCounter((prev) => prev + 1);

  const debouncedFilter = useDebouncedValue(filter, SEARCH_DEBOUNCE_MS);

  // Sync state for dialogs
  const [editingMember, setEditingMember] = useState<TenantMember | null>(null);
  const [removingMember, setRemovingMember] = useState<TenantMember | null>(null);
  const [selectedRole, setSelectedRole] = useState<TenantRole>("member");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (contextLoading || !selectedTenantId) return;

    let cancelled = false;
    setIsLoading(true);

    getTenantMembersPaginatedAction({
      tenantId: selectedTenantId,
      pageIndex,
      pageSize,
      query: debouncedFilter,
      sort: sorting[0]
        ? { id: sorting[0].id, desc: sorting[0].desc }
        : undefined,
    }).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setData({ members: result.members, pageCount: result.pageCount });
      } else {
        toast.error(result.error || "Failed to load members");
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    pageIndex,
    debouncedFilter,
    sorting,
    refreshCounter,
    selectedTenantId,
    contextLoading,
  ]);

  const handleUpdateRole = async () => {
    if (!editingMember) return;
    setIsProcessing(true);
    const result = await updateJoinRequestAction(editingMember.id, "active", selectedRole);
    if (result.success) {
      toast.success(`Updated ${editingMember.user?.fullName}'s role to ${selectedRole}`);
      handleRefresh();
      setEditingMember(null);
    } else {
      toast.error(result.error || "Failed to update role");
    }
    setIsProcessing(false);
  };

  const handleRemoveMember = async () => {
    if (!removingMember) return;
    setIsProcessing(true);
    const result = await removeMemberFromTenantAction(removingMember.id);
    if (result.success) {
      toast.success(`Removed ${removingMember.user?.fullName} from community`);
      handleRefresh();
      setRemovingMember(null);
    } else {
      toast.error(result.error || "Failed to remove member");
    }
    setIsProcessing(false);
  };

  const columns = useMemo(
    () =>
      getColumns(
        (member) => {
          setEditingMember(member);
          setSelectedRole(member.role);
        },
        (member) => setRemovingMember(member)
      ),
    []
  );

  if (contextLoading && !selectedTenantId) {
    return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-serif font-medium">Member Directory</h2>
          <p className="text-sm text-muted-foreground">Manage roles and permissions for everyone in your node.</p>
        </div>
        <Button variant="outline" className="rounded-xl border-primary/20 text-primary hover:bg-primary/5 gap-2">
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      </div>

      <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
        <DataTable
          columns={columns}
          data={data.members}
          pageCount={data.pageCount}
          onPageChange={setPageIndex}
          onSortChange={setSorting}
          onFilterChange={setFilter}
          onRefresh={handleRefresh}
          isLoading={isLoading}
          pageIndex={pageIndex}
          pageSize={pageSize}
          sorting={sorting}
        />
      </div>

      <EditMemberDialog
        member={editingMember}
        isOpen={!!editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
        onConfirm={handleUpdateRole}
        isProcessing={isProcessing}
      />

      <RemoveMemberDialog
        member={removingMember}
        isOpen={!!removingMember}
        onOpenChange={(open) => !open && setRemovingMember(null)}
        onConfirm={handleRemoveMember}
        isProcessing={isProcessing}
      />
    </div>
  );
}
