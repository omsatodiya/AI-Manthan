import { cookies } from "next/headers";
import { jwtVerify, JWTPayload } from "jose";
import { getDb } from "@/lib/database";
import { SessionUser } from "@/lib/types/user";

const JWT_SECRET = process.env.JWT_SECRET;

export async function getSessionUser(): Promise<SessionUser | null> {
  const db = await getDb();
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables.");
    }
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload }: { payload: JWTPayload } = await jwtVerify(token, secret);
    interface AuthJWTPayload extends JWTPayload {
      userId?: string;
      email?: string;
    }
    const authPayload = payload as AuthJWTPayload;
    const userId = authPayload.userId as string;

    if (!userId) return null;

    const user = await db.findUserById(userId);

    if (!user) {
      cookieStore.delete("auth_token");
      return null;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
    };
  } catch (error) {
    console.error("Authentication error in session:", error);
    cookieStore.delete("auth_token");
    return null;
  }
}
