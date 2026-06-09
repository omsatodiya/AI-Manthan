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
    const isVercel = hostname.endsWith('.vercel.app');
    
    let isSubdomain = false;
    let rootDomain = "";

    if (isLocal) {
      isSubdomain = parts.length > 1;
      rootDomain = isSubdomain ? parts.slice(1).join('.') : hostname;
      const port = window.location.port;
      if (port) {
        rootDomain = `${rootDomain}:${port}`;
      }
    } else if (isVercel) {
      isSubdomain = parts.length > 3;
      rootDomain = isSubdomain ? parts.slice(1).join('.') : hostname;
    } else {
      isSubdomain = parts.length > 2 && parts[0] !== 'www';
      rootDomain = isSubdomain ? parts.slice(1).join('.') : hostname;
    }

    if (isSubdomain) {
      toast.error("This page is only available in the Global Hub", {
        description: "Redirecting you to the main lobby...",
      });
      
      const protocol = window.location.protocol;
      
      setTimeout(() => {
        window.location.href = `${protocol}//${rootDomain}/lobby`;
      }, 1500);
    }
  }, [router]);

  return null;
}
