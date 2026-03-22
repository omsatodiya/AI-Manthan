import type { Template } from "./index";
import type { TemplateCategoryId } from "./categories";
import { SALES_REVENUE_BLUEPRINTS } from "./sales";
import { FINANCE_LEADERSHIP_BLUEPRINTS } from "./finance";
import { OPERATIONS_DELIVERY_BLUEPRINTS } from "./operations";

export function getBlueprintsForCategory(
  category: TemplateCategoryId
): Template[] {
  switch (category) {
    case "sales-revenue":
      return SALES_REVENUE_BLUEPRINTS;
    case "finance-leadership":
      return FINANCE_LEADERSHIP_BLUEPRINTS;
    case "operations-delivery":
      return OPERATIONS_DELIVERY_BLUEPRINTS;
    default:
      return [];
  }
}
