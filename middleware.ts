import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Extracts the subdomain from the host header.
 * Supports:
 * - sub.domain.com -> sub
 * - sub.localhost:3000 -> sub
 * - domain.com -> null
 * - localhost:3000 -> null
 */
function getSubdomain(host: string | null): string | null {
  if (!host) return null;
  
  // Remove port
  const hostname = host.split(":")[0].toLowerCase();
  const parts = hostname.split(".");

  // Localhost handling (e.g., genius.localhost)
  if (hostname.endsWith(".localhost")) {
    return parts.length > 1 ? parts[0] : null;
  }

  // Vercel deployment domains handling (e.g., project.vercel.app)
  if (hostname.endsWith(".vercel.app")) {
    return parts.length > 3 ? parts[0] : null;
  }

  // Standard domain handling (e.g., genius.connectiq.com)
  // Assuming a 2-part root domain (connectiq.com)
  if (parts.length > 2) {
    const subdomain = parts[0];
    if (subdomain !== "www") {
      return subdomain;
    }
  }

  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host");
  const subdomain = getSubdomain(host);

  // 1. Skip rewrites for internal Next.js paths, API routes, and static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // Covers favicon.ico, images, etc.
  ) {
    return NextResponse.next();
  }

  // 2. Silent Rewrite / Redirect Logic
  const isGlobalPath = [
    "/login",
    "/signup",
    "/lobby",
    "/unauthorized",
    "/community-applications",
    "/tenant-applications",
    "/organization-requests"
  ].some(path => pathname.startsWith(path));

  if (subdomain) {
    // Tenant subdomain -> Route to the specific community workspace
    // This will match the app/[tenant]/... file structure
    const response = NextResponse.rewrite(new URL(`/${subdomain}${pathname}`, request.url));
    response.cookies.set("current_tenant", subdomain, { path: "/" });
    return response;
  }

  // No subdomain
  if (isGlobalPath) {
    return NextResponse.next();
  }

  // Check if pathname starts with a tenant slug or is a direct tenant subpath on root domain
  const segments = pathname.split("/").filter(Boolean);
  
  if (segments.length > 0) {
    const firstSegment = segments[0];
    
    // Top-level global routes that shouldn't be matched as tenant slugs
    const globalTopLevelRoutes = ["admin", "user"];
    
    // Sub-paths that exist inside a tenant workspace
    const tenantSubPaths = [
      "announcements",
      "chat",
      "community",
      "community-management",
      "connections",
      "events",
      "leaderboard",
      "profile",
      "templates"
    ];
    
    if (tenantSubPaths.includes(firstSegment)) {
      // User is accessing a tenant route directly (e.g. /community)
      // Redirect to /${currentTenant}/community if cookie exists
      const currentTenant = request.cookies.get("current_tenant")?.value;
      if (currentTenant) {
        const redirectUrl = new URL(`/${currentTenant}${pathname}`, request.url);
        return NextResponse.redirect(redirectUrl);
      }
    } else if (!globalTopLevelRoutes.includes(firstSegment)) {
      // Treat first segment as tenant slug (e.g. /genius/community or /genius)
      const tenantSlug = firstSegment;
      const response = NextResponse.next();
      response.cookies.set("current_tenant", tenantSlug, { path: "/" });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
