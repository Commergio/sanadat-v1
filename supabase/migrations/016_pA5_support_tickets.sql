-- P A.5: Support tickets for tenants and platform staff

DO $$ BEGIN
  CREATE TYPE support_ticket_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE support_ticket_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  status support_ticket_status NOT NULL DEFAULT 'open',
  priority support_ticket_priority NOT NULL DEFAULT 'normal',
  assigned_to UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS support_ticket_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  internal_only BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_company
  ON support_tickets (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_status
  ON support_tickets (status, priority, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned
  ON support_tickets (assigned_to)
  WHERE assigned_to IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_ticket_notes_ticket
  ON support_ticket_notes (ticket_id, created_at ASC);

CREATE TRIGGER support_tickets_updated_at
  BEFORE UPDATE ON support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: support_tickets
-- ---------------------------------------------------------------------------

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view company support tickets"
  ON support_tickets FOR SELECT
  USING (company_id IN (SELECT public.user_company_ids()));

CREATE POLICY "Tenants can create company support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (
    company_id IN (SELECT public.user_company_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "Platform staff can view all support tickets"
  ON support_tickets FOR SELECT
  USING (
    public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "Platform staff can update support tickets"
  ON support_tickets FOR UPDATE
  USING (
    public.is_platform_admin()
    OR public.is_platform_support()
  )
  WITH CHECK (
    public.is_platform_admin()
    OR public.is_platform_support()
  );

-- ---------------------------------------------------------------------------
-- RLS: support_ticket_notes
-- ---------------------------------------------------------------------------

ALTER TABLE support_ticket_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants can view public notes on company tickets"
  ON support_ticket_notes FOR SELECT
  USING (
    internal_only = false
    AND ticket_id IN (
      SELECT id FROM support_tickets
      WHERE company_id IN (SELECT public.user_company_ids())
    )
  );

CREATE POLICY "Tenants can add public notes on company tickets"
  ON support_ticket_notes FOR INSERT
  WITH CHECK (
    internal_only = false
    AND author_id = auth.uid()
    AND ticket_id IN (
      SELECT id FROM support_tickets
      WHERE company_id IN (SELECT public.user_company_ids())
    )
  );

CREATE POLICY "Platform staff can view all ticket notes"
  ON support_ticket_notes FOR SELECT
  USING (
    public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "Platform staff can add ticket notes"
  ON support_ticket_notes FOR INSERT
  WITH CHECK (
    (public.is_platform_admin() OR public.is_platform_support())
    AND author_id = auth.uid()
  );
