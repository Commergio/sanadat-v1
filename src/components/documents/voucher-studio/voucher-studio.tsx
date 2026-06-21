"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { DocumentStudioToolbar } from "@/components/documents/engine";
import { AutosaveIndicator } from "@/components/documents/autosave-indicator";
import { VoucherStudioCanvas } from "@/components/documents/voucher-studio/voucher-studio-canvas";
import { VoucherStudioForm } from "@/components/documents/voucher-studio/voucher-studio-form";
import {
  VoucherStudioProvider,
  type StudioViewMode,
  type VoucherStudioFormData,
} from "@/components/documents/voucher-studio/voucher-studio-context";
import type { VoucherStudioConfig } from "@/components/documents/voucher-studio/config";
import { createDocumentBaseSchema } from "@/lib/validations";
import { z } from "zod";
import { formatCurrency } from "@/lib/format";
import {
  useDraftAutosave,
  loadDraft,
  clearDraft,
} from "@/hooks/use-draft-autosave";
import { isRtlLocale } from "@/i18n/routing";
import type { PaymentMethod } from "@/lib/types";
import { cn } from "@/lib/utils";

const defaultFormValues: Partial<VoucherStudioFormData> = {
  date: new Date().toISOString().split("T")[0],
  party_name: "",
  description: "",
  notes: "",
  payment_method: "cash",
  transfer_number: "",
  bank_name: "",
  transfer_date: "",
  reference_number: "",
};

interface VoucherStudioProps {
  config: VoucherStudioConfig;
}

export function VoucherStudio({ config }: VoucherStudioProps) {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = isRtlLocale(locale);
  const t = useTranslations("documents");
  const tv = useTranslations("validation");
  const [loading, setLoading] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<StudioViewMode>("edit");

  const { number, displayNumber, displayNumberEn } = useMemo(
    () => config.getNextNumber(),
    [config]
  );
  const displayNum =
    config.type === "receipt_voucher" || config.type === "payment_voucher"
      ? t("draftNumberLabel")
      : locale === "ar"
        ? displayNumber
        : displayNumberEn;

  const schema = useMemo(() => {
    const base = createDocumentBaseSchema(tv);
    if (config.type === "receipt_voucher" || config.type === "payment_voucher") {
      return base.extend({
        customer_id: z.string().uuid(tv("customerRequired")),
      });
    }
    return base;
  }, [tv, config.type]);

  const form = useForm<VoucherStudioFormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: defaultFormValues,
  });

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, touchedFields, dirtyFields },
  } = form;

  useEffect(() => {
    const draft = loadDraft<VoucherStudioFormData>(config.draftStorageKey);
    if (draft) {
      reset({ ...defaultFormValues, ...draft });
    }
    setDraftLoaded(true);
  }, [reset, config.draftStorageKey]);

  const values = watch();
  const paymentMethod = (values.payment_method ?? "cash") as PaymentMethod;

  const { status: autosaveStatus, lastSavedAt } = useDraftAutosave(
    config.draftStorageKey,
    values,
    draftLoaded
  );

  const amountLabel = formatCurrency(Number(values.amount) || 0, locale);

  const fieldValid = (name: keyof VoucherStudioFormData) =>
    Boolean(touchedFields[name] || dirtyFields[name]) &&
    !errors[name] &&
    values[name] !== undefined &&
    values[name] !== "" &&
    !(name === "amount" && !values.amount);

  const onSubmit = useCallback(
    async (data: VoucherStudioFormData) => {
      setLoading(true);
      try {
        if (config.type === "receipt_voucher" || config.type === "payment_voucher") {
          const endpoint =
            config.type === "receipt_voucher" ? "/api/receipts" : "/api/payment-vouchers";
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              date: data.date,
              amount: Number(data.amount),
              partyName: data.party_name,
              customerId: data.customer_id,
              description: data.description,
              notes: data.notes,
              paymentMethod: data.payment_method,
              transferNumber: data.transfer_number,
              bankName: data.bank_name,
              transferDate: data.transfer_date,
              referenceNumber: data.reference_number,
            }),
          });
          const payload = await response.json();
          if (!response.ok) {
            const code = payload?.error?.code as string | undefined;
            const message = code === "VALIDATION"
              ? "Validation error: please check required fields and amount."
              : code === "FORBIDDEN"
                ? `You do not have permission to create ${config.type === "receipt_voucher" ? "receipts" : "payment vouchers"}.`
                : code === "NOT_FOUND"
                  ? "Tenant context not found. Please refresh and try again."
                  : code === "CONFLICT"
                    ? "Document number conflict. Please retry."
                    : payload?.error?.message || "Supabase/RLS error while creating document.";
            toast.error(message);
            return;
          }
          clearDraft(config.draftStorageKey);
          toast.success(
            config.type === "receipt_voucher" || config.type === "payment_voucher"
              ? t("draftSaveSuccess")
              : t("createSuccess")
          );
          router.push(payload.redirectPath ?? config.redirectPath);
          return;
        }

        await new Promise((r) => setTimeout(r, 900));
        clearDraft(config.draftStorageKey);
        toast.success(t("createSuccess"));
        router.push(config.redirectPath);
      } catch {
        toast.error(t("createFailed"));
      } finally {
        setLoading(false);
      }
    },
    [router, t, config.draftStorageKey, config.redirectPath]
  );

  const BackChevron = isRtl ? ChevronRight : ArrowRight;
  const { labels, theme, previewElementId, pdfFilenamePrefix } = config;

  const contextValue = useMemo(
    () => ({
      config,
      displayNum,
      number,
      register,
      control,
      handleSubmit: handleSubmit(onSubmit),
      watch,
      setValue,
      errors,
      fieldValid,
      paymentMethod,
      loading,
      viewMode,
      setViewMode,
    }),
    [
      config,
      displayNum,
      number,
      register,
      control,
      handleSubmit,
      onSubmit,
      watch,
      setValue,
      errors,
      fieldValid,
      paymentMethod,
      loading,
      viewMode,
    ]
  );

  return (
    <VoucherStudioProvider value={contextValue}>
      <div
        className={cn(
          "document-studio flex min-h-[100dvh] flex-col bg-background lg:min-h-full",
          viewMode === "preview" && "document-studio--preview"
        )}
      >
        <header
          className={cn(
            "document-studio-header no-print flex shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-card px-3 py-2.5 sm:gap-4 sm:px-4 lg:px-5",
            viewMode === "preview" && "lg:flex"
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <BackChevron className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <p
                className={`text-[10px] font-semibold uppercase tracking-widest ${theme.headerAccent}`}
              >
                {t("studioLabel")}
              </p>
              <h1 className="truncate text-sm font-bold tracking-tight sm:text-base">
                {t(labels.newTitle)}
              </h1>
            </div>
          </div>
          <AutosaveIndicator
            status={autosaveStatus}
            lastSavedAt={lastSavedAt}
            className={cn("hidden shrink-0 sm:flex", viewMode === "preview" && "sm:hidden lg:flex")}
          />
        </header>

        <DocumentStudioToolbar
          previewId={previewElementId}
          documentNumber={displayNum}
          partyName={values.party_name ?? ""}
          amountLabel={amountLabel}
          documentTitle={t(labels.documentTitle)}
          saving={loading}
          onSave={handleSubmit(onSubmit)}
          onCancel={() => router.back()}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          pdfFilenamePrefix={pdfFilenamePrefix}
          hideExportActions={
            config.type === "receipt_voucher" || config.type === "payment_voucher"
          }
          shareMeta={{
            documentType: config.type,
            documentNumber: displayNum,
            partyName: values.party_name ?? "",
            amountLabel,
            documentTitle: t(labels.documentTitle),
            exportEnabled: false,
            lifecycleStatus: "draft",
          }}
          trailing={
            <span className="hidden font-mono text-[11px] text-muted-foreground tabular-nums lg:inline">
              {displayNum}
            </span>
          }
        />

        <div
          className={cn(
            "grid min-h-0 flex-1",
            viewMode === "preview"
              ? "grid-cols-1"
              : "grid-cols-1 md:grid-cols-2"
          )}
          dir={isRtl ? "rtl" : "ltr"}
        >
          <VoucherStudioCanvas />
          {viewMode === "edit" ? <VoucherStudioForm /> : null}
        </div>
      </div>
    </VoucherStudioProvider>
  );
}
