# P A.4 — Platform Announcements

**Status:** Implemented.  
**Depends on:** [P A.1](./pA1-platform-admin-data-layer.md), [P A.2](./pA2-platform-admin-apis.md), admin routing (A.3).

Broadcast messages from platform staff to tenant dashboards. No CMS, support tickets, or billing changes.

---

## Database (`015_pA4_announcements.sql`)

| Table | Purpose |
|-------|---------|
| `announcements` | Bilingual title/content, priority, publish window, target type |
| `announcement_targets` | `company_id` when `target_type = specific` |
| `announcement_reads` | Per user + company dismiss/read tracking |

**Enums:** `announcement_priority` (`info` \| `warning` \| `success` \| `critical`), `announcement_target_type` (`all` \| `specific`).

**Active:** `published` and optional `start_at` / `end_at` window (`announcement_is_active()`).

---

## RLS

| Role | announcements | targets | reads |
|------|---------------|---------|-------|
| `platform_admin` | CRUD | CRUD | SELECT |
| `platform_support` | SELECT | SELECT | SELECT |
| Tenant member | SELECT active, targeted | SELECT visible | INSERT/SELECT own |

Tenants use `user_company_ids()` and `announcement_visible_to_company()` for targeting.

---

## APIs

### Platform (staff / admin)

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/platform/announcements` | staff |
| POST | `/api/platform/announcements` | admin |
| PATCH | `/api/platform/announcements/[id]` | admin |
| DELETE | `/api/platform/announcements/[id]` | admin |

List query: `page`, `limit`, `search`.

### Tenant

| Method | Path | Access |
|--------|------|--------|
| GET | `/api/announcements` | `requireTenantContext` — active targeted, includes `read` flag |
| POST | `/api/announcements/[id]/read` | mark read / dismiss |

---

## UI

| Route | Audience |
|-------|----------|
| `/[locale]/admin/announcements` | Platform staff list; admin CRUD |
| Tenant dashboard | `AnnouncementBanners` — unread active announcements, dismiss → read |

---

## Application layer

- `src/application/announcements/` — schemas, use cases, factory
- `src/infrastructure/supabase/repositories/announcements/announcement.repository.ts`
