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

  // 2. Silent Rewrite Logic
  const isGlobalPath = [
    "/login",
    "/signup",
    "/lobby",
    "/unauthorized",
    "/community-applications",
    "/tenant-applications",
    "/organization-requests"
  ].some(path => pathname.startsWith(path));

  if (!subdomain || isGlobalPath) {
    // Root domain or Global path -> No rewrite needed. 
    // Next.js automatically matches routes in the (global) group.
    return NextResponse.next();
  } else {
    // Tenant subdomain -> Route to the specific community workspace
    // This will match the app/[tenant]/... file structure
    return NextResponse.rewrite(new URL(`/${subdomain}${pathname}`, request.url));
  }
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
