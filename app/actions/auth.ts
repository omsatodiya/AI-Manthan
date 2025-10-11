"use server";

import { cookies } from "next/headers";
import { jwtVerify, JWTPayload } from "jose";
import { getDb } from "@/lib/database";
import { AuthUser } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET;

export async function getCurrentUserAction(): Promise<AuthUser | null> {
  const db = await getDb();
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables.");
    }
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload }: { payload: JWTPayload } = await jwtVerify(token, secret);
    const userId = payload.userId as string;

    if (!userId) return null;

    const user = await db.findUserById(userId);

    if (!user) {
      cookieStore.delete("auth_token");
      return null;
    }

    return {
      id: user.id,
      name: user.fullName,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    console.error("Authentication error in server action:", error);
    cookieStore.delete("auth_token");
    return null;
  }
}

export async function logoutAction() {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("Logout failed");
    }

    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
  } catch (error) {
    console.error("Logout error:", error);

    const cookieStore = await cookies();
    cookieStore.delete("auth_token");
  }
}
