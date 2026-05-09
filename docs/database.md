# Database Schema & Logic

This document details the database structure, triggers, and custom functions used in ConnectIQ.

## Core Tables

### Tenants
Stores community information.
```sql
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  name CHARACTER VARYING(255) NOT NULL,
  slug CHARACTER VARYING(255) NOT NULL,
  description TEXT NULL,
  is_public BOOLEAN NULL DEFAULT false,
  settings JSONB NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT tenants_pkey PRIMARY KEY (id),
  CONSTRAINT tenants_slug_key UNIQUE (slug)
);
```

### Chat Messages
Stores messages for both global and community-specific chats.
```sql
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  user_id UUID NOT NULL,
  tenant_id UUID NULL,
  attachment_id TEXT NULL,
  attachment_name CHARACTER VARYING(255) NULL,
  attachment_size INTEGER NULL,
  attachment_type CHARACTER VARYING(100) NULL,
  attachment_url TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT chat_messages_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_messages_tenant_id ON public.chat_messages (tenant_id);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages (created_at);
```

### Chat Reactions
Stores engagement data for messages.
```sql
CREATE TABLE public.chat_reactions (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL,
  user_id UUID NOT NULL,
  reaction_type CHARACTER VARYING(50) NOT NULL,
  tenant_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NULL DEFAULT now(),
  CONSTRAINT chat_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT chat_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES chat_messages (id) ON DELETE CASCADE,
  CONSTRAINT chat_reactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants (id) ON DELETE CASCADE,
  CONSTRAINT chat_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT chat_reactions_message_id_user_id_reaction_type_key UNIQUE (message_id, user_id, reaction_type)
);
```

## Hybrid RAG Functions

### Match Messages (Vector Search)
Used by Sangam AI to find relevant context within community chats.
```sql
CREATE OR REPLACE FUNCTION match_messages(
  query_embedding VECTOR(1536),
  match_tenant_id UUID,
  match_count INTEGER DEFAULT 10,
  similarity_threshold DOUBLE PRECISION DEFAULT 0.5
)
RETURNS TABLE (
  id UUID,
  chat_id UUID,
  content TEXT,
  similarity DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE,
  has_attachment BOOLEAN,
  attachment_file_name VARCHAR(255),
  attachment_file_type VARCHAR(100),
  content_type VARCHAR(50),
  chunk_index INTEGER,
  chunk_total INTEGER
)
LANGUAGE SQL
AS $$
  SELECT 
    id,
    tenant_id as chat_id,
    content,
    1 - (embedding <=> query_embedding) as similarity,
    created_at,
    (attachment_url IS NOT NULL) as has_attachment,
    attachment_name,
    attachment_type,
    'text' as content_type,
    0 as chunk_index,
    1 as chunk_total
  FROM chat_messages
  WHERE (tenant_id = match_tenant_id OR (tenant_id IS NULL AND match_tenant_id IS NULL))
    AND 1 - (embedding <=> query_embedding) > similarity_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$;
```

## Security (RLS)

The platform uses strict Row-Level Security (RLS) to ensure data privacy between different communities.

```sql
-- Example Tenant Member RLS
CREATE POLICY "Members can view their own tenant"
  ON public.tenants
  FOR SELECT
  USING (id IN (SELECT tenant_id FROM tenant_members WHERE user_id = auth.uid()));
```
