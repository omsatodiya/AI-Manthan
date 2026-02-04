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
