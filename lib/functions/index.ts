import { userFunctions } from "./user";
import { userInfoFunctions } from "./user-info";
import { tenantFunctions } from "./tenant";
import { DatabaseAdapter } from "../types/database";

export const SupabaseAdapter: DatabaseAdapter = {
  ...userFunctions,
  ...userInfoFunctions,
  ...tenantFunctions,
};

export { userFunctions } from "./user";
export { userInfoFunctions } from "./user-info";
export { tenantFunctions } from "./tenant";
