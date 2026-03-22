"use client";

import { getCurrentUserAction } from "@/app/actions/auth";
import type { AuthUser } from "@/lib/types";

const TTL_MS = 30_000;

let cached: { user: AuthUser | null; at: number } | null = null;
let inflight: Promise<AuthUser | null> | null = null;

export async function getCurrentUserCached(): Promise<AuthUser | null> {
  const now = Date.now();
  if (cached && now - cached.at < TTL_MS) {
    return cached.user;
  }
  if (!inflight) {
    inflight = getCurrentUserAction().then((user) => {
      cached = { user, at: Date.now() };
      inflight = null;
      return user;
    });
  }
  return inflight;
}

export function invalidateCurrentUserCache() {
  cached = null;
  inflight = null;
}
