import { requireSuperAdmin } from "@/lib/super-admin";
import { tenantApplicationFunctions } from "@/lib/functions/tenant-application";
import {
  ShieldCheck,
  Building2,
  Clock,
  CheckCircle2,
  XCircle,
  User as UserIcon,
  Globe
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ApplicationStatus, TenantApplication } from "@/lib/types/tenant-application";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TenantApplicationActions } from "@/components/admin/tenant-application-actions";
import { TenantApplicationsFilters } from "@/components/admin/tenant-applications-filters";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

export default async function TenantApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Server-side protection: only super-admin can access this page
  await requireSuperAdmin();

  const resolvedParams = await searchParams;
  const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page) : 1;
  const limit = typeof resolvedParams.limit === "string" ? parseInt(resolvedParams.limit) : 10;
  const search = typeof resolvedParams.search === "string" ? resolvedParams.search : undefined;
  const status = typeof resolvedParams.status === "string" ? (resolvedParams.status as ApplicationStatus) : undefined;

  let applications: TenantApplication[] = [];
  let totalCount = 0;
  let error: string | null = null;

  try {
    const result = await tenantApplicationFunctions.getTenantApplications({
      page,
      limit,
      search,
      status
    });
    applications = result.applications;
    totalCount = result.totalCount;
  } catch (e) {
    console.error("Failed to fetch applications:", e);
    error = "Could not load applications. Please try again later.";
  }

  const totalPages = Math.ceil(totalCount / limit);

  const approvedCount = applications.filter(a => a.status === "approved").length;
  const totalApplicants = new Set(applications.map(a => a.applicantId)).size;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200/50 flex items-center gap-1.5 font-sans font-medium w-fit">
            <CheckCircle2 className="h-3 w-3" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200/50 flex items-center gap-1.5 font-sans font-medium w-fit">
            <XCircle className="h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20 border-yellow-200/50 flex items-center gap-1.5 font-sans font-medium w-fit">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  const getPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    params.set("limit", limit.toString());
    params.set("page", pageNumber.toString());
    return `?${params.toString()}`;
  };

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
            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <div className="h-12 w-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-foreground/50 font-sans uppercase font-bold tracking-wider">Queue Size</p>
                <h4 className="text-2xl font-bold font-sans">{totalCount}</h4>
              </div>
            </div>

            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-foreground/50 font-sans uppercase font-bold tracking-wider">Approved</p>
                <h4 className="text-2xl font-bold font-sans">{approvedCount}</h4>
              </div>
            </div>

            <div className="bg-card border border-border/70 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <UserIcon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-foreground/50 font-sans uppercase font-bold tracking-wider">Unique Applicants</p>
                <h4 className="text-2xl font-bold font-sans">{totalApplicants}</h4>
              </div>
            </div>
          </div>

          {error ? (
            <div className="w-full bg-red-500/5 border border-red-500/20 rounded-2xl p-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <XCircle className="h-12 w-12 text-red-500 mx-auto" />
                <h3 className="text-xl font-serif font-medium text-red-600">Error Loading Applications</h3>
                <p className="text-foreground/70 font-sans">{error}</p>
                <Button variant="outline" className="mt-4" asChild>
                  <Link href="/tenant-applications">Retry Connection</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <TenantApplicationsFilters />

              <div className="bg-card border border-border/70 rounded-2xl shadow-sm overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-b border-border/30 hover:bg-transparent">
                      <TableHead className="w-[300px] font-bold text-foreground/70 uppercase tracking-wider text-xs">Community Name</TableHead>
                      <TableHead className="min-w-[200px] font-bold text-foreground/70 uppercase tracking-wider text-xs">Description</TableHead>
                      <TableHead className="font-bold text-foreground/70 uppercase tracking-wider text-xs">Slug Name</TableHead>
                      <TableHead className="font-bold text-foreground/70 uppercase tracking-wider text-xs">Status</TableHead>
                      <TableHead className="text-center font-bold text-foreground/70 uppercase tracking-wider text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.length > 0 ? (
                      applications.map((app) => (
                        <TableRow key={app.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors group">
                          <TableCell className="py-5">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm uppercase">
                                {app.orgName.substring(0, 2)}
                              </div>
                              <div>
                                <p className="font-bold text-foreground">{app.orgName}</p>
                                <p className="text-[10px] text-foreground/40 font-mono mt-0.5">
                                  Submitted {format(new Date(app.createdAt), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            <p className="text-sm text-foreground/70 font-sans line-clamp-2 max-w-[300px] leading-relaxed">
                              {app.description || "No mission statement provided."}
                            </p>
                          </TableCell>
                          <TableCell className="py-5">
                            <div className="flex items-center gap-1.5 text-foreground/70 bg-secondary/50 px-2.5 py-1 rounded-md w-fit border border-border/50">
                              <Globe className="h-3 w-3 text-primary/70" />
                              <span className="font-mono text-xs">iq.app/{app.requestedSlug}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-5">
                            {getStatusBadge(app.status)}
                          </TableCell>
                          <TableCell className="py-5 text-center">
                            <TenantApplicationActions
                              applicationId={app.id}
                              status={app.status}
                              orgName={app.orgName}
                              requestedSlug={app.requestedSlug}
                              description={app.description || ""}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-foreground/50 font-sans">
                          No applications found matching your criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
                  <p className="text-sm text-foreground/50 font-sans">
                    Showing <span className="font-bold text-foreground">{(page - 1) * limit + 1}</span> to <span className="font-bold text-foreground">{Math.min(page * limit, totalCount)}</span> of <span className="font-bold text-foreground">{totalCount}</span> results
                  </p>
                  <Pagination className="mx-0 w-auto">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href={page > 1 ? getPageUrl(page - 1) : "#"}
                          className={cn(page <= 1 && "pointer-events-none opacity-50")}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                        if (
                          p === 1 ||
                          p === totalPages ||
                          (p >= page - 1 && p <= page + 1)
                        ) {
                          return (
                            <PaginationItem key={p}>
                              <PaginationLink
                                href={getPageUrl(p)}
                                isActive={p === page}
                              >
                                {p}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        } else if (p === page - 2 || p === page + 2) {
                          return (
                            <PaginationItem key={p}>
                              <span className="px-2">...</span>
                            </PaginationItem>
                          );
                        }
                        return null;
                      })}

                      <PaginationItem>
                        <PaginationNext
                          href={page < totalPages ? getPageUrl(page + 1) : "#"}
                          className={cn(page >= totalPages && "pointer-events-none opacity-50")}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
