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
  type VoucherStudioFormData,
} from "@/components/documents/voucher-studio/voucher-studio-context";
import type { VoucherStudioConfig } from "@/components/documents/voucher-studio/config";
import { createDocumentBaseSchema } from "@/lib/validations";
import { formatCurrency } from "@/lib/format";
import {
  useDraftAutosave,
  loadDraft,
  clearDraft,
} from "@/hooks/use-draft-autosave";
import { isRtlLocale } from "@/i18n/routing";
import type { PaymentMethod } from "@/lib/types";

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

  const { number, displayNumber, displayNumberEn } = useMemo(
    () => config.getNextNumber(),
    [config]
  );
  const displayNum = locale === "ar" ? displayNumber : displayNumberEn;

  const schema = useMemo(() => createDocumentBaseSchema(tv), [tv]);

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
    async (_data: VoucherStudioFormData) => {
      setLoading(true);
      try {
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
      errors,
      fieldValid,
      paymentMethod,
      loading,
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
      errors,
      fieldValid,
      paymentMethod,
      loading,
    ]
  );

  return (
    <VoucherStudioProvider value={contextValue}>
      <div className="flex min-h-[100dvh] flex-col bg-background lg:min-h-full">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-border/80 bg-card px-3 py-2.5 sm:gap-4 sm:px-4 lg:px-5">
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
            className="hidden shrink-0 sm:flex"
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
          pdfFilenamePrefix={pdfFilenamePrefix}
          trailing={
            <span className="hidden font-mono text-[11px] text-muted-foreground tabular-nums lg:inline">
              {displayNum}
            </span>
          }
        />

        <div className="grid min-h-0 flex-1 lg:grid-cols-2" dir={isRtl ? "rtl" : "ltr"}>
          <VoucherStudioCanvas />
          <VoucherStudioForm />
        </div>
      </div>
    </VoucherStudioProvider>
  );
}
