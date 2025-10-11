"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTenantData } from "@/hooks/use-tenant-data";
import { useTenantSelection } from "@/hooks/use-tenant-selection";
import { TenantSelector, TenantCard, TenantBadge } from "./index";
import { useTenant } from "@/contexts/tenant-context";

/**
 * Demo component showing how to use the new tenant system
 * This demonstrates the modular and reusable nature of the components
 */
export function TenantDemo() {
  const { tenantMembers, loading, error, refetch } = useTenantData();
  const {
    selectedTenantId,
    setSelectedTenantId,
    availableTenants,
    currentTenant,
    isLoading,
  } = useTenantSelection(tenantMembers, loading, error);
  
  const { tenantId } = useTenant();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Tenant Data...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refetch}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Tenant Selector</CardTitle>
          <CardDescription>
            Choose which tenant you want to work with
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TenantSelector
            value={selectedTenantId || ""}
            onValueChange={setSelectedTenantId}
            tenants={availableTenants}
            currentTenantName={currentTenant?.tenant?.name}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Tenants</CardTitle>
          <CardDescription>
            All tenants you have access to
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableTenants.map((tenant) => (
              <TenantCard
                key={tenant.id}
                name={tenant.name}
                description={`Role: ${tenant.role}`}
                role={tenant.role}
                isSelected={tenant.id === selectedTenantId}
                onClick={() => setSelectedTenantId(tenant.id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Context</CardTitle>
          <CardDescription>
            Information about the currently selected tenant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Context Tenant ID:</span>
            <TenantBadge name={tenantId || "None"} variant="outline" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Selected Tenant ID:</span>
            <TenantBadge name={selectedTenantId || "None"} variant="outline" />
          </div>
          {currentTenant && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Current Tenant:</span>
              <TenantBadge 
                name={currentTenant.tenant?.name || "Unknown"} 
                role={currentTenant.role}
                showRole={true}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
