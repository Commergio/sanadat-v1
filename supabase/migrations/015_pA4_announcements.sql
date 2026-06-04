-- P A.4: Platform announcements for tenant dashboards

DO $$ BEGIN
  CREATE TYPE announcement_priority AS ENUM ('info', 'warning', 'success', 'critical');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE announcement_target_type AS ENUM ('all', 'specific');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  content_ar TEXT NOT NULL,
  content_en TEXT NOT NULL,
  priority announcement_priority NOT NULL DEFAULT 'info',
  published BOOLEAN NOT NULL DEFAULT false,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  target_type announcement_target_type NOT NULL DEFAULT 'all',
  created_by UUID REFERENCES profiles(id),
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS announcement_targets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (announcement_id, company_id)
);

CREATE TABLE IF NOT EXISTS announcement_reads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (announcement_id, user_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_announcements_published_dates
  ON announcements (published, start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_announcement_targets_company
  ON announcement_targets (company_id);

CREATE INDEX IF NOT EXISTS idx_announcement_targets_announcement
  ON announcement_targets (announcement_id);

CREATE INDEX IF NOT EXISTS idx_announcement_reads_user_company
  ON announcement_reads (user_id, company_id);

CREATE TRIGGER announcements_updated_at
  BEFORE UPDATE ON announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.announcement_is_active(
  p_published BOOLEAN,
  p_start_at TIMESTAMPTZ,
  p_end_at TIMESTAMPTZ
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT
    p_published
    AND (p_start_at IS NULL OR p_start_at <= NOW())
    AND (p_end_at IS NULL OR p_end_at >= NOW());
$$;

CREATE OR REPLACE FUNCTION public.announcement_visible_to_company(
  p_announcement_id UUID,
  p_company_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM announcements a
    WHERE a.id = p_announcement_id
      AND public.announcement_is_active(a.published, a.start_at, a.end_at)
      AND (
        a.target_type = 'all'::announcement_target_type
        OR EXISTS (
          SELECT 1
          FROM announcement_targets t
          WHERE t.announcement_id = a.id
            AND t.company_id = p_company_id
        )
      )
  );
$$;

GRANT EXECUTE ON FUNCTION public.announcement_visible_to_company(UUID, UUID) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS: announcements
-- ---------------------------------------------------------------------------

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admin manage announcements"
  ON announcements FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform support read announcements"
  ON announcements FOR SELECT
  USING (public.is_platform_support());

CREATE POLICY "Tenants read active targeted announcements"
  ON announcements FOR SELECT
  USING (
    public.announcement_is_active(published, start_at, end_at)
    AND (
      target_type = 'all'::announcement_target_type
      OR EXISTS (
        SELECT 1
        FROM announcement_targets t
        WHERE t.announcement_id = announcements.id
          AND t.company_id IN (SELECT public.user_company_ids())
      )
    )
  );

-- ---------------------------------------------------------------------------
-- RLS: announcement_targets
-- ---------------------------------------------------------------------------

ALTER TABLE announcement_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admin manage announcement targets"
  ON announcement_targets FOR ALL
  USING (public.is_platform_admin())
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform support read announcement targets"
  ON announcement_targets FOR SELECT
  USING (public.is_platform_support());

CREATE POLICY "Tenants read targets for visible announcements"
  ON announcement_targets FOR SELECT
  USING (
    company_id IN (SELECT public.user_company_ids())
    AND public.announcement_visible_to_company(announcement_id, company_id)
  );

-- ---------------------------------------------------------------------------
-- RLS: announcement_reads
-- ---------------------------------------------------------------------------

ALTER TABLE announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform staff read announcement reads"
  ON announcement_reads FOR SELECT
  USING (
    public.is_platform_admin()
    OR public.is_platform_support()
  );

CREATE POLICY "Users insert own announcement reads"
  ON announcement_reads FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND company_id IN (SELECT public.user_company_ids())
    AND public.announcement_visible_to_company(announcement_id, company_id)
  );

CREATE POLICY "Users view own announcement reads"
  ON announcement_reads FOR SELECT
  USING (
    user_id = auth.uid()
    AND company_id IN (SELECT public.user_company_ids())
  );
