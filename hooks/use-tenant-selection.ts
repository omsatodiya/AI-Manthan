"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/tenant-context";
import { TenantMember } from "@/lib/types";

interface UseTenantSelectionReturn {
  selectedTenantId: string | null;
  setSelectedTenantId: (tenantId: string) => void;
  availableTenants: Array<{ id: string; name: string; role: string }>;
  currentTenant: TenantMember | null;
  isLoading: boolean;
  error: string | null;
}

export function useTenantSelection(
  tenantMembers: TenantMember[],
  loading: boolean,
  error: string | null
): UseTenantSelectionReturn {
  const {
    tenantId,
    setTenantId,
    isLoading: tenantContextLoading,
  } = useTenant();
  const [selectedTenantId, setSelectedTenantIdState] = useState<string | null>(
    null
  );

  const availableTenants = tenantMembers.map((member) => ({
    id: member.tenantId,
    name: member.tenant?.name || `Tenant ${member.tenantId}`,
    role: member.role,
  }));

  const currentTenant =
    tenantMembers.find((member) => member.tenantId === tenantId) || null;

  useEffect(() => {
    if (!loading && !error && tenantMembers.length > 0) {
      if (!tenantId || !tenantMembers.some((m) => m.tenantId === tenantId)) {
        const firstTenantId = tenantMembers[0].tenantId;
        setTenantId(firstTenantId);
        setSelectedTenantIdState(firstTenantId);
      } else {
        setSelectedTenantIdState(tenantId);
      }
    }
  }, [tenantMembers, tenantId, setTenantId, loading, error]);

  useEffect(() => {
    setSelectedTenantIdState(tenantId);
  }, [tenantId]);

  const setSelectedTenantId = (newTenantId: string) => {
    setTenantId(newTenantId);
    setSelectedTenantIdState(newTenantId);
  };

  return {
    selectedTenantId,
    setSelectedTenantId,
    availableTenants,
    currentTenant,
    isLoading: loading || tenantContextLoading,
    error,
  };
}
