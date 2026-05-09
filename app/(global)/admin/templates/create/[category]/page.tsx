"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateTemplateDialog } from "@/components/admin/templates/create-template-dialog";
import { getBlueprintsForCategory } from "@/constants/templates/blueprints";
import {
  getCategoryMeta,
  isTemplateCategoryId,
} from "@/constants/templates/categories";
import type { Template } from "@/constants/templates";
import { cn } from "@/lib/utils";

export default function AdminCreateTemplateCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const categoryParam = params.category as string;

  const category = isTemplateCategoryId(categoryParam) ? categoryParam : null;
  const meta = category ? getCategoryMeta(category) : null;
  const blueprints = category ? getBlueprintsForCategory(category) : [];

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState<Template | null>(
    null
  );

  const handleCreated = () => {
    setCreateOpen(false);
    setSelectedBlueprint(null);
    router.push("/admin/templates");
  };

  if (!category || category === "general") {
    return (
      <main className="min-h-screen bg-secondary p-4 sm:p-6 md:p-8 dark:bg-background">
        <div className="mx-auto max-w-2xl text-center space-y-4 pt-16">
          <p className="text-muted-foreground">Invalid category for creation.</p>
          <Button variant="outline" onClick={() => router.push("/admin/templates")}>
            Back to templates
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-secondary p-4 sm:p-6 md:p-8 dark:bg-background">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/admin/templates">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif">
                New template
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                {meta?.label} - choose a starter layout
              </p>
            </div>
          </div>
        </div>

        {blueprints.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-lg">No starters yet</CardTitle>
              <CardDescription>
                Blueprints for this category will appear here as we add them.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {blueprints.map((bp) => (
              <button
                key={bp.id}
                type="button"
                onClick={() => {
                  setSelectedBlueprint(bp);
                  setCreateOpen(true);
                }}
                className="text-left rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Card
                  className={cn(
                    "h-full transition-all hover:border-primary/50 hover:shadow-md cursor-pointer"
                  )}
                >
                  <CardHeader className="flex flex-row items-start gap-3 space-y-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <CardTitle className="text-base leading-snug">
                        {bp.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed line-clamp-3">
                        {bp.description}
                      </CardDescription>
                      {bp.audience && (
                        <p className="text-xs text-muted-foreground pt-1 capitalize">
                          {bp.audience === "either"
                            ? "Internal or external"
                            : bp.audience}
                        </p>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </button>
            ))}
          </div>
        )}
      </div>

      {createOpen && selectedBlueprint && (
        <CreateTemplateDialog
          key={selectedBlueprint.id}
          open={createOpen}
          onOpenChange={(open) => {
            setCreateOpen(open);
            if (!open) setSelectedBlueprint(null);
          }}
          defaultBlueprint={selectedBlueprint}
          onTemplateCreated={handleCreated}
        />
      )}
    </main>
  );
}
