import { userFunctions } from "./user";
import { userInfoFunctions } from "./user-info";
import { tenantFunctions } from "./tenant";
import { tenantApplicationFunctions } from "./tenant-application";
import { announcementFunctions } from "./announcement";
import { announcementOpportunityFunctions } from "./announcement-opportunity";
import { DatabaseAdapter } from "../types/database";

export const SupabaseAdapter: DatabaseAdapter = {
  ...userFunctions,
  ...userInfoFunctions,
  ...tenantFunctions,
  ...tenantApplicationFunctions,
  ...announcementFunctions,
  ...announcementOpportunityFunctions,
};

export { userFunctions } from "./user";
export { userInfoFunctions } from "./user-info";
export { tenantFunctions } from "./tenant";
export { tenantApplicationFunctions } from "./tenant-application";
export { announcementFunctions } from "./announcement";
export { announcementOpportunityFunctions } from "./announcement-opportunity";
