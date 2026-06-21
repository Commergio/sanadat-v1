"use client";

import { Controller } from "react-hook-form";
import { useLocale, useTranslations } from "next-intl";
import { isRtlLocale } from "@/i18n/routing";
import { FileText, User, Wallet, AlignLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StudioField } from "@/components/documents/studio-field";
import { StudioSection } from "@/components/documents/studio-section";
import { PaymentMethodPicker } from "@/components/documents/payment-method-picker";
import { ReceiptCustomerField } from "@/components/documents/receipt-customer-field";
import { useVoucherStudio } from "@/components/documents/voucher-studio/voucher-studio-context";
import { useRouter } from "@/i18n/navigation";

export function VoucherStudioForm() {
  const router = useRouter();
  const locale = useLocale();
  const isRtl = isRtlLocale(locale);
  const t = useTranslations("documents");
  const {
    config,
    displayNum,
    register,
    control,
    handleSubmit,
    setValue,
    errors,
    fieldValid,
    paymentMethod,
    loading,
  } = useVoucherStudio();

  const { labels, theme } = config;

  return (
    <div className="studio-inspector no-print order-2 flex flex-col border-t border-border/80 bg-background md:border-t-0 md:border-s md:border-border/80">
      <form
        onSubmit={handleSubmit}
        className="flex-1 space-y-5 overflow-y-auto p-4 lg:p-6"
        dir={isRtl ? "rtl" : "ltr"}
        noValidate
      >
        <div className="rounded-xl border border-primary/15 bg-primary/[0.03] px-4 py-3">
          <p className="text-sm font-medium">{t(labels.formTitle)}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{t(labels.formSubtitle)}</p>
        </div>

        <StudioSection
          title={t("sectionDocument")}
          description={t("sectionDocumentDesc")}
          icon={FileText}
          iconClassName={theme.documentSectionIcon}
        >
          <StudioField label={t(labels.numberLabel)} hint={t("autoNumberHint")} locked>
            <Input
              value={displayNum}
              readOnly
              dir="ltr"
              className="bg-muted/60 font-mono font-semibold tabular-nums"
            />
          </StudioField>
          <StudioField
            label={t("date")}
            error={errors.date?.message}
            showValid={fieldValid("date")}
            required
          >
            <Input type="date" {...register("date")} />
          </StudioField>
        </StudioSection>

        <StudioSection
          title={t(labels.partySectionTitle)}
          description={t(labels.partySectionDesc)}
          icon={User}
          iconClassName={theme.partySectionIcon}
        >
          {config.type === "receipt_voucher" || config.type === "payment_voucher" ? (
            <ReceiptCustomerField
              control={control}
              errors={errors}
              setValue={setValue}
              fieldValid={fieldValid}
            />
          ) : (
            <StudioField
              label={t(labels.partyLabel)}
              error={errors.party_name?.message}
              showValid={fieldValid("party_name")}
              required
            >
              <Input placeholder={t(labels.partyPlaceholder)} {...register("party_name")} />
            </StudioField>
          )}
          {(config.type === "receipt_voucher" || config.type === "payment_voucher") && (
            <StudioField label={t(labels.partyLabel)} showValid={fieldValid("party_name")}>
              <Input readOnly className="bg-muted/60" {...register("party_name")} />
            </StudioField>
          )}
          <StudioField
            label={t("amount")}
            error={errors.amount?.message}
            showValid={fieldValid("amount")}
            required
          >
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              dir="ltr"
              className="text-start text-lg font-bold tabular-nums"
              {...register("amount", {
                setValueAs: (v) =>
                  v === "" || v === null || v === undefined ? undefined : Number(v),
              })}
            />
          </StudioField>
        </StudioSection>

        <StudioSection
          title={t("sectionPayment")}
          description={t("sectionPaymentDesc")}
          icon={Wallet}
          iconClassName="bg-amber-500/10 text-amber-600"
        >
          <StudioField label={t("paymentMethod")} required>
            <Controller
              name="payment_method"
              control={control}
              render={({ field }) => (
                <PaymentMethodPicker value={field.value} onChange={field.onChange} />
              )}
            />
          </StudioField>

          {paymentMethod === "bank_transfer" && (
            <div className="space-y-4 rounded-xl border border-dashed border-amber-500/35 bg-amber-500/[0.04] p-4">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                {t("transferDetails")}
              </p>
              <StudioField label={t("bankName")} showValid={fieldValid("bank_name")}>
                <Input placeholder={t("bankPlaceholder")} {...register("bank_name")} />
              </StudioField>
              <div className="grid gap-4 sm:grid-cols-2">
                <StudioField
                  label={t("transferNumber")}
                  showValid={fieldValid("transfer_number")}
                >
                  <Input
                    dir="ltr"
                    className="text-start font-mono"
                    placeholder="TRX-000000"
                    {...register("transfer_number")}
                  />
                </StudioField>
                <StudioField label={t("transferDate")} showValid={fieldValid("transfer_date")}>
                  <Input type="date" {...register("transfer_date")} />
                </StudioField>
              </div>
            </div>
          )}

          {paymentMethod === "pos" && (
            <div className="rounded-xl border border-dashed border-violet-500/35 bg-violet-500/[0.04] p-4">
              <StudioField
                label={t("referenceNumber")}
                showValid={fieldValid("reference_number")}
              >
                <Input
                  dir="ltr"
                  className="text-start font-mono"
                  placeholder="REF-000000"
                  {...register("reference_number")}
                />
              </StudioField>
            </div>
          )}
        </StudioSection>

        <StudioSection
          title={t("sectionDetails")}
          description={t("sectionDetailsDesc")}
          icon={AlignLeft}
          iconClassName="bg-violet-500/10 text-violet-600"
        >
          <StudioField label={t("descriptionField")} showValid={fieldValid("description")}>
            <Textarea
              placeholder={t("descriptionPlaceholder")}
              rows={3}
              {...register("description")}
            />
          </StudioField>
          <StudioField label={t("notes")} showValid={fieldValid("notes")}>
            <Textarea placeholder={t("notesPlaceholder")} rows={2} {...register("notes")} />
          </StudioField>
        </StudioSection>

        <div className="flex items-start gap-2 rounded-xl border border-border/80 bg-muted/30 px-4 py-3">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            {config.type === "receipt_voucher"
              ? t("receiptApprovalNote")
              : config.type === "payment_voucher"
                ? t("paymentApprovalNote")
                : t("immutableNote")}
          </p>
        </div>

        <div className="flex gap-3 pb-4 lg:hidden">
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? t("creating") : t("save")}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {t("cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
}
