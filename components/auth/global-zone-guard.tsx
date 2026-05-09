"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

/**
 * GlobalZoneGuard prevents platform-level pages from being accessed 
 * via community subdomains.
 */
export function GlobalZoneGuard() {
  const router = useRouter();

  useEffect(() => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    const isLocal = hostname.endsWith('.localhost');
    
    const isSubdomain = isLocal ? parts.length > 1 : (parts.length > 2 && parts[0] !== 'www');

    if (isSubdomain) {
      toast.error("This page is only available in the Global Hub", {
        description: "Redirecting you to the main lobby...",
      });
      
      // Construct the root domain URL
      // In local dev: localhost:3000
      // In prod: connectiq.com
      const rootDomain = isLocal ? "localhost:3000" : "connectiq.vercel.app";
      const protocol = window.location.protocol;
      
      setTimeout(() => {
        window.location.href = `${protocol}//${rootDomain}/lobby`;
      }, 1500);
    }
  }, [router]);

  return null;
}
