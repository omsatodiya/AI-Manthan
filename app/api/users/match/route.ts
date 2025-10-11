import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/database";
import { getCurrentUserAction } from "@/app/actions/auth";

export async function GET(request: NextRequest) {
  try {
    console.log("🔵 /api/users/match: Starting user matching process");

    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      console.error("🔴 /api/users/match: User not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔵 /api/users/match: User authenticated", {
      userId: currentUser.id,
      userEmail: currentUser.email
    });

    const db = await getDb();

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const matchThreshold = parseFloat(searchParams.get("threshold") || "0.7");
    const matchCount = parseInt(searchParams.get("count") || "5");
    const tenantId = searchParams.get("tenantId") || undefined;

    console.log("🔵 /api/users/match: Query parameters", {
      matchThreshold,
      matchCount,
      tenantId
    });

    // Get the current user's data from users table
    console.log("🔵 /api/users/match: Fetching current user data from users table");
    const currentUserData = await db.findUserById(currentUser.id);

    if (!currentUserData) {
      console.error("🔴 /api/users/match: Current user not found in users table");
      return NextResponse.json(
        { 
          error: "User not found.",
          code: "USER_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    console.log("🔵 /api/users/match: Current user data found", {
      userId: currentUserData.id,
      userEmail: currentUserData.email,
      userTenantId: currentUserData.tenantId
    });

    // Get the current user's info, including their embedding
    console.log("🔵 /api/users/match: Fetching current user info");
    const currentUserInfo = await db.getUserInfo(currentUser.id, tenantId);

    if (!currentUserInfo) {
      console.error("🔴 /api/users/match: No user profile found");
      return NextResponse.json(
        { 
          error: "User profile not found. Please complete your profile first.",
          code: "PROFILE_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    if (!currentUserInfo.embedding) {
      console.error("🔴 /api/users/match: No embedding found for user profile");
      return NextResponse.json(
        { 
          error: "User profile incomplete. Please save your profile information to generate an embedding for matching. If you recently saved your profile, the embedding generation might be in progress.",
          code: "EMBEDDING_NOT_FOUND"
        },
        { status: 404 }
      );
    }

    console.log("🔵 /api/users/match: Current user info found", {
      hasEmbedding: !!currentUserInfo.embedding,
      embeddingLength: currentUserInfo.embedding.length,
      userTenantId: currentUserData.tenantId
    });

    // Call the database function to find matches
    console.log("🔵 /api/users/match: Finding user matches");
    const matches = await db.findUserMatches(
      currentUser.id,
      currentUserInfo.embedding,
      {
        threshold: matchThreshold,
        limit: matchCount,
        tenantId: tenantId
      }
    );

    console.log("🔵 /api/users/match: Matches found", {
      matchCount: matches.length,
      matches: matches.map(m => ({
        userId: m.userId,
        similarity: m.similarity,
        hasUserDetails: !!m.user
      }))
    });

    // Filter matches by tenant_id - only show users from the same tenant
    const filteredMatches = matches.filter(match => {
      const userTenantId = match.user?.tenantId;
      const currentUserTenantId = currentUserData.tenantId;
      
      console.log("🔵 /api/users/match: Checking tenant match", {
        userId: match.userId,
        userTenantId,
        currentUserTenantId,
        isMatch: userTenantId === currentUserTenantId
      });
      
      return userTenantId === currentUserTenantId;
    });

    console.log("🔵 /api/users/match: Filtered matches by tenant", {
      originalCount: matches.length,
      filteredCount: filteredMatches.length,
      filteredMatches: filteredMatches.map(m => ({
        userId: m.userId,
        similarity: m.similarity,
        userTenantId: m.user?.tenantId
      }))
    });

    return NextResponse.json({
      success: true,
      data: filteredMatches,
      meta: {
        threshold: matchThreshold,
        count: filteredMatches.length,
        requestedCount: matchCount,
        originalCount: matches.length
      }
    });

  } catch (error) {
    console.error("🔴 /api/users/match: Error in matching process", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
