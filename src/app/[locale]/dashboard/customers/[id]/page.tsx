"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowRight, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { DashboardHeader } from "@/components/dashboard/header";
import { CustomerProfileCard } from "@/components/dashboard/customers-panel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchCustomer, updateCustomer, sendCustomerVerification } from "@/hooks/use-customers";
import { useCompany } from "@/hooks/use-company";
import { hasMinimumTenantRole } from "@/lib/tenant/roles";
import type { Customer } from "@/lib/types";
import { isRtlLocale } from "@/i18n/routing";
import { useLocale } from "next-intl";
import { generateWhatsAppLink } from "@/lib/utils";
import { resolveWhatsAppPhone } from "@/lib/phone/whatsapp";

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const locale = useLocale();
  const isRtl = isRtlLocale(locale);
  const BackChevron = isRtl ? ChevronRight : ArrowRight;
  const t = useTranslations("dashboard.customers");
  const { tenantRole, company } = useCompany();
  const canWrite = tenantRole != null && hasMinimumTenantRole(tenantRole, "accountant");

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    nationalId: "",
  });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchCustomer(params.id);
        if (!cancelled) {
          setCustomer(data);
          setForm({
            name: data.name,
            phone: data.phone,
            email: data.email ?? "",
            nationalId: data.national_id ?? "",
          });
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : t("loadFailed"));
          router.push("/dashboard/customers");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [params.id, router, t]);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    try {
      const updated = await updateCustomer(customer.id, {
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        nationalId: form.nationalId || null,
      });
      setCustomer(updated);
      setEditOpen(false);
      toast.success(t("updateSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleSendVerification = async () => {
    if (!customer || !canWrite) return;
    setSendingVerification(true);
    try {
      const { verificationUrl } = await sendCustomerVerification(customer.id, locale);
      const message = t("whatsappVerificationMessage", {
        name: customer.name,
        company: company?.name ?? t("companyFallback"),
        link: verificationUrl,
      });
      window.open(generateWhatsAppLink(resolveWhatsAppPhone(customer.phone), message), "_blank");
      toast.success(t("verificationSent"));
      const refreshed = await fetchCustomer(customer.id);
      setCustomer(refreshed);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("verificationSendFailed"));
    } finally {
      setSendingVerification(false);
    }
  };

  return (
    <>
      <DashboardHeader title={customer?.name ?? t("profile")} description={t("profileSubtitle")} />
      <main className="mx-auto max-w-2xl flex-1 space-y-4 p-4 pb-24 app-safe-bottom lg:p-8 lg:pb-8">
        <Button variant="ghost" size="sm" className="gap-2 -ms-2" asChild>
          <Link href="/dashboard/customers">
            <BackChevron className="h-4 w-4" />
            {t("backToList")}
          </Link>
        </Button>
        {loading ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : customer ? (
          <CustomerProfileCard
            customer={customer}
            onEdit={canWrite ? () => setEditOpen(true) : undefined}
            onSendVerification={canWrite ? () => void handleSendVerification() : undefined}
            sendingVerification={sendingVerification}
          />
        ) : null}
      </main>

      <Dialog open={editOpen && canWrite} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("editCustomer")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("name")}</Label>
              <Input
                id="edit-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-phone">{t("phone")}</Label>
              <Input
                id="edit-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                dir="ltr"
                className="text-start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">{t("emailOptional")}</Label>
              <Input
                id="edit-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                dir="ltr"
                className="text-start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-national-id">{t("nationalIdOptional")}</Label>
              <Input
                id="edit-national-id"
                value={form.nationalId}
                onChange={(e) => setForm((f) => ({ ...f, nationalId: e.target.value }))}
                dir="ltr"
                className="text-start"
              />
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || !form.name.trim() || !form.phone.trim()}
            >
              {saving ? t("saving") : t("save")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
