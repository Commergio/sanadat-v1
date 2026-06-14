"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { UserPlus, Shield, Trash2, RefreshCcw } from "lucide-react";
import { formatDate } from "@/lib/format";
import { getSupabaseBrowserClient } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

type TeamRole = "owner" | "admin" | "accountant" | "viewer";
type ManageRole = "admin" | "accountant" | "viewer";

interface TeamMember {
  id: string;
  companyId: string;
  userId: string;
  role: TeamRole;
  acceptedAt?: string | null;
  createdAt: string;
  email?: string | null;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: TeamRole;
  expiresAt: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
}

function roleBadgeVariant(role: TeamRole): "default" | "secondary" | "outline" {
  if (role === "owner") return "default";
  if (role === "admin") return "secondary";
  return "outline";
}

const ROLE_OPTIONS: ManageRole[] = ["admin", "accountant", "viewer"];

export function TeamManagementPanel() {
  const locale = useLocale();
  const isAr = locale === "ar";
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [email, setEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ManageRole>("accountant");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [sending, setSending] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const strings = useMemo(
    () =>
      isAr
        ? {
            membersTitle: "أعضاء الفريق",
            membersDesc: "إدارة أدوار أعضاء المنشأة وصلاحياتهم",
            invitesTitle: "الدعوات المعلقة",
            invitesDesc: "دعوات الانضمام التي لم تُقبل بعد",
            inviteTitle: "دعوة عضو جديد",
            inviteDesc: "أرسل دعوة بالبريد مع تحديد الدور",
            email: "البريد الإلكتروني",
            role: "الدور",
            joinedAt: "تاريخ الانضمام",
            expiresAt: "تنتهي في",
            status: "الحالة",
            actions: "الإجراءات",
            sendInvite: "إرسال الدعوة",
            refresh: "تحديث",
            emptyMembers: "لا يوجد أعضاء آخرون حتى الآن",
            emptyInvites: "لا توجد دعوات معلقة",
            permissionDenied: "ليس لديك صلاحية إدارة الفريق",
            permissionDeniedDesc: "إدارة الفريق متاحة فقط للمالك أو المدير.",
            owner: "مالك",
            admin: "مدير",
            accountant: "محاسب",
            viewer: "مشاهد",
            active: "نشط",
            pending: "معلقة",
            accepted: "مقبولة",
            revoked: "ملغاة",
            expired: "منتهية",
            changeRole: "تغيير الدور",
            remove: "إزالة",
            revoke: "إلغاء الدعوة",
            self: "أنت",
            sentSuccess: "تم إرسال الدعوة بنجاح",
            sentFailed: "فشل إرسال الدعوة",
            roleUpdated: "تم تحديث الدور",
            roleUpdateFailed: "فشل تحديث الدور",
            removed: "تمت إزالة العضو",
            removeFailed: "فشل إزالة العضو",
            revokedSuccess: "تم إلغاء الدعوة",
            revokedFailed: "فشل إلغاء الدعوة",
            loadFailed: "فشل تحميل بيانات الفريق",
          }
        : {
            membersTitle: "Team Members",
            membersDesc: "Manage company members and their roles",
            invitesTitle: "Pending Invitations",
            invitesDesc: "Invitations that are still awaiting acceptance",
            inviteTitle: "Invite New Member",
            inviteDesc: "Send an email invitation with a specific role",
            email: "Email",
            role: "Role",
            joinedAt: "Joined",
            expiresAt: "Expires",
            status: "Status",
            actions: "Actions",
            sendInvite: "Send Invitation",
            refresh: "Refresh",
            emptyMembers: "No additional members yet",
            emptyInvites: "No pending invitations",
            permissionDenied: "You do not have team management permission",
            permissionDeniedDesc: "Team management is allowed for owner/admin only.",
            owner: "Owner",
            admin: "Admin",
            accountant: "Accountant",
            viewer: "Viewer",
            active: "Active",
            pending: "Pending",
            accepted: "Accepted",
            revoked: "Revoked",
            expired: "Expired",
            changeRole: "Change Role",
            remove: "Remove",
            revoke: "Revoke",
            self: "You",
            sentSuccess: "Invitation sent successfully",
            sentFailed: "Failed to send invitation",
            roleUpdated: "Role updated",
            roleUpdateFailed: "Failed to update role",
            removed: "Member removed",
            removeFailed: "Failed to remove member",
            revokedSuccess: "Invitation revoked",
            revokedFailed: "Failed to revoke invitation",
            loadFailed: "Failed to load team data",
          },
    [isAr]
  );

  const roleLabel = (role: TeamRole) => strings[role];

  const resolveInvitationStatus = (inv: TeamInvitation) => {
    if (inv.revokedAt) return strings.revoked;
    if (inv.acceptedAt) return strings.accepted;
    if (new Date(inv.expiresAt).getTime() < Date.now()) return strings.expired;
    return strings.pending;
  };

  async function loadData() {
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserEmail((user?.email ?? "").toLowerCase());

      const [membersRes, invitesRes] = await Promise.all([
        fetch("/api/team/members", { cache: "no-store" }),
        fetch("/api/team/invitations", { cache: "no-store" }),
      ]);

      const membersPayload = await membersRes.json();
      const invitesPayload = await invitesRes.json();

      if (membersRes.ok) {
        setMembers((membersPayload.items ?? []) as TeamMember[]);
      } else if (!membersRes.ok && membersRes.status !== 403) {
        toast.error(strings.loadFailed);
      }
      if (invitesRes.ok) {
        setInvitations((invitesPayload.items ?? []) as TeamInvitation[]);
        setPermissionDenied(false);
      } else if (invitesRes.status === 403) {
        setInvitations([]);
        setPermissionDenied(true);
      } else {
        toast.error(strings.loadFailed);
      }
    } catch {
      toast.error(strings.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const currentUserRole = useMemo(() => {
    const found = members.find((m) => (m.email ?? "").toLowerCase() === currentUserEmail);
    return found?.role;
  }, [members, currentUserEmail]);

  const canManage = currentUserRole === "owner" || currentUserRole === "admin";

  const openInvitations = useMemo(
    () =>
      invitations.filter((inv) => !inv.acceptedAt && !inv.revokedAt),
    [invitations]
  );

  const isInvitationExpired = (inv: TeamInvitation) =>
    new Date(inv.expiresAt).getTime() < Date.now();

  const sendInvite = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/team/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: inviteRole }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload?.error?.message || strings.sentFailed);
        return;
      }
      toast.success(strings.sentSuccess);
      setEmail("");
      await loadData();
    } catch {
      toast.error(strings.sentFailed);
    } finally {
      setSending(false);
    }
  };

  const changeRole = async (memberId: string, role: ManageRole) => {
    setBusyId(memberId);
    try {
      const res = await fetch(`/api/team/members/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload?.error?.message || strings.roleUpdateFailed);
        return;
      }
      toast.success(strings.roleUpdated);
      await loadData();
    } catch {
      toast.error(strings.roleUpdateFailed);
    } finally {
      setBusyId(null);
    }
  };

  const removeMember = async (memberId: string) => {
    setBusyId(memberId);
    try {
      const res = await fetch(`/api/team/members/${memberId}`, { method: "DELETE" });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload?.error?.message || strings.removeFailed);
        return;
      }
      toast.success(strings.removed);
      await loadData();
    } catch {
      toast.error(strings.removeFailed);
    } finally {
      setBusyId(null);
    }
  };

  const revokeInvitation = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/team/invitations/${id}/revoke`, { method: "POST" });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload?.error?.message || strings.revokedFailed);
        return;
      }
      toast.success(strings.revokedSuccess);
      await loadData();
    } catch {
      toast.error(strings.revokedFailed);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="dashboard-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">{strings.inviteTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{strings.inviteDesc}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => void loadData()} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            {strings.refresh}
          </Button>
        </div>
        {canManage ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-12">
            <div className="space-y-2 sm:col-span-6">
              <Label>{strings.email}</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
              />
            </div>
            <div className="space-y-2 sm:col-span-3">
              <Label>{strings.role}</Label>
              <Select value={inviteRole} onValueChange={(v: ManageRole) => setInviteRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((role) => (
                    <SelectItem key={role} value={role}>
                      {roleLabel(role)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-3 sm:self-end">
              <Button
                className="w-full gap-2"
                onClick={() => void sendInvite()}
                disabled={sending || !email.trim()}
              >
                <UserPlus className="h-4 w-4" />
                {strings.sendInvite}
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
            {strings.permissionDeniedDesc}
          </p>
        )}
      </section>

      <section className="dashboard-card overflow-hidden">
        <div className="border-b border-border/80 px-5 py-4 sm:px-6">
          <h3 className="text-base font-semibold">{strings.membersTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{strings.membersDesc}</p>
        </div>
        {members.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">{strings.emptyMembers}</p>
        ) : (
          <>
            <div className="divide-y divide-border/60 md:hidden">
              {members.map((member) => {
                const isOwner = member.role === "owner";
                const isSelf = (member.email ?? "").toLowerCase() === currentUserEmail;
                const canAct = canManage && !isOwner && !isSelf;
                return (
                  <div key={member.id} className="space-y-3 px-4 py-4 sm:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{member.email ?? "—"}</p>
                        {isSelf ? (
                          <Badge variant="outline" className="mt-1 text-[10px]">
                            {strings.self}
                          </Badge>
                        ) : null}
                      </div>
                      <Badge variant={roleBadgeVariant(member.role)}>{roleLabel(member.role)}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {strings.joinedAt}: {formatDate(member.acceptedAt ?? member.createdAt, locale)}
                    </p>
                    {canAct && ROLE_OPTIONS.includes(member.role as ManageRole) ? (
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Select
                          value={member.role as ManageRole}
                          onValueChange={(v: ManageRole) => void changeRole(member.id, v)}
                          disabled={busyId === member.id}
                        >
                          <SelectTrigger className="h-9 w-full sm:w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role} value={role}>
                                {roleLabel(role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1 text-destructive sm:w-auto"
                          onClick={() => void removeMember(member.id)}
                          disabled={busyId === member.id}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {strings.remove}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">{strings.email}</th>
                  <th className="px-4 py-3 text-start font-medium">{strings.role}</th>
                  <th className="px-4 py-3 text-start font-medium">{strings.joinedAt}</th>
                  <th className="px-4 py-3 text-start font-medium">{strings.status}</th>
                  <th className="px-4 py-3 text-start font-medium">{strings.actions}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const isOwner = member.role === "owner";
                  const isSelf = (member.email ?? "").toLowerCase() === currentUserEmail;
                  const canAct = canManage && !isOwner && !isSelf;
                  return (
                    <tr key={member.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span>{member.email ?? "—"}</span>
                          {isSelf ? (
                            <Badge variant="outline" className="text-[10px]">
                              {strings.self}
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={roleBadgeVariant(member.role)}>{roleLabel(member.role)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(member.acceptedAt ?? member.createdAt, locale)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="success">{strings.active}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {canAct && ROLE_OPTIONS.includes(member.role as ManageRole) ? (
                          <div className="flex items-center gap-2">
                            <Select
                              value={member.role as ManageRole}
                              onValueChange={(v: ManageRole) => void changeRole(member.id, v)}
                              disabled={busyId === member.id}
                            >
                              <SelectTrigger className="h-8 w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ROLE_OPTIONS.map((role) => (
                                  <SelectItem key={role} value={role}>
                                    {roleLabel(role)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-destructive"
                              onClick={() => void removeMember(member.id)}
                              disabled={busyId === member.id}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {strings.remove}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        )}
      </section>

      <section className="dashboard-card overflow-hidden">
        <div className="border-b border-border/80 px-5 py-4 sm:px-6">
          <h3 className="text-base font-semibold">{strings.invitesTitle}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{strings.invitesDesc}</p>
        </div>
        {permissionDenied ? (
          <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">{strings.permissionDenied}</p>
        ) : openInvitations.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">{strings.emptyInvites}</p>
        ) : (
          <>
            <div className="divide-y divide-border/60 md:hidden">
              {openInvitations.map((inv) => {
                const status = resolveInvitationStatus(inv);
                const canRevoke =
                  canManage && !inv.acceptedAt && !inv.revokedAt && !isInvitationExpired(inv);
                return (
                  <div key={inv.id} className="space-y-3 px-4 py-4 sm:px-6">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 truncate font-medium">{inv.email}</p>
                      <Badge variant={roleBadgeVariant(inv.role)}>{roleLabel(inv.role)}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>
                        {strings.expiresAt}: {formatDate(inv.expiresAt, locale)}
                      </span>
                      <Badge variant={status === strings.pending ? "warning" : "outline"}>{status}</Badge>
                    </div>
                    {canRevoke ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-destructive"
                        onClick={() => void revokeInvitation(inv.id)}
                        disabled={busyId === inv.id}
                      >
                        <Shield className="h-3.5 w-3.5" />
                        {strings.revoke}
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/80 bg-muted/30 text-xs text-muted-foreground">
                  <th className="px-4 py-3 text-start font-medium">{strings.email}</th>
                  <th className="px-4 py-3 text-start font-medium">{strings.role}</th>
                  <th className="px-4 py-3 text-start font-medium">{strings.expiresAt}</th>
                  <th className="px-4 py-3 text-start font-medium">{strings.status}</th>
                  <th className="px-4 py-3 text-start font-medium">{strings.actions}</th>
                </tr>
              </thead>
              <tbody>
                {openInvitations.map((inv) => {
                  const status = resolveInvitationStatus(inv);
                  const canRevoke =
                    canManage && !inv.acceptedAt && !inv.revokedAt && !isInvitationExpired(inv);
                  return (
                    <tr key={inv.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-3">{inv.email}</td>
                      <td className="px-4 py-3">
                        <Badge variant={roleBadgeVariant(inv.role)}>{roleLabel(inv.role)}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.expiresAt, locale)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={status === strings.pending ? "warning" : "outline"}>{status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        {canRevoke ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-destructive"
                            onClick={() => void revokeInvitation(inv.id)}
                            disabled={busyId === inv.id}
                          >
                            <Shield className="h-3.5 w-3.5" />
                            {strings.revoke}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
