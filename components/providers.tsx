"use client";

import { ThemeProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { TenantProvider } from "@/contexts/TenantContext";

export function Providers({ children }: ThemeProviderProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TenantProvider>{children}</TenantProvider>
    </ThemeProvider>
  );
}
