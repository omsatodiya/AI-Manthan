import { NextResponse } from "next/server";
import { LogoutResponse } from "@/lib/types";

export async function POST() {
  try {
    const responseData: LogoutResponse = {
      message: "Logout successful",
    };
    const response = NextResponse.json(responseData, { status: 200 });

    response.cookies.set("auth_token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
