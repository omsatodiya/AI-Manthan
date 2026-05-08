import {
  ShieldCheck
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function TenantApplicationsLoading() {
  return (
    <div className="relative min-h-screen pb-20 bg-gradient-to-br from-[#f6f7fb] via-[#f2f7f4] to-[#fef7f3] dark:from-[#0b0e14] dark:via-[#111827] dark:to-[#0b1220]">
      <div className="container mx-auto max-w-7xl pt-24 px-4 sm:px-6 relative z-10">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4 items-center text-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4 font-sans border border-primary/20">
                <ShieldCheck className="h-3 w-3" />
                Super Admin Console
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl tracking-tight text-foreground mb-6">
                <span className="font-serif font-medium">Tenant</span>
                <span className="block font-sans font-bold text-primary dark:text-foreground mt-1 md:mt-2">
                  Applications
                </span>
              </h1>
              <p className="text-lg text-foreground/80 max-w-2xl mt-4 leading-relaxed mx-auto font-sans">
                Review and manage community creation requests from across the ConnectIQ network.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-12" />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <Skeleton className="h-11 w-full md:w-96 rounded-xl" />
              <Skeleton className="h-11 w-full md:w-32 rounded-xl" />
            </div>

            <div className="bg-card border border-border/70 rounded-2xl shadow-sm overflow-hidden">
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-4 border-b border-border/30 last:border-0">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                      </div>
                    </div>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-8 w-8 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
