-- Cursor-based pagination example for messages
-- This shows the SQL pattern used in the Supabase query

-- 1. Basic query to get latest messages (first page)
SELECT 
  id,
  conversation_id,
  sender_id,
  content,
  attachments,
  created_at,
  read_by,
  metadata
FROM messages
WHERE conversation_id = 'conversation-uuid-here'
ORDER BY created_at DESC
LIMIT 40;

-- 2. Query to get older messages (pagination with cursor)
-- 'before' parameter is the created_at timestamp of the oldest message from previous page
SELECT 
  id,
  conversation_id,
  sender_id,
  content,
  attachments,
  created_at,
  read_by,
  metadata
FROM messages
WHERE conversation_id = 'conversation-uuid-here'
  AND created_at < '2024-01-15T10:30:00.000Z'  -- This is the 'before' cursor
ORDER BY created_at DESC
LIMIT 40;

-- 3. Alternative with ID-based cursor (if needed for better performance)
-- This uses both created_at and id for more precise pagination
SELECT 
  id,
  conversation_id,
  sender_id,
  content,
  attachments,
  created_at,
  read_by,
  metadata
FROM messages
WHERE conversation_id = 'conversation-uuid-here'
  AND (
    created_at < '2024-01-15T10:30:00.000Z' 
    OR (created_at = '2024-01-15T10:30:00.000Z' AND id < 'message-uuid-here')
  )
ORDER BY created_at DESC, id DESC
LIMIT 40;

-- 4. Supabase-js equivalent query
-- This is what the API route uses:
/*
const query = supabase
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

if (before) {
  query = query.lt("created_at", before);
}
*/

-- 5. Performance considerations
-- Make sure you have these indexes for optimal performance:
CREATE INDEX idx_messages_conversation_created 
ON messages (conversation_id, created_at DESC);

-- Optional: Composite index for ID-based cursor pagination
CREATE INDEX idx_messages_conversation_created_id 
ON messages (conversation_id, created_at DESC, id DESC);

-- 6. Example response structure
/*
{
  "success": true,
  "messages": [
    {
      "id": "msg-uuid-1",
      "conversationId": "conv-uuid",
      "senderId": "user-uuid",
      "sender": {
        "id": "user-uuid",
        "fullName": "John Doe",
        "email": "john@example.com"
      },
      "content": "Hello!",
      "attachments": null,
      "createdAt": "2024-01-15T10:35:00.000Z",
      "readBy": ["user-uuid"],
      "metadata": null,
      "isRead": true
    }
  ],
  "pagination": {
    "limit": 40,
    "before": null,  // null for first page
    "nextCursor": "2024-01-15T10:30:00.000Z",  // oldest message's created_at
    "hasMore": true
  }
}
*/
