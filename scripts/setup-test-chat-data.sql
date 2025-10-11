-- Test Data Setup for Chat Feature
-- Run this in Supabase SQL Editor

-- 1. Create test users (if they don't exist)
-- Note: Replace with actual user IDs from your auth.users table
INSERT INTO users (id, "fullName", email, password_hash, role, tenant_id)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test User A', 'testuserA@example.com', 'hashed_password', 'user', 'tenant-1'),
  ('22222222-2222-2222-2222-222222222222', 'Test User B', 'testuserB@example.com', 'hashed_password', 'user', 'tenant-1'),
  ('33333333-3333-3333-3333-333333333333', 'Test User C', 'testuserC@example.com', 'hashed_password', 'user', 'tenant-2')
ON CONFLICT (id) DO NOTHING;

-- 2. Create test connections (accepted connections for chat)
INSERT INTO connections (requester_id, receiver_id, status, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'accepted', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'accepted', now(), now())
ON CONFLICT (requester_id, receiver_id) DO NOTHING;

-- 3. Create test conversations
INSERT INTO conversations (id, user_a, user_b, created_at, updated_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', now(), now())
ON CONFLICT (id) DO NOTHING;

-- 4. Create test messages (100 messages for pagination testing)
INSERT INTO messages (conversation_id, sender_id, content, created_at, read_by)
SELECT 
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  CASE 
    WHEN generate_series % 2 = 0 THEN '11111111-1111-1111-1111-111111111111'
    ELSE '22222222-2222-2222-2222-222222222222'
  END,
  'Test message ' || generate_series || ' - This is a longer message to test message display and pagination functionality.',
  now() - (generate_series || ' minutes')::interval,
  CASE 
    WHEN generate_series % 2 = 0 THEN ARRAY['22222222-2222-2222-2222-222222222222']
    ELSE ARRAY['11111111-1111-1111-1111-111111111111']
  END
FROM generate_series(1, 100);

-- 5. Update conversation with last message
UPDATE conversations 
SET 
  last_message_id = (
    SELECT id FROM messages 
    WHERE conversation_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' 
    ORDER BY created_at DESC 
    LIMIT 1
  ),
  updated_at = now()
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- 6. Create user_info entries for matching (if needed)
INSERT INTO user_info (user_id, role, embedding, tenant_id)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'user', '[0.1,0.2,0.3]'::vector, 'tenant-1'),
  ('22222222-2222-2222-2222-222222222222', 'user', '[0.4,0.5,0.6]'::vector, 'tenant-1'),
  ('33333333-3333-3333-3333-333333333333', 'user', '[0.7,0.8,0.9]'::vector, 'tenant-2')
ON CONFLICT (user_id) DO NOTHING;

-- 7. Verify data
SELECT 
  'Users' as table_name,
  count(*) as count
FROM users 
WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')

UNION ALL

SELECT 
  'Connections' as table_name,
  count(*) as count
FROM connections 
WHERE requester_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')

UNION ALL

SELECT 
  'Conversations' as table_name,
  count(*) as count
FROM conversations 
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'

UNION ALL

SELECT 
  'Messages' as table_name,
  count(*) as count
FROM messages 
WHERE conversation_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- 8. Test queries for verification
-- Get conversation with participants
SELECT 
  c.id,
  c.user_a,
  c.user_b,
  c.created_at,
  c.updated_at,
  c.last_message_id,
  ua."fullName" as user_a_name,
  ub."fullName" as user_b_name
FROM conversations c
LEFT JOIN users ua ON c.user_a = ua.id
LEFT JOIN users ub ON c.user_b = ub.id
WHERE c.id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

-- Get latest messages
SELECT 
  m.id,
  m.content,
  m.created_at,
  m.sender_id,
  u."fullName" as sender_name
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id
WHERE m.conversation_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
ORDER BY m.created_at DESC
LIMIT 10;

-- Test pagination query
SELECT 
  m.id,
  m.content,
  m.created_at,
  m.sender_id
FROM messages m
WHERE m.conversation_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  AND m.created_at < '2024-01-01T00:00:00Z'  -- Replace with actual timestamp
ORDER BY m.created_at DESC
LIMIT 20;
