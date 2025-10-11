"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Tenant } from "@/lib/types";
import { getCurrentUserAction } from "@/app/actions/auth";

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
          setIsLoading(false);
          return;
        }

        const currentUser = await getCurrentUserAction();

        if (currentUser?.tenantId) {
          setTenantIdState(currentUser.tenantId);
          localStorage.setItem("selectedTenantId", currentUser.tenantId);
        }
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
