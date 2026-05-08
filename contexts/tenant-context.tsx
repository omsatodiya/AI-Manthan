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
}

export function TenantProvider({ children }: TenantProviderProps) {
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeTenant = async () => {
      try {
        const savedTenantId = localStorage.getItem("selectedTenantId");

        if (savedTenantId) {
          setTenantIdState(savedTenantId);
        }
        // In Phase 1 we removed tenantId from the global session.
        // We now rely solely on localStorage or subdomain/middleware injection.
      } catch (error) {
        console.error("Error initializing tenant:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTenant();
  }, []);

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
