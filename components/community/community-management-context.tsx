"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Tenant } from "@/lib/types/tenant";
import { getManagedTenantsAction } from "@/app/actions/tenant-member";
import { toast } from "sonner";

interface CommunityManagementContextType {
  managedTenants: Tenant[];
  selectedTenantId: string;
  setSelectedTenantId: (id: string) => void;
  isLoading: boolean;
  refreshTenants: () => Promise<void>;
}

const CommunityManagementContext = createContext<CommunityManagementContextType | undefined>(undefined);

export function CommunityManagementProvider({ children }: { children: React.ReactNode }) {
  const [managedTenants, setManagedTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchManagedTenants = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getManagedTenantsAction();
      if (result.success && result.tenants) {
        setManagedTenants(result.tenants);
        if (result.tenants.length > 0 && !selectedTenantId) {
          setSelectedTenantId(result.tenants[0].id);
        }
      } else {
        toast.error(result.error || "Failed to load communities");
      }
    } catch (error) {
      console.error("fetchManagedTenants error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTenantId]);

  useEffect(() => {
    fetchManagedTenants();
  }, [fetchManagedTenants]);

  return (
    <CommunityManagementContext.Provider 
      value={{ 
        managedTenants, 
        selectedTenantId, 
        setSelectedTenantId, 
        isLoading,
        refreshTenants: fetchManagedTenants
      }}
    >
      {children}
    </CommunityManagementContext.Provider>
  );
}

export function useCommunityManagement() {
  const context = useContext(CommunityManagementContext);
  if (context === undefined) {
    throw new Error("useCommunityManagement must be used within a CommunityManagementProvider");
  }
  return context;
}
