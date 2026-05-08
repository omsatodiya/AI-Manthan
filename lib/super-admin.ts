import { SessionUser } from "@/lib/types";
import { getCurrentUserAction } from "@/app/actions/auth";
import { redirect } from "next/navigation";

/**
 * Super Admin Configuration
 * Hardcoded credentials for the system super administrator.
 */
export const SUPER_ADMIN_CONFIG = {
  email: "omsatodiya96@gmail.com",
  // Note: Password is included as per requirements but should be handled by the auth provider
  // and is not typically validated in helper functions after session establishment.
  password: "OmPatel@22",
};

/**
 * Checks if a user is the super admin based on their email.
 * 
 * @param user - The session user object to validate
 * @returns boolean indicating if the user is a super admin
 */
export function isSuperAdmin(user: SessionUser | null | undefined): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === SUPER_ADMIN_CONFIG.email.toLowerCase();
}

/**
 * Ensures the current request is made by a super admin.
 * If not, it will redirect to the home page or throw an error.
 * 
 * @returns The authenticated super admin session user
 * @throws Error if not authenticated or not a super admin
 */
export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await getCurrentUserAction();

  if (!user) {
    redirect("/login");
  }

  if (!isSuperAdmin(user)) {
    // In a real app, you might redirect to a 403 Forbidden page
    redirect("/");
  }

  return user;
}
