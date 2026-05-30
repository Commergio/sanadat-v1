"use client";

import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate } from "@/lib/format";
import { usePaymentMethodLabel } from "@/hooks/use-translated-constants";
import type { ReceiptVoucher, PaymentVoucher, Invoice, Company } from "@/lib/types";
import { useDocumentBranding } from "@/components/documents/engine";

type DocumentData = ReceiptVoucher | PaymentVoucher | Invoice;

interface A4DocumentProps {
  document: DocumentData;
  title: string;
  className?: string;
  company?: Company;
  notes?: string;
  draft?: boolean;
  partyFieldLabel?: string;
  previewPartyPlaceholder?: string;
}

function CompanyLine({ children, dir }: { children: React.ReactNode; dir?: "ltr" | "rtl" }) {
  return (
    <p className="a4-company-line" dir={dir}>
      {children}
    </p>
  );
}

export function A4Document({
  document,
  title,
  className,
  company: companyProp,
  notes,
  draft = false,
  partyFieldLabel,
  previewPartyPlaceholder,
}: A4DocumentProps) {
  const locale = useLocale();
  const t = useTranslations("documents");
  const company = useDocumentBranding(companyProp);
  const isInvoice = document.type === "invoice";
  const isReceipt = document.type === "receipt_voucher";
  const isPayment = document.type === "payment_voucher";
  const isVoucher = isReceipt || isPayment;
  const invoice = isInvoice ? (document as Invoice) : null;
  const paymentLabel = usePaymentMethodLabel(document.payment_method);
  const dir = locale === "ar" ? "rtl" : "ltr";
  const isCancelled = document.status === "cancelled";
  const isActive = document.status === "active";

  const partyDisplay =
    document.party_name?.trim() ||
    (draft ? (previewPartyPlaceholder ?? t("previewCustomerPlaceholder")) : "—");

  const partyLabel =
    partyFieldLabel ?? (isInvoice ? t("client") : t("customerName"));

  const totalAmount = invoice ? invoice.total : document.amount;

  const amountDisplay =
    totalAmount > 0
      ? formatCurrency(totalAmount, locale)
      : draft
        ? formatCurrency(0, locale)
        : "—";

  const accentClass = isReceipt
    ? "a4-document--receipt"
    : isPayment
      ? "a4-document--payment"
      : "a4-document--invoice";

  return (
    <div className={cn("print-area", className)}>
      <div
        className={cn("a4-document", accentClass, isCancelled && "a4-document--cancelled")}
        dir={dir}
      >
        {isCancelled && !draft && <div className="a4-cancelled-mark" aria-hidden />}

        {/* Status */}
        {!draft && (
          <div className="a4-status-row">
            <span
              className={cn(
                "a4-status-badge",
                isActive && "a4-status-badge--active",
                isCancelled && "a4-status-badge--cancelled"
              )}
            >
              {isActive ? t("statusActive") : t("statusCancelled")}
            </span>
            {isCancelled && document.cancel_reason && (
              <span className="a4-status-reason">
                {t("cancelReason", { reason: document.cancel_reason })}
              </span>
            )}
          </div>
        )}

        {draft && (
          <div className="a4-draft-banner">{t("draftWatermark")}</div>
        )}

        {/* Document title banner */}
        {isVoucher ? (
          <div className="a4-voucher-banner">
            <p className="a4-voucher-banner__eyebrow">{t("officialDocument")}</p>
            <h1 className="a4-voucher-banner__title">{title}</h1>
          </div>
        ) : (
          <h1 className="a4-invoice-title">{title}</h1>
        )}

        {/* Header: company + meta */}
        <header className={cn("a4-header", locale !== "ar" && "a4-header--ltr")}>
          <div className="a4-company">
            <div className="a4-company__logo-wrap">
              {company.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.logo_url}
                  alt={company.name}
                  className="a4-company__logo"
                />
              ) : (
                <div className="a4-company__logo-placeholder">
                  <span>{t("logoPlaceholder")}</span>
                </div>
              )}
            </div>
            <div className="a4-company__details">
              <p className="a4-company__name">{company.name}</p>
              {company.name_en && (
                <p className="a4-company__name-en" dir="ltr">
                  {company.name_en}
                </p>
              )}
              {company.cr_number && (
                <CompanyLine>{t("cr", { number: company.cr_number })}</CompanyLine>
              )}
              {company.vat_number && (
                <CompanyLine>{t("vat", { number: company.vat_number })}</CompanyLine>
              )}
              {company.license_number && (
                <CompanyLine>{t("license", { number: company.license_number })}</CompanyLine>
              )}
              {company.phone && (
                <CompanyLine dir="ltr">
                  {t("phoneLabel")}: {company.phone}
                </CompanyLine>
              )}
              {company.address && (
                <CompanyLine>
                  {t("addressLabel")}: {company.address}
                </CompanyLine>
              )}
            </div>
          </div>

          <div className="a4-meta">
            <div className="a4-meta__row">
              <span className="a4-meta__label">{t("numberLabel")}</span>
              <span className="a4-meta__value tabular-nums">{document.display_number}</span>
            </div>
            <div className="a4-meta__row">
              <span className="a4-meta__label">{t("dateLabel")}</span>
              <span className="a4-meta__value">
                {document.date ? formatDate(document.date, locale) : "—"}
              </span>
            </div>
          </div>
        </header>

        {/* Party + payment */}
        <div className="a4-info-grid">
          <div className="a4-info-card">
            <p className="a4-info-card__label">{partyLabel}</p>
            <p className={cn("a4-info-card__value", draft && !document.party_name && "is-placeholder")}>
              {partyDisplay}
            </p>
          </div>
          <div className="a4-info-card">
            <p className="a4-info-card__label">{t("paymentMethod")}</p>
            <p className="a4-info-card__value">{paymentLabel}</p>
            {document.bank_name && (
              <p className="a4-info-card__sub">{t("bankLabel")} {document.bank_name}</p>
            )}
            {document.transfer_number && (
              <p className="a4-info-card__sub">{t("transferLabel")} {document.transfer_number}</p>
            )}
            {document.transfer_date && (
              <p className="a4-info-card__sub">
                {t("transferDateLabel")} {formatDate(document.transfer_date, locale)}
              </p>
            )}
            {document.reference_number && (
              <p className="a4-info-card__sub">{t("referenceLabel")} {document.reference_number}</p>
            )}
          </div>
        </div>

        {/* Invoice line items */}
        {invoice && (
          <table className="a4-table">
            <thead>
              <tr>
                <th>{t("itemDescription")}</th>
                <th className="a4-table__num">{t("quantity")}</th>
                <th className="a4-table__num">{t("unitPrice")}</th>
                <th className="a4-table__num a4-table__end">{t("total")}</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td className="a4-table__num">{item.quantity}</td>
                  <td className="a4-table__num">{formatCurrency(item.unit_price, locale)}</td>
                  <td className="a4-table__num a4-table__end">{formatCurrency(item.total, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {document.description && (
          <div className="a4-block">
            <p className="a4-block__label">{t("statement")}</p>
            <p className="a4-block__text">{document.description}</p>
          </div>
        )}

        {notes?.trim() && (
          <div className="a4-block a4-block--dashed">
            <p className="a4-block__label">{t("notes")}</p>
            <p className="a4-block__text">{notes}</p>
          </div>
        )}

        {/* Totals */}
        <div className="a4-totals">
          {invoice && invoice.discount > 0 && (
            <div className="a4-totals__row">
              <span>{t("discount")}</span>
              <span className="tabular-nums">-{formatCurrency(invoice.discount, locale)}</span>
            </div>
          )}
          {invoice && (
            <div className="a4-totals__row">
              <span>{t("subtotal")}</span>
              <span className="tabular-nums">{formatCurrency(invoice.subtotal, locale)}</span>
            </div>
          )}
          <div className="a4-totals__grand">
            <span>{t("totalAmount")}</span>
            <span className="a4-totals__amount tabular-nums">{amountDisplay}</span>
          </div>
          {isVoucher && <p className="a4-totals__currency">{t("amountInSar")}</p>}
          {invoice && (
            <div className="a4-totals__row a4-totals__row--status">
              <span>{t("paymentStatusLabel")}</span>
              <span
                className={cn(
                  invoice.payment_status === "paid" && "text-emerald-700",
                  invoice.payment_status !== "paid" && "text-amber-700"
                )}
              >
                {invoice.payment_status === "paid"
                  ? t("paidStatus")
                  : invoice.payment_status === "partial"
                    ? t("partialStatus")
                    : t("unpaidStatus")}
              </span>
            </div>
          )}
        </div>

        {/* Signature & stamp */}
        <div className="a4-signatures">
          <div className="a4-signatures__item">
            <div className="a4-signatures__box">
              {company.signature_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.signature_url}
                  alt={t("signature")}
                  className="a4-signatures__image"
                />
              ) : (
                <div className="a4-signatures__line" />
              )}
            </div>
            <p className="a4-signatures__label">{t("signature")}</p>
            {company.responsible_person && (
              <p className="a4-signatures__name">{company.responsible_person}</p>
            )}
          </div>

          <div className="a4-signatures__item a4-signatures__item--stamp">
            <div className="a4-signatures__box a4-signatures__box--round">
              {company.stamp_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={company.stamp_url}
                  alt={t("stamp")}
                  className="a4-signatures__stamp"
                />
              ) : (
                <span className="a4-signatures__stamp-placeholder">{t("stampShort")}</span>
              )}
            </div>
            <p className="a4-signatures__label">{t("stamp")}</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="a4-footer">
          <div className="a4-footer__contact">
            {company.address && <p>{company.address}</p>}
            {company.phone && (
              <p dir="ltr">{company.phone}</p>
            )}
          </div>
          <p className="a4-footer__powered">{t("poweredBy")}</p>
        </footer>
      </div>
    </div>
  );
}
