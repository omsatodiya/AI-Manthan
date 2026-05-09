"use client";

import { useEffect } from "react";
import { useTenant } from "@/contexts/tenant-context";

interface TenantHydratorProps {
  tenantId: string;
}

/**
 * TenantHydrator is a "headless" component that syncs the client-side 
 * TenantContext with the tenantId provided by the server-side layout.
 */
export function TenantHydrator({ tenantId }: TenantHydratorProps) {
  const { setTenantId, tenantId: currentTenantId } = useTenant();

  useEffect(() => {
    if (tenantId && tenantId !== currentTenantId) {
      setTenantId(tenantId);
    }
  }, [tenantId, currentTenantId, setTenantId]);

  return null;
}
