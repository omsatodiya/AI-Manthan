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

  const isHomePage = pathname === "/";
  const isAuthPath =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname.startsWith("/api/auth/");

  const isPublicUserPath =
    pathname.startsWith("/community") ||
    pathname.startsWith("/connections") ||
    pathname.startsWith("/events") ||
    pathname.startsWith("/templates") ||
    pathname.startsWith("/user") ||
    pathname === "/announcements" ||
    pathname.startsWith("/chat");

  const isAdminOnlyPath =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/announcements/create-announcement") ||
    pathname.startsWith("/announcements/edit-announcement") ||
    pathname === "/events/event-registrations";

  if (!onTenantSubdomain && process.env.NODE_ENV === "production") {
    if (!isHomePage) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (isAuthPath) {
    return NextResponse.next();
  }

  if (isHomePage) {
    return NextResponse.next();
  }

  if (isPublicUserPath || isAdminOnlyPath) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      if (!JWT_SECRET) throw new Error("JWT_SECRET missing");
      const secret = new TextEncoder().encode(JWT_SECRET);
      const { payload } = await jwtVerify(token, secret);
      const userRole = payload.role as "admin" | "user";

      if (isAdminOnlyPath && userRole !== "admin") {
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
    "/community/:path*",
    "/connections/:path*",
    "/events/:path*",
    "/templates/:path*",
    "/announcements/:path*",
    "/chat/:path*",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/api/auth/:path*",
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
