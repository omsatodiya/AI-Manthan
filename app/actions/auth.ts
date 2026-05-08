"use server";

import { cookies } from "next/headers";
import { SessionUser } from "@/lib/types/user";
import { getSessionUser } from "@/lib/auth/session";

export async function getCurrentUserAction(): Promise<SessionUser | null> {
  return getSessionUser();
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
  return { success: true };
}
