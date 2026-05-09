"use client";

import { useState, useEffect, useMemo } from "react";
import { SortingState } from "@tanstack/react-table";
import {
  FileText,
  Plus,
  Loader2,
  Eye,
  Pencil,
  Trash2,
  ListFilter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DataTable } from "@/components/custom/data-table";
import { PickTemplateCategoryDialog } from "@/components/admin/templates/pick-template-category-dialog";
import { EditTemplateDialog } from "@/components/admin/templates/edit-template-dialog";
import { DeleteTemplateDialog } from "@/components/admin/templates/delete-template-dialog";
import { TemplatePreviewDialog } from "@/components/admin/templates/template-preview-dialog";
import { Template } from "@/constants/templates";
import {
  getCategoryMeta,
  TEMPLATE_CATEGORIES,
  type TemplateCategoryId,
} from "@/constants/templates/categories";
import { cn } from "@/lib/utils";
import { useCommunityManagement } from "@/components/community/community-management-context";
import { getTemplatesAction } from "@/app/actions/templates";
import { ColumnDef } from "@tanstack/react-table";
import {
  invalidateTemplatesCache,
  writeTemplatesCache,
} from "@/lib/templates-client-cache";
import { motion } from "framer-motion";

type CategoryFilter = "all" | TemplateCategoryId;

export default function CommunityTemplatesPage() {

  const { selectedTenantId, isLoading: contextLoading } = useCommunityManagement();
  const [allTemplates, setAllTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [sorting, setSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [filterPopoverOpen, setFilterPopoverOpen] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;

  const [refreshCounter, setRefreshCounter] = useState(0);
  const handleRefresh = () => {
    if (selectedTenantId) invalidateTemplatesCache(selectedTenantId);
    setRefreshCounter((prev) => prev + 1);
  };

  const [prevFilter, setPrevFilter] = useState("");
  useEffect(() => {
    if (filter !== prevFilter) {
      setPageIndex(0);
      setPrevFilter(filter);
    }
  }, [filter, prevFilter]);

  useEffect(() => {
    setPageIndex(0);
  }, [categoryFilter]);

  const [pickCategoryOpen, setPickCategoryOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);
  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<Template | null>(null);

  const data = useMemo(() => {
    let list = allTemplates;
    if (categoryFilter !== "all") {
      list = list.filter(
        (t) => (t.category ?? "general") === categoryFilter
      );
    }
    const q = filter.toLowerCase();
    list = list.filter(
      (template) =>
        template.title.toLowerCase().includes(q) ||
        (template.description ?? "").toLowerCase().includes(q)
    );
    return {
      templates: list,
      pageCount: Math.ceil(list.length / pageSize),
    };
  }, [allTemplates, filter, pageSize, categoryFilter]);

  useEffect(() => {
    if (!selectedTenantId || contextLoading) return;
    let cancelled = false;
    setIsLoading(true);
    getTemplatesAction(selectedTenantId).then((result) => {
      if (cancelled) return;
      if (result.success && result.data) {
        setAllTemplates(result.data);
        if (selectedTenantId) writeTemplatesCache(selectedTenantId, result.data);
      } else {
        setAllTemplates([]);
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedTenantId, contextLoading, refreshCounter]);

  const columns = useMemo(
    () =>
      [
        {
          accessorKey: "title",
          header: "Title",
          cell: ({ row }: { row: { getValue: (key: string) => string } }) => (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="font-semibold text-foreground text-sm sm:text-base min-w-0">
                <div className="truncate">{row.getValue("title")}</div>
              </div>
            </div>
          ),
        },
        {
          accessorKey: "description",
          header: "Description",
          cell: ({ row }: { row: { getValue: (key: string) => string } }) => {
            const description = (row.getValue("description") as string) ?? "";
            const truncatedDescription =
              description.length > 50
                ? `${description.substring(0, 50)}...`
                : description;

            return (
              <div className="text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-xs sm:max-w-md">
                {truncatedDescription}
              </div>
            );
          },
        },
        {
          accessorKey: "category",
          header: "Category",
          cell: ({ row }: { row: { original: Template } }) => {
            const cat = row.original.category ?? "general";
            const label = getCategoryMeta(cat)?.label ?? cat;
            return (
              <span className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
                {label}
              </span>
            );
          },
        },
        {
          id: "actions",
          header: () => (
            <div className="w-full text-center font-medium">Actions</div>
          ),
          cell: ({ row }: { row: { original: Template } }) => {
            const t = row.original;
            return (
              <div className="flex items-center justify-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Preview template"
                  onClick={() => setPreviewTemplate(t)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label="Edit template"
                  onClick={() => setEditTemplate(t)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete template"
                  onClick={() => setDeleteTemplate(t)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          },
        },
      ] as ColumnDef<Template>[],
    []
  );

  if (contextLoading && !selectedTenantId) {
    return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h2 className="text-2xl font-serif font-medium">Template Management</h2>
          <p className="text-sm text-muted-foreground">Create and manage standardized document templates for your community.</p>
        </div>
        <Button
          onClick={() => setPickCategoryOpen(true)}
          className="rounded-xl shadow-lg shadow-primary/20 gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </motion.div>

      <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
        {isLoading && allTemplates.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={data.templates}
            pageCount={data.pageCount}
            onPageChange={setPageIndex}
            onSortChange={setSorting}
            onFilterChange={setFilter}
            onRefresh={handleRefresh}
            isLoading={isLoading}
            pageIndex={pageIndex}
            pageSize={pageSize}
            sorting={sorting}
            searchPlaceholder="Search by title..."
            toolbarExtra={
              <Popover
                open={filterPopoverOpen}
                onOpenChange={setFilterPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    aria-label="Filter by category"
                    className={cn(
                      "rounded-xl",
                      categoryFilter !== "all" &&
                      "border-primary text-primary"
                    )}
                  >
                    <ListFilter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-2 rounded-2xl" align="start">
                  <div className="space-y-1">
                    <p className="px-2 py-1.5 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      Category
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCategoryFilter("all");
                        setFilterPopoverOpen(false);
                      }}
                      className={cn(
                        "flex w-full rounded-xl px-2 py-2 text-left text-sm hover:bg-muted transition-colors",
                        categoryFilter === "all" && "bg-muted font-medium text-primary"
                      )}
                    >
                      All categories
                    </button>
                    {TEMPLATE_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            setCategoryFilter(cat.id);
                            setFilterPopoverOpen(false);
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-sm hover:bg-muted transition-colors",
                            categoryFilter === cat.id && "bg-muted font-medium text-primary"
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="min-w-0">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            }
          />
        )}
      </div>

      <PickTemplateCategoryDialog
        open={pickCategoryOpen}
        onOpenChange={setPickCategoryOpen}
        // Passing a custom base path for creation
        createPathBase="/community-management/templates/create"
      />
      <TemplatePreviewDialog
        template={previewTemplate}
        open={previewTemplate !== null}
        onOpenChange={(open) => {
          if (!open) setPreviewTemplate(null);
        }}
      />
      {editTemplate && (
        <EditTemplateDialog
          template={editTemplate}
          onTemplateUpdated={handleRefresh}
          onOpenChange={() => setEditTemplate(null)}
          // We'll update EditTemplateDialog to accept an optional tenantId
          tenantId={selectedTenantId}
        />
      )}
      {deleteTemplate && (
        <DeleteTemplateDialog
          template={deleteTemplate}
          onTemplateDeleted={handleRefresh}
          onOpenChange={() => setDeleteTemplate(null)}
          // We'll update DeleteTemplateDialog to accept an optional tenantId
          tenantId={selectedTenantId}
        />
      )}
    </div>
  );
}
