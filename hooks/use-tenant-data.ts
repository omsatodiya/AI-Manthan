"use client";

import { useEffect, useState } from "react";
import { getTenantMembersAction } from "@/app/actions/user";
import { TenantMember } from "@/lib/types";

interface RawTenantMember {
  id: string;
  user_id: string;
  tenant_id: string;
  role: "owner" | "member";
  created_at: string;
  tenants: {
    id: string;
    name: string;
    slug: string;
    created_at: string;
  }[] | null;
}

interface UseTenantDataReturn {
  tenantMembers: TenantMember[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTenantData(): UseTenantDataReturn {
  const [tenantMembers, setTenantMembers] = useState<TenantMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getTenantMembersAction();

      if (!result.success) {
        console.error("Error:", result.error);
        setError(result.error || "Unknown error");
        return;
      }

      const transformedMembers = (result.tenantMembers || []).map(
        (member: RawTenantMember) => ({
          id: member.id,
          userId: member.user_id,
          tenantId: member.tenant_id,
          role: member.role,
          joinedAt: member.created_at,
          tenant: member.tenants && member.tenants.length > 0
            ? {
                id: member.tenants[0].id,
                name: member.tenants[0].name,
                slug: member.tenants[0].slug,
                createdAt: member.tenants[0].created_at,
                updatedAt: member.tenants[0].created_at,
              }
            : null,
        })
      );

      setTenantMembers(transformedMembers);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError(
        `Unexpected error: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  return {
    tenantMembers,
    loading,
    error,
    refetch: fetchTenants,
  };
}
