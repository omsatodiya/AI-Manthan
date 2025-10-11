import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/database";
import { User, SignupRequest, SignupResponse } from "@/lib/types";
import { headers } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  const db = await getDb();

  try {
    const body: SignupRequest = await request.json();
    const { fullName, email, password, role = "user" } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { message: "Missing required fields" },
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

    if (!tenantId) {
      return NextResponse.json(
        { message: "Tenant not found for this signup host" },
        { status: 400 }
      );
    }

    const existingUser = await (
      await getDb()
    ).findUserByEmailInTenant(email, tenantId);
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists in this tenant" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const now = new Date().toISOString();
    const newUser: Omit<User, "otp" | "otpExpires"> = {
      id: uuidv4(),
      fullName,
      email: email.toLowerCase(),
      passwordHash,
      role: role as "admin" | "user",
      tenantId,
      createdAt: now,
      updatedAt: now,
    };

    const createdUser = await db.createUser(newUser);
    if (!createdUser) {
      return NextResponse.json(
        { message: "Failed to create user" },
        { status: 500 }
      );
    }

    if (tenantId) {
      try {
        await (
          await getDb()
        ).addTenantMember({
          userId: createdUser.id,
          tenantId,
          role: "member",
          permissions: [],
        });
      } catch (e) {
        console.error("Failed to create tenant membership:", e);
      }
    }

    if (!JWT_SECRET) throw new Error("JWT_SECRET missing");
    const secret = new TextEncoder().encode(JWT_SECRET);
    const token = await new SignJWT({
      userId: createdUser.id,
      email: createdUser.email,
      role: createdUser.role,
      tenantId: tenantId || null,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(secret);

    const responseData: SignupResponse = {
      message: "Signup successful",
      role: createdUser.role,
    };
    const response = NextResponse.json(responseData, { status: 201 });
    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
