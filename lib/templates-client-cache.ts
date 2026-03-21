import type { Template } from "@/constants/templates";

type Entry = { templates: Template[]; fetchedAt: number };

const store = new Map<string, Entry>();

const TTL_MS = 45_000;

export function readTemplatesCache(tenantId: string): Template[] | null {
  const entry = store.get(tenantId);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > TTL_MS) {
    store.delete(tenantId);
    return null;
  }
  return entry.templates;
}

export function writeTemplatesCache(tenantId: string, templates: Template[]) {
  store.set(tenantId, { templates, fetchedAt: Date.now() });
}

export function invalidateTemplatesCache(tenantId?: string) {
  if (tenantId) {
    store.delete(tenantId);
    return;
  }
  store.clear();
}
