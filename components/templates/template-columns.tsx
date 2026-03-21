"use client";

import Link from "next/link";
import { FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Template } from "@/constants/templates";
import { ColumnDef } from "@tanstack/react-table";

export function getTemplateListColumns(): ColumnDef<Template>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
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
      cell: ({ row }) => {
        const description = row.getValue("description") as string;
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
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => {
        const date = new Date(row.original.created_at || "");
        return (
          <div className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      accessorKey: "fields",
      header: "Fields",
      cell: ({ row }) => (
        <div className="text-muted-foreground text-xs sm:text-sm text-center">
          {row.original.fields.length}
        </div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Link href={`/templates/${row.original.id}`}>
          <Button size="sm" className="h-7 sm:h-8 text-xs sm:text-sm">
            <ExternalLink className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Use Template</span>
            <span className="sm:hidden">Use</span>
          </Button>
        </Link>
      ),
    },
  ];
}
