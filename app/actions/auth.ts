"use server";

import { cookies } from "next/headers";
import { AuthUser } from "@/lib/types";
import { getSessionUser } from "@/lib/auth/session";

export async function getCurrentUserAction(): Promise<AuthUser | null> {
  return getSessionUser();
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  return { success: true };
}
