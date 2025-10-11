"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Tenant } from "@/lib/types";

interface TenantContextType {
  tenantId: string | null;
  setTenantId: (tenantId: string) => void;
  isLoading: boolean;
  availableTenants: Pick<Tenant, "id" | "name" | "slug">[];
  setAvailableTenants: (
    tenants: Pick<Tenant, "id" | "name" | "slug">[]
  ) => void;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: React.ReactNode;
  availableTenants?: Pick<Tenant, "id" | "name" | "slug">[];
}

export function TenantProvider({
  children,
  availableTenants: initialTenants = [],
}: TenantProviderProps) {
  const [tenantId, setTenantIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableTenants, setAvailableTenants] =
    useState<Pick<Tenant, "id" | "name" | "slug">[]>(initialTenants);

  useEffect(() => {
    const savedTenantId = localStorage.getItem("selectedTenantId");

    let subdomainSlug: string | null = null;
    if (typeof window !== "undefined") {
      const host = window.location.host.split(":")[0];
      const parts = host.split(".");
      if (parts.length > 2) {
        const first = parts[0].toLowerCase();
        if (first !== "www") subdomainSlug = first;
      }
    }

    const tenantFromSubdomain = subdomainSlug
      ? availableTenants.find((t) => t.slug?.toLowerCase() === subdomainSlug)
      : undefined;

    if (tenantFromSubdomain) {
      setTenantIdState(tenantFromSubdomain.id);
      localStorage.setItem("selectedTenantId", tenantFromSubdomain.id);
    } else if (
      savedTenantId &&
      availableTenants.some((tenant) => tenant.id === savedTenantId)
    ) {
      setTenantIdState(savedTenantId);
    } else if (availableTenants.length > 0) {
      const firstTenantId = availableTenants[0].id;
      setTenantIdState(firstTenantId);
      localStorage.setItem("selectedTenantId", firstTenantId);
    }

    setIsLoading(false);
  }, [availableTenants]);

  const setTenantId = (newTenantId: string) => {
    setTenantIdState(newTenantId);
    localStorage.setItem("selectedTenantId", newTenantId);
  };

  const value: TenantContextType = {
    tenantId,
    setTenantId,
    isLoading,
    availableTenants,
    setAvailableTenants,
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
