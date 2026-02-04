-- ============================================================
-- Initial Data Setup for ConnectIQ / AI Manthan
-- Run this in Supabase SQL Editor after creating base tables
-- ============================================================
--
-- Tenant IDs (for .env TENANT or NEXT_PUBLIC_TENANT):
--   acm: a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d
--   cev: b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e
--

-- 1. Ensure tenants table exists (run if not already created)
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure connections table exists (for user matching / chat)
CREATE TABLE IF NOT EXISTS connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure conversations and messages tables exist (for 1:1 chat)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_id UUID,
  UNIQUE (user_a, user_b)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  attachments JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_by UUID[] DEFAULT '{}',
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(conversation_id, created_at DESC);

CREATE OR REPLACE FUNCTION get_or_create_conversation(user1 UUID, user2 UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  conv_id UUID;
  ua UUID;
  ub UUID;
BEGIN
  ua := LEAST(user1, user2);
  ub := GREATEST(user1, user2);
  SELECT id INTO conv_id FROM conversations WHERE user_a = ua AND user_b = ub LIMIT 1;
  IF conv_id IS NULL THEN
    INSERT INTO conversations (user_a, user_b) VALUES (ua, ub) RETURNING id INTO conv_id;
  END IF;
  RETURN conv_id;
END;
$$;

-- 4. Ensure chat_messages table exists (for community chat at /community)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  attachment_id TEXT,
  attachment_name VARCHAR(255),
  attachment_size INTEGER,
  attachment_type VARCHAR(100),
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_tenant_id ON chat_messages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);

-- 5. Ensure chat_reactions table exists (for community chat reactions)
CREATE TABLE IF NOT EXISTS chat_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reaction_type VARCHAR(50) NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON chat_reactions(message_id);

-- 6. Ensure user_info table exists
CREATE TABLE IF NOT EXISTS user_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  role VARCHAR(100),
  organization_type VARCHAR(255),
  business_stage VARCHAR(100),
  team_size VARCHAR(50),
  industry TEXT[],
  goals TEXT[],
  opportunity_type TEXT[],
  focus_areas TEXT[],
  collab_target TEXT[],
  collab_type TEXT[],
  partnership_open VARCHAR(255),
  template_type TEXT[],
  template_tone VARCHAR(100),
  template_automation VARCHAR(100),
  event_type TEXT[],
  event_scale VARCHAR(100),
  event_format TEXT[],
  embedding double precision[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_info_user_id ON user_info(user_id);
CREATE INDEX IF NOT EXISTS idx_user_info_tenant_id ON user_info(tenant_id);

-- 7. Ensure announcements table exists
CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_tenant_id ON announcements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- 8. Ensure announcement_opportunity table exists
CREATE TABLE IF NOT EXISTS announcement_opportunity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  link TEXT,
  response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcement_opportunity_tenant_id ON announcement_opportunity(tenant_id);
CREATE INDEX IF NOT EXISTS idx_announcement_opportunity_user_id ON announcement_opportunity(user_id);
CREATE INDEX IF NOT EXISTS idx_announcement_opportunity_created_at ON announcement_opportunity(created_at DESC);

-- 9. Ensure templates table exists (required for admin template management)
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  fields JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Insert the two tenants: acm and cev
INSERT INTO tenants (id, name, slug) VALUES
  ('a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'ACM', 'acm'),
  ('b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'CEV', 'cev')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();

-- 11. (Optional) Create sample admin users - password: "password123"
-- Uncomment to create, or use the app signup flow instead

INSERT INTO users (email, full_name, password_hash, tenant_id, role) VALUES
  ('admin@acm.example.com', 'ACM Admin', '$2b$10$zqt8UZS3A.ycbDWJgmReBuU8RoBNLBPlk.rtbV7JvNJdF31Q2Hp16', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'admin'),
  ('admin@cev.example.com', 'CEV Admin', '$2b$10$zqt8UZS3A.ycbDWJgmReBuU8RoBNLBPlk.rtbV7JvNJdF31Q2Hp16', 'b2c3d4e5-f6a7-5b6c-9d0e-1f2a3b4c5d6e', 'admin');


-- 12. Verify inserted data
SELECT id, name, slug, created_at FROM tenants ORDER BY slug;
