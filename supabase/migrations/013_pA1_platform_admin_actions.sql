-- P A.1: Immutable audit trail for platform staff actions

CREATE TABLE IF NOT EXISTS platform_admin_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE platform_admin_actions IS 'Audit log for platform admin/support interventions (writes via SECURITY DEFINER RPCs)';
COMMENT ON COLUMN platform_admin_actions.action IS 'e.g. company.status_changed, subscription.extended';
COMMENT ON COLUMN platform_admin_actions.entity_type IS 'e.g. company, subscription';
COMMENT ON COLUMN platform_admin_actions.metadata IS 'Structured context: company_id, reason, previous values, etc.';

CREATE INDEX IF NOT EXISTS idx_platform_admin_actions_created
  ON platform_admin_actions (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_admin_actions_entity
  ON platform_admin_actions (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_platform_admin_actions_admin
  ON platform_admin_actions (admin_user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_platform_admin_actions_metadata_company
  ON platform_admin_actions ((metadata->>'company_id'))
  WHERE metadata ? 'company_id';

ALTER TABLE platform_admin_actions ENABLE ROW LEVEL SECURITY;

-- Platform staff read; no direct client INSERT/UPDATE/DELETE (RPCs use SECURITY DEFINER)
CREATE POLICY "Platform staff can view admin actions"
  ON platform_admin_actions FOR SELECT
  USING (
    public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "No direct insert on platform admin actions"
  ON platform_admin_actions FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No direct update on platform admin actions"
  ON platform_admin_actions FOR UPDATE
  USING (false)
  WITH CHECK (false);

CREATE POLICY "No direct delete on platform admin actions"
  ON platform_admin_actions FOR DELETE
  USING (false);
