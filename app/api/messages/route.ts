import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/database/clients";
import { getCurrentUserAction } from "@/app/actions/auth";

// GET /api/messages?conversationId=&limit=&cursor=
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");
    const limit = parseInt(searchParams.get("limit") || "40");
    const before = searchParams.get("before"); // ISO timestamp for cursor-based pagination

    // Validate input
    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      );
    }

    if (limit > 100 || limit < 1) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 100" },
        { status: 400 }
      );
    }

    // Validate before timestamp if provided
    if (before) {
      const beforeDate = new Date(before);
      if (isNaN(beforeDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid before timestamp format" },
          { status: 400 }
        );
      }
    }

    // Get Supabase server client
    const supabase = getSupabaseServerClient();

    // Verify user is participant in conversation
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

    // Build query for messages with cursor-based pagination
    let query = supabase
      .from("messages")
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        attachments,
        created_at,
        read_by,
        metadata
      `)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Apply cursor-based pagination using created_at timestamp
    if (before) {
      query = query.lt("created_at", before);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    // Get unique sender IDs
    const senderIds = new Set<string>();
    messages?.forEach(msg => senderIds.add(msg.sender_id));

    // Fetch sender details separately
    let sendersData: { id: string; fullName: string; email: string }[] = [];
    if (senderIds.size > 0) {
      const { data: senders, error: sendersError } = await supabase
        .from("users")
        .select("id, full_name, email")
        .in("id", Array.from(senderIds));

      if (sendersError) {
        console.error("Error fetching sender details:", sendersError);
      } else {
        sendersData = (senders || []).map((s: { id: string; full_name?: string; fullName?: string; email: string }) => ({
          id: s.id,
          fullName: s.full_name ?? s.fullName ?? "Unknown User",
          email: s.email ?? "",
        }));
      }
    }

    // Transform messages to include sender details
    const transformedMessages = messages?.map(message => {
      const sender = sendersData.find(s => s.id === message.sender_id);
      return {
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        sender: {
          id: sender?.id || message.sender_id,
          fullName: sender?.fullName || "Unknown User",
          email: sender?.email || "",
        },
        content: message.content,
        attachments: message.attachments,
        createdAt: message.created_at,
        readBy: message.read_by || [],
        metadata: message.metadata,
        isRead: message.read_by?.includes(currentUser.id) || false,
      };
    }) || [];

    // Get next cursor for pagination (oldest message's created_at)
    const nextCursor = transformedMessages.length === limit 
      ? transformedMessages[transformedMessages.length - 1]?.createdAt 
      : null;

    return NextResponse.json({
      success: true,
      messages: transformedMessages,
      pagination: {
        limit,
        before,
        nextCursor,
        hasMore: transformedMessages.length === limit,
      },
    });

  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/messages
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
    const { conversationId, content, attachments } = body;

    // Validate input
    if (!conversationId || typeof conversationId !== "string") {
      return NextResponse.json(
        { error: "conversationId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return NextResponse.json(
        { error: "content is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Get Supabase server client
    const supabase = getSupabaseServerClient();

    // Verify user is participant in conversation
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

    // Insert new message
    const { data: message, error: messageError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: currentUser.id,
        content: content.trim(),
        attachments: attachments || null,
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        attachments,
        created_at,
        read_by,
        metadata
      `)
      .single();

    if (messageError) {
      console.error("Error creating message:", messageError);
      return NextResponse.json(
        { error: "Failed to create message" },
        { status: 500 }
      );
    }

    // Fetch sender details
    const { data: sender, error: senderError } = await supabase
      .from("users")
      .select("id, full_name, email")
      .eq("id", currentUser.id)
      .single();

    if (senderError) {
      console.error("Error fetching sender details:", senderError);
    }

    const senderFullName = sender ? (sender.full_name ?? (sender as { fullName?: string }).fullName) : null;

    const transformedMessage = {
      id: message.id,
      conversationId: message.conversation_id,
      senderId: message.sender_id,
      sender: {
        id: sender?.id || currentUser.id,
        fullName: senderFullName || currentUser.name,
        email: sender?.email || currentUser.email,
      },
      content: message.content,
      attachments: message.attachments,
      createdAt: message.created_at,
      readBy: message.read_by || [],
      metadata: message.metadata,
      isRead: message.read_by?.includes(currentUser.id) || false,
    };

    return NextResponse.json(
      { 
        success: true,
        message: transformedMessage 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Message creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
