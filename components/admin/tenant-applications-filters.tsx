"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Search, Filter, ListOrdered } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

export function TenantApplicationsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentLimit = searchParams.get("limit") || "10";
  const currentStatus = searchParams.get("status") || "all";

  const [searchTerm, setSearchTerm] = useState(currentSearch);
  const debouncedSearch = useDebouncedValue(searchTerm, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (debouncedSearch) {
      params.set("search", debouncedSearch);
    } else {
      params.delete("search");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }, [debouncedSearch, pathname, router, searchParams]);

  const handleLimitChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("limit", value);
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleStatusChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === "all") {
      params.delete("status");
    } else {
      params.set("status", value);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="relative w-full md:w-96 group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/30 group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="Search organizations or slugs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 pl-10 pr-4 bg-card border border-border/70 rounded-xl font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
        />
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="flex items-center gap-2 bg-card border border-border/70 rounded-xl px-3 h-11">
          <ListOrdered className="h-4 w-4 text-foreground/40" />
          <span className="text-xs font-sans font-medium text-foreground/60 whitespace-nowrap">Show</span>
          <Select value={currentLimit} onValueChange={handleLimitChange}>
            <SelectTrigger className="border-0 bg-transparent focus:ring-0 h-8 w-[70px] font-sans text-xs font-bold p-0">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50">
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 bg-card border border-border/70 rounded-xl px-3 h-11 min-w-[160px]">
          <Filter className="h-4 w-4 text-foreground/40" />
          <Select value={currentStatus} onValueChange={handleStatusChange}>
            <SelectTrigger className="border-0 bg-transparent focus:ring-0 h-8 w-full font-sans text-xs font-bold p-0">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
