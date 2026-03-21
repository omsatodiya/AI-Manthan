"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/custom/data-table";
import { Template } from "@/constants/templates";
import { SortingState, Updater } from "@tanstack/react-table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTenant } from "@/contexts/tenant-context";
import { getTemplatesAction } from "@/app/actions/templates";
import {
  invalidateTemplatesCache,
  readTemplatesCache,
  writeTemplatesCache,
} from "@/lib/templates-client-cache";
import { getTemplateListColumns } from "@/components/templates/template-columns";
import {
  getCategoryMeta,
  type TemplateCategoryId,
} from "@/constants/templates/categories";

interface TemplateCategoryListPageProps {
  category: TemplateCategoryId;
}

export function TemplateCategoryListPage({
  category,
}: TemplateCategoryListPageProps) {
  const { tenantId, isLoading: tenantLoading } = useTenant();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");

  const columns = useMemo(() => getTemplateListColumns(), []);

  useEffect(() => {
    if (tenantLoading || !tenantId) {
      return;
    }

    const cached = readTemplatesCache(tenantId);
    if (cached) {
      setTemplates(cached);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    (async () => {
      try {
        const result = await getTemplatesAction(tenantId);
        if (cancelled) return;
        if (result.success && result.data) {
          setTemplates(result.data);
          writeTemplatesCache(tenantId, result.data);
        } else {
          setTemplates([]);
        }
      } catch {
        if (!cancelled) setTemplates([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantId, tenantLoading]);

  const categoryTemplates = useMemo(() => {
    return templates.filter((t) => (t.category ?? "general") === category);
  }, [templates, category]);

  const filteredTemplates = categoryTemplates.filter(
    (template) =>
      template.title.toLowerCase().includes(filter.toLowerCase()) ||
      template.description.toLowerCase().includes(filter.toLowerCase())
  );

  const pageCount = Math.ceil(filteredTemplates.length / pageSize);
  const paginatedTemplates = filteredTemplates.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize
  );

  const handlePageChange = (newPageIndex: number) => {
    setPageIndex(newPageIndex);
  };

  const handleSortChange = (updater: Updater<SortingState>) => {
    setSorting(updater);
  };

  const handleFilterChange = (newFilter: string) => {
    setFilter(newFilter);
    setPageIndex(0);
  };

  const handleRefresh = async () => {
    setFilter("");
    setPageIndex(0);
    setSorting([]);

    if (tenantId) {
      invalidateTemplatesCache(tenantId);
      setIsLoading(true);
      try {
        const result = await getTemplatesAction(tenantId);
        if (result.success && result.data) {
          setTemplates(result.data);
          writeTemplatesCache(tenantId, result.data);
        } else {
          setTemplates([]);
        }
      } catch {
        setTemplates([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const meta = getCategoryMeta(category);

  if (tenantLoading || (isLoading && tenantId)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4 pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto mb-3 sm:mb-4"></div>
          <p className="text-muted-foreground text-sm sm:text-base">
            {tenantLoading ? "Loading tenant..." : "Loading templates..."}
          </p>
        </div>
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center px-4 pt-16">
        <div className="text-center">
          <p className="text-muted-foreground text-sm sm:text-base">
            No tenant selected. Please select a tenant to view templates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pt-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6">
            <Link href="/templates">
              <Button variant="ghost" className="mb-2 sm:mb-4 hover:bg-muted/50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">All categories</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>

          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground mb-2 font-sans">
              {meta?.label ?? "Templates"}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4 font-sans">
              {meta?.shortDescription}
            </p>
          </div>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl lg:text-2xl font-semibold font-sans">
              Templates in this category
            </CardTitle>
            <CardDescription className="text-sm sm:text-base font-sans">
              Pick a template to generate and export your document
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-4 lg:px-6">
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={paginatedTemplates}
                pageCount={pageCount}
                onPageChange={handlePageChange}
                onSortChange={handleSortChange}
                onFilterChange={handleFilterChange}
                onRefresh={handleRefresh}
                isLoading={isLoading}
                pageIndex={pageIndex}
                pageSize={pageSize}
                sorting={sorting}
                searchPlaceholder="Search templates..."
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
