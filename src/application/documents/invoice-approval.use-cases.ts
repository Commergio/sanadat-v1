import type { TenantContext } from "@/domain";
import type { CustomerRepositoryPort } from "@/application/customers/repository-ports";
import { RepositoryError } from "@/application/shared/errors";
import { UseCaseError } from "@/application/shared/use-case-error";
import { getAppUrl } from "@/lib/env";
import { resolveWhatsAppPhone } from "@/lib/phone/whatsapp";
import { generateWhatsAppLink } from "@/lib/utils";
import {
  generateVerificationToken,
  hashVerificationToken,
  verificationExpiresAt,
} from "@/lib/verification/token";
import type { ActivityLogPort } from "./activity-log.port";
import type { InvoiceApprovalRepositoryPort } from "./invoice-approval-repository-ports";
import type {
  InvoiceApprovalPayload,
  SendInvoiceApprovalResult,
} from "./invoice-approval-types";
import type { InvoiceRepositoryPort } from "./repository-ports";
import { assertCanCreateOrCancel } from "./authorization";

interface InvoiceApprovalUseCaseDeps {
  invoiceRepository: InvoiceRepositoryPort;
  customerRepository: CustomerRepositoryPort;
  approvalRepository: InvoiceApprovalRepositoryPort;
  activityLog: ActivityLogPort;
  uploadApprovalSignature: (
    companyId: string,
    invoiceId: string,
    buffer: Buffer,
    contentType: string
  ) => Promise<string>;
}

function rethrowApprovalError(error: unknown, fallback: string): never {
  if (error instanceof UseCaseError) throw error;
  if (error instanceof RepositoryError) {
    throw new UseCaseError(error.code, error.message, error.causeData);
  }
  throw new UseCaseError("VALIDATION", fallback);
}

function buildSnapshot(
  invoice: NonNullable<Awaited<ReturnType<InvoiceRepositoryPort["getById"]>>>,
  customer: { name: string; phone: string }
) {
  return {
    date: invoice.date,
    party_name: invoice.partyName,
    description: invoice.description,
    payment_method: invoice.paymentMethod,
    transfer_number: invoice.transferNumber,
    bank_name: invoice.bankName,
    reference_number: invoice.referenceNumber,
    customer_id: invoice.customerId,
    customer_name: customer.name,
    customer_phone: customer.phone,
    items: invoice.items.map((item, idx) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total,
      sort_order: item.sortOrder ?? idx,
    })),
    subtotal: invoice.subtotal,
    discount: invoice.discount,
    tax: invoice.tax,
    total: invoice.total,
  };
}

export function buildInvoiceApprovalUseCases(deps: InvoiceApprovalUseCaseDeps) {
  return {
    async sendInvoiceForApproval(
      ctx: TenantContext,
      invoiceId: string,
      locale: string
    ): Promise<SendInvoiceApprovalResult> {
      assertCanCreateOrCancel(ctx);
      if (!invoiceId?.trim()) {
        throw new UseCaseError("VALIDATION", "Invoice id is required");
      }

      try {
        const invoice = await deps.invoiceRepository.getById(ctx, invoiceId);
        if (!invoice) throw new UseCaseError("NOT_FOUND", "Invoice not found");
        if (invoice.lifecycleStatus !== "draft") {
          throw new UseCaseError("VALIDATION", "Only draft invoices can be sent for approval");
        }
        if (!invoice.customerId) {
          throw new UseCaseError("VALIDATION", "Invoice must be linked to a customer");
        }

        const customer = await deps.customerRepository.getById(ctx, invoice.customerId);
        if (!customer) throw new UseCaseError("NOT_FOUND", "Customer not found");

        const rawToken = generateVerificationToken();
        const tokenHash = hashVerificationToken(rawToken);
        const expiresAt = verificationExpiresAt();
        const snapshot = buildSnapshot(invoice, customer);

        await deps.approvalRepository.sendForApproval(
          ctx,
          invoiceId,
          tokenHash,
          expiresAt,
          snapshot
        );

        const approvalUrl = `${getAppUrl()}/${locale}/approve/${rawToken}`;
        const message =
          locale === "ar"
            ? `السلام عليكم ${customer.name}،\n\nيرجى مراجعة الفاتورة والموافقة عليها عبر الرابط:\n${approvalUrl}\n\nشكراً لكم`
            : `Hello ${customer.name},\n\nPlease review and approve your invoice:\n${approvalUrl}\n\nThank you`;
        const whatsAppUrl = generateWhatsAppLink(resolveWhatsAppPhone(customer.phone), message);

        try {
          await deps.activityLog.log(ctx, "document.approval_sent", invoiceId, {
            documentType: "invoice",
            customerId: customer.id,
            expiresAt: expiresAt.toISOString(),
          });
        } catch {
          // Non-blocking
        }

        return {
          approvalUrl,
          whatsAppUrl,
          expiresAt: expiresAt.toISOString(),
          customerPhone: customer.phone,
        };
      } catch (error) {
        rethrowApprovalError(error, "Failed to send invoice for approval");
      }
    },

    async getInvoiceApprovalByToken(token: string): Promise<InvoiceApprovalPayload> {
      if (!token?.trim() || token.length < 16) {
        throw new UseCaseError("VALIDATION", "Invalid approval token");
      }
      try {
        const tokenHash = hashVerificationToken(token);
        const payload = await deps.approvalRepository.getByTokenHash(tokenHash);
        if (!payload) throw new UseCaseError("NOT_FOUND", "Approval link not found");
        return payload;
      } catch (error) {
        rethrowApprovalError(error, "Failed to load invoice approval");
      }
    },

    async approveInvoiceByToken(
      token: string,
      options: {
        signatureBuffer?: Buffer;
        signatureContentType?: string;
        useExistingSignaturePath?: string | null;
        approvedByName?: string | null;
        approvedByPhone?: string | null;
        ip: string | null;
        userAgent: string | null;
      }
    ) {
      if (!token?.trim() || token.length < 16) {
        throw new UseCaseError("VALIDATION", "Invalid approval token");
      }

      try {
        const tokenHash = hashVerificationToken(token);
        const payload = await deps.approvalRepository.getByTokenHash(tokenHash);
        if (!payload) throw new UseCaseError("NOT_FOUND", "Approval link not found");
        if (payload.tokenUsedAt) {
          throw new UseCaseError("CONFLICT", "Approval link already used");
        }
        if (payload.tokenExpired) {
          throw new UseCaseError("EXPIRED", "Approval link expired");
        }
        if (!payload.tokenValid) {
          throw new UseCaseError("VALIDATION", "Approval link is not valid");
        }

        let signaturePath = options.useExistingSignaturePath?.trim() || null;
        if (!signaturePath) {
          if (!options.signatureBuffer?.length) {
            throw new UseCaseError("VALIDATION", "Customer signature is required");
          }
          signaturePath = await deps.uploadApprovalSignature(
            payload.companyId,
            payload.invoiceId,
            options.signatureBuffer,
            options.signatureContentType || "image/png"
          );
        }

        const result = await deps.approvalRepository.approveByTokenHash(
          tokenHash,
          signaturePath,
          options.approvedByName ?? payload.customerName,
          options.approvedByPhone ?? payload.customerPhone,
          options.ip,
          options.userAgent
        );

        return result;
      } catch (error) {
        if (error instanceof Error && error.message === "invalid_format") {
          throw new UseCaseError("VALIDATION", "Invalid signature image format");
        }
        if (error instanceof Error && error.message === "max_size") {
          throw new UseCaseError("VALIDATION", "Signature image is too large");
        }
        rethrowApprovalError(error, "Failed to approve invoice");
      }
    },

    async rejectInvoiceByToken(
      token: string,
      reason: string,
      meta: { ip: string | null; userAgent: string | null }
    ) {
      if (!token?.trim() || token.length < 16) {
        throw new UseCaseError("VALIDATION", "Invalid approval token");
      }
      if (!reason?.trim() || reason.trim().length < 3) {
        throw new UseCaseError("VALIDATION", "Rejection reason must be at least 3 characters");
      }

      try {
        const tokenHash = hashVerificationToken(token);
        const payload = await deps.approvalRepository.getByTokenHash(tokenHash);
        if (!payload) throw new UseCaseError("NOT_FOUND", "Approval link not found");
        if (payload.tokenUsedAt) {
          throw new UseCaseError("CONFLICT", "Approval link already used");
        }
        if (payload.tokenExpired) {
          throw new UseCaseError("EXPIRED", "Approval link expired");
        }
        if (!payload.tokenValid) {
          throw new UseCaseError("VALIDATION", "Approval link is not valid");
        }

        return await deps.approvalRepository.rejectByTokenHash(
          tokenHash,
          reason.trim(),
          meta.ip,
          meta.userAgent
        );
      } catch (error) {
        rethrowApprovalError(error, "Failed to reject invoice");
      }
    },
  };
}
