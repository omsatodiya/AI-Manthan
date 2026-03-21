ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS category VARCHAR(64) NOT NULL DEFAULT 'general';

CREATE INDEX IF NOT EXISTS idx_templates_tenant_category ON templates (tenant_id, category);
