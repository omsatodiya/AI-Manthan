"use client";

import { getCurrentUserAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/types";

const TTL_MS = 30_000;

let cached: { user: SessionUser | null; at: number } | null = null;
let inflight: Promise<SessionUser | null> | null = null;

export async function getCurrentUserCached(): Promise<SessionUser | null> {
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
