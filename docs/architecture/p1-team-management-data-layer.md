# P1.9.1 — Team Management Data Layer

**Status:** Implemented in migration `008_p1_team_management_data_layer.sql`  
**Scope:** Database lifecycle, RPC contracts, and RLS hardening (no API/UI/use-cases).

## Objectives

Prepare secure tenant team management foundations:

- Invitation lifecycle controls (`pending`, `accepted`, `revoked`, `expired`)
- Role-safe member management
- Owner invariants (`no owner invite`, `no owner removal`, `no orphan-owner state`)
- DB-first security via `SECURITY DEFINER` RPC contracts

## Schema updates

### `company_invitations`

Added:

- `revoked_at TIMESTAMPTZ`
- `revoked_by UUID REFERENCES profiles(id)`

### Indexes

- `idx_company_invitations_company_email_active`  
  `(company_id, lower(email)) WHERE accepted_at IS NULL AND revoked_at IS NULL`
- `idx_company_members_company_role`  
  `(company_id, role)`

### Partial uniqueness

- `uq_company_invitations_active_company_email`  
  Enforces only one active invitation per `(company_id, lower(email))`.

## Invitation lifecycle rules

- **pending:** `accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now`
- **accepted:** `accepted_at IS NOT NULL`
- **revoked:** `revoked_at IS NOT NULL`
- **expired:** `expires_at <= now` and not accepted/revoked

## RPC contracts

All RPCs run as `SECURITY DEFINER` with `search_path = public` and are granted to `authenticated`.

### 1) `invite_company_member(p_company_id, p_email, p_role, p_expires_in_hours) -> uuid`

Creates or refreshes an active invitation.

Validation:

- caller authenticated
- caller has `admin+` in target company
- role cannot be `owner`
- email required
- expiry window in valid range
- cannot invite an already existing member

Behavior:

- if active invite exists for same `(company, email)`, refreshes role/token/expiry
- else inserts new invitation

### 2) `accept_company_invitation(p_token) -> uuid`

Accepts an invitation for current authenticated user.

Validation:

- authenticated user required
- token must exist and be pending
- invitation must not be expired
- invitation email must match authenticated JWT email
- invitation role cannot be `owner`

Behavior:

- inserts `company_members` if user not already a member
- marks invitation `accepted_at`
- returns `company_id`

### 3) `change_company_member_role(p_member_id, p_new_role) -> void`

Changes member role with invariants.

Validation:

- authenticated + `admin+` in member company
- target member must exist
- `p_new_role` cannot be `owner`
- demoting owner is blocked if it would create orphan-owner state

### 4) `remove_company_member(p_member_id) -> void`

Removes non-owner member.

Validation:

- authenticated + `admin+` in member company
- target member must exist
- target cannot be owner
- owner invariants enforced

### 5) `revoke_company_invitation(p_invitation_id) -> void`

Revokes pending invitation.

Validation:

- authenticated + `admin+` in invitation company
- invitation exists
- accepted invitation cannot be revoked

Behavior:

- sets `revoked_at` and `revoked_by`

## RLS hardening

### `company_invitations`

- Replaced invitation policies with explicit admin-only manage rules.
- Insert/Update policies explicitly reject `role = 'owner'`.
- Added explicit delete policy for admin-only invitation cleanup.

### `company_members`

- Dropped direct `UPDATE` and `DELETE` admin policies.
- Replaced with deny-all direct mutations:
  - `No direct membership updates`
  - `No direct membership deletes`

Reason: enforce owner invariants only through vetted RPC contracts.

## Security model notes

- Role and lifecycle invariants are now enforced at DB level, not only app level.
- Acceptance identity is bound to authenticated email claim.
- Membership mutation path is controlled and auditable through RPC calls.

## Out of scope (next phase)

- API routes for invites/member management
- Team management UI page
- Application-layer use-cases and error mapping
