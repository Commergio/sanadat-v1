# P A.5 — Support Tickets

**Status:** Implemented.  
**Depends on:** [P A.1](./pA1-platform-admin-data-layer.md), [P A.2](./pA2-platform-admin-apis.md), tenant auth (P0).

Tenant users open support tickets; platform staff manage status, assignment, and replies. No CMS or billing changes.

---

## Database (`016_pA5_support_tickets.sql`)

| Table | Purpose |
|-------|---------|
| `support_tickets` | Subject, description, status, priority, assignee |
| `support_ticket_notes` | Thread messages; `internal_only` for staff-only notes |

**Enums:** `support_ticket_status` (`open` \| `in_progress` \| `resolved` \| `closed`), `support_ticket_priority` (`low` \| `normal` \| `high` \| `urgent`).

---

## RLS

| Role | tickets | notes |
|------|---------|-------|
| Tenant member | SELECT/INSERT own company | SELECT public notes; INSERT non-internal |
| `platform_support` / `platform_admin` | SELECT all; UPDATE status/priority/assignee | SELECT all; INSERT any |
| Delete | Not exposed (no DELETE policies) | — |

---

## APIs

### Tenant (`requireTenantContext`)

| Method | Path |
|--------|------|
| GET | `/api/support/tickets` |
| POST | `/api/support/tickets` |
| GET | `/api/support/tickets/[id]` |
| POST | `/api/support/tickets/[id]/notes` |

List query: `page`, `limit`, `search`, `status`, `priority`.

### Platform (`requirePlatformContext('staff')`)

| Method | Path |
|--------|------|
| GET | `/api/platform/support/tickets` |
| GET | `/api/platform/support/tickets/[id]` |
| PATCH | `/api/platform/support/tickets/[id]` |
| POST | `/api/platform/support/tickets/[id]/notes` |

Platform list adds `company_id` filter.

---

## Activity logs

| Action | When |
|--------|------|
| `support.ticket_created` | Tenant creates ticket |
| `support.ticket_updated` | Staff updates ticket |
| `support.note_added` | Note added (metadata includes `internal_only`) |

`entity_type`: `support_ticket`.

---

## UI

| Route | Audience |
|-------|----------|
| `/[locale]/dashboard/support` | List + create ticket |
| `/[locale]/dashboard/support/[id]` | Detail + tenant reply |
| `/[locale]/admin/support` | All tickets, filters |
| `/[locale]/admin/support/[id]` | Manage + internal/public notes |

---

## Application layer

- `src/application/support/` — schemas, use cases, factory
- `src/infrastructure/supabase/repositories/support/support.repository.ts`
- `src/hooks/use-support.ts` — tenant + platform client hooks
