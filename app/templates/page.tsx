"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useTenant } from "@/contexts/tenant-context";
import { getTemplatesAction } from "@/app/actions/templates";
import {
  readTemplatesCache,
  writeTemplatesCache,
} from "@/lib/templates-client-cache";
import { Template } from "@/constants/templates";
import {
  TEMPLATE_CATEGORIES,
  getCategoryMeta,
  type TemplateCategoryId,
} from "@/constants/templates/categories";
import { cn } from "@/lib/utils";

export default function TemplateSelectionPage() {
  const { tenantId, isLoading: tenantLoading } = useTenant();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const GeneralIcon = getCategoryMeta("general")!.icon;

  const countsByCategory = useMemo(() => {
    const map: Record<TemplateCategoryId, number> = {
      "sales-revenue": 0,
      "finance-leadership": 0,
      "operations-delivery": 0,
      general: 0,
    };
    for (const t of templates) {
      const c = (t.category ?? "general") as TemplateCategoryId;
      if (c in map) map[c] += 1;
      else map.general += 1;
    }
    return map;
  }, [templates]);

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
            <Link href="/">
              <Button variant="ghost" className="mb-2 sm:mb-4 hover:bg-muted/50">
                <ArrowLeft className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
          </div>

          <div className="text-center mb-8 sm:mb-10">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight text-foreground mb-3 sm:mb-4 font-sans">
              Document Templates
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto px-4 font-sans">
              Choose a category, then pick a template to create AI-assisted
              documents for your business
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-2 max-w-5xl mx-auto">
          {TEMPLATE_CATEGORIES.filter((c) => c.id !== "general").map(
            (cat) => {
              const Icon = cat.icon;
              const count = countsByCategory[cat.id];
              return (
                <Link
                  key={cat.id}
                  href={`/templates/${cat.id}`}
                  className="group block"
                >
                  <Card
                    className={cn(
                      "h-full border-0 shadow-lg transition-all duration-200",
                      "hover:shadow-xl hover:border-primary/20 hover:bg-muted/30"
                    )}
                  >
                    <CardHeader className="space-y-3 sm:space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0 group-hover:bg-primary/15 transition-colors">
                          <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <CardTitle className="text-lg sm:text-xl font-semibold font-sans leading-tight">
                            {cat.label}
                          </CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
                            {count} template{count === 1 ? "" : "s"}
                          </p>
                        </div>
                      </div>
                      <CardDescription className="text-sm sm:text-base leading-relaxed font-sans text-left pl-0 sm:pl-[4.5rem]">
                        {cat.shortDescription}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            }
          )}
        </div>

        {countsByCategory.general > 0 && (
          <div className="max-w-5xl mx-auto mt-8">
            <Link href="/templates/general" className="block">
              <Card className="border border-dashed shadow-sm hover:bg-muted/20 transition-colors">
                <CardHeader className="flex flex-row items-center gap-4 py-4">
                  <div className="rounded-lg bg-muted p-2">
                    <GeneralIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-left">
                    <CardTitle className="text-base font-medium">
                      General
                    </CardTitle>
                    <CardDescription>
                      {countsByCategory.general} uncategorized template
                      {countsByCategory.general === 1 ? "" : "s"}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
