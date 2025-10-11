import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { getDb } from "@/lib/database";
import { LoginRequest, LoginResponse } from "@/lib/types";
import { headers } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  const db = await getDb();

  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Missing email or password" },
        { status: 400 }
      );
    }

    const hdrs = await headers();
    const host = hdrs.get("host") || "";
    const parts = host.split(":")[0].split(".");
    const subdomain = parts.length > 2 ? parts[0].toLowerCase() : null;
    let tenantId: string | null = null;
    const tenant = subdomain
      ? await (await getDb()).findTenantBySlug(subdomain)
      : null;
    tenantId = tenant?.id || null;
    if (!tenantId) {
      const devTenant = process.env.TENANT?.toLowerCase();
      if (devTenant) {
        const devTenantRow = await (await getDb()).findTenantBySlug(devTenant);
        tenantId = devTenantRow?.id || null;
      }
    }

    const user = tenantId
      ? await (await getDb()).findUserByEmailInTenant(email, tenantId)
      : await db.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 }
      );
    }

    if (!JWT_SECRET) throw new Error("JWT_SECRET missing");
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      tenantId: tenantId || null,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(secret);

    const responseData: LoginResponse = {
      message: "Login successful",
      role: user.role,
    };
    const response = NextResponse.json(responseData, { status: 200 });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
