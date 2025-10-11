"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface TenantContextType {
  tenantId: string | null;
  setTenantId: (tenantId: string) => void;
  isLoading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: React.ReactNode;
  availableTenants?: Array<{ tenant_id: string; name?: string }>;
}

export function TenantProvider({
  children,
  availableTenants = [],
}: TenantProviderProps) {
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load tenant ID from localStorage on mount
  useEffect(() => {
    const savedTenantId = localStorage.getItem("selectedTenantId");

    if (
      savedTenantId &&
      availableTenants.some((tenant) => tenant.tenant_id === savedTenantId)
    ) {
      // Use saved tenant if it's still available
      setTenantIdState(savedTenantId);
    } else if (availableTenants.length > 0) {
      // Auto-select first tenant if no valid saved tenant
      const firstTenantId = availableTenants[0].tenant_id;
      setTenantIdState(firstTenantId);
      localStorage.setItem("selectedTenantId", firstTenantId);
    }

    setIsLoading(false);
  }, [availableTenants]);

  // Update localStorage when tenant changes
  const setTenantId = (newTenantId: string) => {
    setTenantIdState(newTenantId);
    localStorage.setItem("selectedTenantId", newTenantId);
  };

  const value: TenantContextType = {
    tenantId,
    setTenantId,
    isLoading,
  };

  return (
    <TenantContext.Provider value={value}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error("useTenant must be used within a TenantProvider");
  }
  return context;
}
