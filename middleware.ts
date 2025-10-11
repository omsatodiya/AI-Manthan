import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

function hasSubdomain(host: string | null): boolean {
  if (!host) return false;
  const withoutPort = host.split(":")[0];
  const parts = withoutPort.split(".");
  if (parts.length <= 2) return false;
  const first = parts[0].toLowerCase();
  return first !== "www";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("auth_token")?.value;
  const host = request.headers.get("host");
  const onTenantSubdomain = hasSubdomain(host);

  const isAdminPath = pathname.startsWith("/admin");
  const isUserPath = pathname.startsWith("/user");
  const isAuthPath =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/api/auth/");
  const isHomePage = pathname === "/";

  const hasValidTenant =
    onTenantSubdomain ||
    (process.env.NODE_ENV !== "production" && process.env.TENANT);

  if (!hasValidTenant && !isHomePage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isAuthPath && !onTenantSubdomain) {
    const devTenant = process.env.TENANT?.toLowerCase();
    if (!devTenant) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isAdminPath || isUserPath) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      if (!JWT_SECRET) throw new Error("JWT_SECRET missing");
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const userRole = payload.role as "admin" | "user";

      if (isAdminPath && userRole !== "admin") {
        return NextResponse.redirect(new URL("/user", request.url));
      }

      return NextResponse.next();
    } catch (err) {
      console.error("Middleware JWT Error:", err);

      const response = NextResponse.redirect(new URL("/login", request.url));
      response.cookies.delete("auth_token");
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/user/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/api/auth/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
