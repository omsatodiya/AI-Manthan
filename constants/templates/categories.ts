import { TrendingUp, Landmark, Cog, LayoutGrid } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type TemplateCategoryId =
  | "sales-revenue"
  | "finance-leadership"
  | "operations-delivery"
  | "general";

export type TemplateAudience = "external" | "internal" | "either";

export interface TemplateCategoryMeta {
  id: TemplateCategoryId;
  label: string;
  shortDescription: string;
  icon: LucideIcon;
}

export const TEMPLATE_CATEGORIES: TemplateCategoryMeta[] = [
  {
    id: "sales-revenue",
    label: "Sales & revenue",
    shortDescription:
      "Proposals, discovery summaries, SOWs, RFP responses, renewals — client-facing and pipeline docs.",
    icon: TrendingUp,
  },
  {
    id: "finance-leadership",
    label: "Finance & leadership",
    shortDescription:
      "Board updates, business reviews, budgets, investment memos, and executive narratives.",
    icon: Landmark,
  },
  {
    id: "operations-delivery",
    label: "Operations & delivery",
    shortDescription:
      "SOPs, project charters, incidents, vendors, and delivery runbooks.",
    icon: Cog,
  },
  {
    id: "general",
    label: "General",
    shortDescription: "Templates not assigned to a specific category.",
    icon: LayoutGrid,
  },
];

export function isTemplateCategoryId(value: string): value is TemplateCategoryId {
  return TEMPLATE_CATEGORIES.some((c) => c.id === value);
}

export function getCategoryMeta(
  id: TemplateCategoryId
): TemplateCategoryMeta | undefined {
  return TEMPLATE_CATEGORIES.find((c) => c.id === id);
}
