import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/database/clients";
import { getCurrentUserAction } from "@/app/actions/auth";

export async function POST(request: NextRequest) {
  try {
    // Get current user
    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { otherUserId } = body;

    // Validate input
    if (!otherUserId || typeof otherUserId !== "string") {
      return NextResponse.json(
        { error: "otherUserId is required and must be a string" },
        { status: 400 }
      );
    }

    // Prevent self-conversation
    if (currentUser.id === otherUserId) {
      return NextResponse.json(
        { error: "Cannot create conversation with yourself" },
        { status: 400 }
      );
    }

    // Get Supabase server client
    const supabase = await getSupabaseServerClient();

    // Check if other user exists
    const { data: otherUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", otherUserId)
      .single();

    if (userError || !otherUser) {
      return NextResponse.json(
        { error: "Other user not found" },
        { status: 404 }
      );
    }

    // Use the helper function to get or create conversation
    const { data: conversationId, error: conversationError } = await supabase
      .rpc("get_or_create_conversation", {
        user1: currentUser.id,
        user2: otherUserId,
      });

    if (conversationError) {
      console.error("Error creating/getting conversation:", conversationError);
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      );
    }

    // Fetch the complete conversation object
    const { data: conversation, error: fetchError } = await supabase
      .from("conversations")
      .select(`
        id,
        user_a,
        user_b,
        created_at,
        updated_at,
        last_message_id
      `)
      .eq("id", conversationId)
      .single();

    if (fetchError) {
      console.error("Error fetching conversation:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch conversation" },
        { status: 500 }
      );
    }

    // Fetch user details separately
    const userIds = [conversation.user_a, conversation.user_b];
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, fullName, email")
      .in("id", userIds);

    if (usersError) {
      console.error("Error fetching user details:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch user details" },
        { status: 500 }
      );
    }

    const userA = users?.find(u => u.id === conversation.user_a);
    const userB = users?.find(u => u.id === conversation.user_b);

    // Transform the response to include participant details
    const transformedConversation = {
      id: conversation.id,
      userA: {
        id: conversation.user_a,
        fullName: userA?.fullName || "Unknown User",
        email: userA?.email || "",
      },
      userB: {
        id: conversation.user_b,
        fullName: userB?.fullName || "Unknown User",
        email: userB?.email || "",
      },
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      lastMessageId: conversation.last_message_id,
    };

    return NextResponse.json(
      { 
        success: true,
        conversation: transformedConversation 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Conversation creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
