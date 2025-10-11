import { userFunctions } from "./user";
import { userInfoFunctions } from "./user-info";
import { tenantFunctions } from "./tenant";
import { announcementFunctions } from "./announcement";
import { announcementOpportunityFunctions } from "./announcement-opportunity";
import { DatabaseAdapter } from "../types/database";

export const SupabaseAdapter: DatabaseAdapter = {
  ...userFunctions,
  ...userInfoFunctions,
  ...tenantFunctions,
  ...announcementFunctions,
  ...announcementOpportunityFunctions,
};

export { userFunctions } from "./user";
export { userInfoFunctions } from "./user-info";
export { tenantFunctions } from "./tenant";
export { announcementFunctions } from "./announcement";
export { announcementOpportunityFunctions } from "./announcement-opportunity";
