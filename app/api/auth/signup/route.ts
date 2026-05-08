import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";
import { getDb } from "@/lib/database";
import { User, SignupRequest } from "@/lib/types";
import { SignupResponse } from "@/lib/types/api";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(request: Request) {
  const db = await getDb();

  try {
    const body: SignupRequest = await request.json();
    const { fullName, email, password } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists with this email" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: Omit<User, "otp" | "otpExpires" | "createdAt" | "updatedAt"> = {
      id: uuidv4(),
      fullName,
      email: email.toLowerCase(),
      passwordHash,
    };

    const createdUser = await db.createUser(newUser);
    if (!createdUser) {
      return NextResponse.json(
        { message: "Failed to create user" },
        { status: 500 }
      );
    }

    if (!JWT_SECRET) throw new Error("JWT_SECRET missing");
    const secret = new TextEncoder().encode(JWT_SECRET);

    // Thin global session token
    const token = await new SignJWT({
      userId: createdUser.id,
      email: createdUser.email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1d")
      .sign(secret);

    const responseData: SignupResponse = {
      message: "Signup successful",
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
