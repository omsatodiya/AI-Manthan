import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/database/clients";
import { getCurrentUserAction } from "@/app/actions/auth";

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { conversationId, messageIds } = body;

    if (!conversationId || typeof conversationId !== "string") {
      return NextResponse.json(
        { error: "conversationId is required and must be a string" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data: conversation, error: conversationError } = await supabase
      .from("conversations")
      .select("id, user_a, user_b")
      .eq("id", conversationId)
      .single();

    if (conversationError || !conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    if (conversation.user_a !== currentUser.id && conversation.user_b !== currentUser.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    let query = supabase
      .from("messages")
      .select("id, read_by")
      .eq("conversation_id", conversationId)
      .neq("sender_id", currentUser.id);

    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      query = query.in("id", messageIds);
    }

    const { data: messages, error: fetchError } = await query;

    if (fetchError) {
      console.error("Error fetching messages for read update:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    const toUpdate = (messages || []).filter((msg) => {
      const readBy = (msg.read_by || []) as string[];
      return !readBy.includes(currentUser.id);
    });

    let updatedCount = 0;
    for (const msg of toUpdate) {
      const readBy = (msg.read_by || []) as string[];
      const { error: updateError } = await supabase
        .from("messages")
        .update({ read_by: [...readBy, currentUser.id] })
        .eq("id", msg.id);

      if (!updateError) updatedCount++;
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      messageIds: toUpdate.map((m) => m.id),
    });
  } catch (error) {
    console.error("Mark messages as read error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
