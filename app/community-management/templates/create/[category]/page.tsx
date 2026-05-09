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
import { useCommunityManagement } from "@/components/community/community-management-context";
import { motion } from "framer-motion";

export default function CommunityCreateTemplateCategoryPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedTenantId } = useCommunityManagement();
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
    router.push("/community-management/templates");
  };

  if (!category || category === "general") {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <p className="text-muted-foreground font-sans">Invalid category for creation.</p>
        <Button variant="outline" onClick={() => router.push("/community-management/templates")} className="rounded-xl">
          Back to templates
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-xl">
            <Link href="/community-management/templates">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif">
              New template
            </h1>
            <p className="text-muted-foreground text-sm sm:text-base font-sans">
              {meta?.label} - choose a starter layout
            </p>
          </div>
        </div>
      </div>

      {blueprints.length === 0 ? (
        <Card className="border-dashed rounded-3xl bg-card/50">
          <CardHeader>
            <CardTitle className="text-lg font-serif">No starters yet</CardTitle>
            <CardDescription className="font-sans">
              Blueprints for this category will appear here as we add them.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {blueprints.map((bp, i) => (
            <motion.button
              key={bp.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              type="button"
              onClick={() => {
                setSelectedBlueprint(bp);
                setCreateOpen(true);
              }}
              className="text-left rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Card
                className={cn(
                  "h-full transition-all hover:border-primary/50 hover:shadow-md cursor-pointer rounded-3xl border-border/50 bg-card/50 backdrop-blur-sm"
                )}
              >
                <CardHeader className="flex flex-row items-start gap-3 space-y-0 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm shadow-primary/5">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-lg font-serif leading-snug">
                      {bp.title}
                    </CardTitle>
                    <CardDescription className="text-sm font-sans leading-relaxed line-clamp-3">
                      {bp.description}
                    </CardDescription>
                    {bp.audience && (
                      <p className="text-xs font-bold text-primary/70 pt-2 uppercase tracking-widest">
                        {bp.audience === "either"
                          ? "Internal or external"
                          : bp.audience}
                      </p>
                    )}
                  </div>
                </CardHeader>
              </Card>
            </motion.button>
          ))}
        </div>
      )}

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
          // Support for decentralized tenantId
          tenantId={selectedTenantId}
        />
      )}
    </div>
  );
}
