"use client";

import { getAnnouncementsAction } from "@/app/actions/announcement";

type AnnouncementsResult = Awaited<ReturnType<typeof getAnnouncementsAction>>;

let cache: { payload: AnnouncementsResult; at: number } | null = null;

const TTL_MS = 25_000;

export async function getAnnouncementsListCached(): Promise<AnnouncementsResult> {
  const now = Date.now();
  if (cache && now - cache.at < TTL_MS) {
    return cache.payload;
  }
  const payload = await getAnnouncementsAction();
  if (payload.success) {
    cache = { payload, at: Date.now() };
  }
  return payload;
}

export function invalidateAdminAnnouncementsCache() {
  cache = null;
}
