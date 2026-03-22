"use client";

import { useState, useEffect } from "react";
import type { AuthUser } from "@/lib/types";
import { getCurrentUserCached } from "@/lib/auth-client-cache";

export function useCurrentUser() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    getCurrentUserCached().then((u) => {
      if (!cancelled) setUser(u);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return user;
}
