import type { Template } from "./index";
import type { TemplateCategoryId } from "./categories";
import { SALES_REVENUE_BLUEPRINTS } from "./sales";

export function getBlueprintsForCategory(
  category: TemplateCategoryId
): Template[] {
  switch (category) {
    case "sales-revenue":
      return SALES_REVENUE_BLUEPRINTS;
    default:
      return [];
  }
}
