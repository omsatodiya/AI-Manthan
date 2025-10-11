import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/database/clients";
import { getCurrentUserAction } from "@/app/actions/auth";

export async function POST(request: NextRequest) {
  try {
    console.log("🔵 /api/connections: Starting connection request process");

    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      console.error("🔴 /api/connections: User not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { requesterId, receiverId } = body;

    if (!requesterId || !receiverId) {
      console.error("🔴 /api/connections: Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: requesterId and receiverId" },
        { status: 400 }
      );
    }

    if (requesterId === receiverId) {
      console.error("🔴 /api/connections: Cannot send connection request to self");
      return NextResponse.json(
        { error: "Cannot send connection request to yourself" },
        { status: 400 }
      );
    }

    if (requesterId !== currentUser.id) {
      console.error("🔴 /api/connections: User can only send requests on their own behalf");
      return NextResponse.json(
        { error: "You can only send connection requests on your own behalf" },
        { status: 403 }
      );
    }

    console.log("🔵 /api/connections: Connection request data", {
      requesterId,
      receiverId,
      currentUserId: currentUser.id
    });

    const supabase = await getSupabaseClient();

    // Check if receiver exists
    const { data: receiver, error: receiverError } = await supabase
      .from("users")
      .select("id, fullName, email")
      .eq("id", receiverId)
      .single();

    if (receiverError || !receiver) {
      console.error("🔴 /api/connections: Receiver not found", receiverError);
      return NextResponse.json(
        { error: "Receiver not found" },
        { status: 404 }
      );
    }

    // Check if connection already exists
    const { data: existingConnection, error: connectionCheckError } = await supabase
      .from("connections")
      .select("id, status")
      .or(`and(requester_id.eq.${requesterId},receiver_id.eq.${receiverId}),and(requester_id.eq.${receiverId},receiver_id.eq.${requesterId})`)
      .single();

    if (connectionCheckError && connectionCheckError.code !== "PGRST116") {
      console.error("🔴 /api/connections: Error checking existing connection", connectionCheckError);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }

    if (existingConnection) {
      console.error("🔴 /api/connections: Connection already exists", {
        connectionId: existingConnection.id,
        status: existingConnection.status
      });
      return NextResponse.json(
        { 
          error: "Connection already exists",
          status: existingConnection.status,
          connectionId: existingConnection.id
        },
        { status: 409 }
      );
    }

    // Create connection request
    const { data: newConnection, error: createError } = await supabase
      .from("connections")
      .insert({
        requester_id: requesterId,
        receiver_id: receiverId,
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error("🔴 /api/connections: Error creating connection", createError);
      return NextResponse.json(
        { error: "Failed to create connection request" },
        { status: 500 }
      );
    }

    console.log("🔵 /api/connections: Connection request created successfully", {
      connectionId: newConnection.id,
      status: newConnection.status
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newConnection.id,
        requesterId: newConnection.requester_id,
        receiverId: newConnection.receiver_id,
        status: newConnection.status,
        createdAt: newConnection.created_at,
        receiver: {
          id: receiver.id,
          name: receiver.fullName,
          email: receiver.email
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error("🔴 /api/connections: Error in POST request", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log("🔵 /api/connections: Starting connection update process");

    const currentUser = await getCurrentUserAction();
    if (!currentUser) {
      console.error("🔴 /api/connections: User not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { connectionId, status } = body;

    if (!connectionId || !status) {
      console.error("🔴 /api/connections: Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields: connectionId and status" },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      console.error("🔴 /api/connections: Invalid status", { status, validStatuses });
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    console.log("🔵 /api/connections: Connection update data", {
      connectionId,
      status,
      currentUserId: currentUser.id
    });

    const supabase = await getSupabaseClient();

    // Get the connection and verify ownership
    const { data: connection, error: connectionError } = await supabase
      .from("connections")
      .select("id, requester_id, receiver_id, status")
      .eq("id", connectionId)
      .single();

    if (connectionError || !connection) {
      console.error("🔴 /api/connections: Connection not found", connectionError);
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    // Check if user is authorized to update this connection
    if (connection.receiver_id !== currentUser.id) {
      console.error("🔴 /api/connections: User not authorized to update this connection", {
        connectionReceiverId: connection.receiver_id,
        currentUserId: currentUser.id
      });
      return NextResponse.json(
        { error: "You can only respond to connection requests sent to you" },
        { status: 403 }
      );
    }

    // Check if connection is already processed
    if (connection.status !== 'pending') {
      console.error("🔴 /api/connections: Connection already processed", {
        currentStatus: connection.status,
        requestedStatus: status
      });
      return NextResponse.json(
        { 
          error: "Connection has already been processed",
          currentStatus: connection.status
        },
        { status: 409 }
      );
    }

    // Update connection status
    const { data: updatedConnection, error: updateError } = await supabase
      .from("connections")
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq("id", connectionId)
      .select()
      .single();

    if (updateError) {
      console.error("🔴 /api/connections: Error updating connection", updateError);
      return NextResponse.json(
        { error: "Failed to update connection" },
        { status: 500 }
      );
    }

    // Get requester details for response
    const { data: requester, error: requesterError } = await supabase
      .from("users")
      .select("id, fullName, email")
      .eq("id", connection.requester_id)
      .single();

    if (requesterError) {
      console.error("🔴 /api/connections: Error fetching requester details", requesterError);
    }

    console.log("🔵 /api/connections: Connection updated successfully", {
      connectionId: updatedConnection.id,
      newStatus: updatedConnection.status
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedConnection.id,
        requesterId: updatedConnection.requester_id,
        receiverId: updatedConnection.receiver_id,
        status: updatedConnection.status,
        updatedAt: updatedConnection.updated_at,
        requester: requester ? {
          id: requester.id,
          name: requester.fullName,
          email: requester.email
        } : null
      }
    });

  } catch (error) {
    console.error("🔴 /api/connections: Error in PATCH request", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
