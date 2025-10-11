import { NextResponse } from "next/server";
import { getDb } from "@/lib/database";
import { sendOTPEmail } from "@/lib/email";
import crypto from "crypto";
import { ForgotPasswordRequest, ForgotPasswordResponse } from "@/lib/types";

export async function POST(request: Request) {
  const db = await getDb();

  try {
    const { email }: ForgotPasswordRequest = await request.json();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const user = await db.findUserByEmail(email);

    if (user) {
      const otp = crypto.randomInt(100000, 999999).toString();
      const otpExpires = Date.now() + 10 * 60 * 1000;

      await db.updateUser(user.id, { otp, otpExpires });

      try {
        await sendOTPEmail(user.email, otp);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return NextResponse.json(
          { message: "Failed to send email" },
          { status: 500 }
        );
      }
    }

    const responseData: ForgotPasswordResponse = {
      message: "If an account exists, an OTP has been sent.",
    };
    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}