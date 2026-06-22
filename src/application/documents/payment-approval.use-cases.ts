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
import type { PaymentApprovalRepositoryPort } from "./payment-approval-repository-ports";
import type {
  PaymentApprovalPayload,
  SendPaymentApprovalResult,
} from "./payment-approval-types";
import type { PaymentVoucherRepositoryPort } from "./repository-ports";
import { assertCanCreateOrCancel } from "./authorization";

interface PaymentApprovalUseCaseDeps {
  paymentRepository: PaymentVoucherRepositoryPort;
  customerRepository: CustomerRepositoryPort;
  approvalRepository: PaymentApprovalRepositoryPort;
  activityLog: ActivityLogPort;
  uploadApprovalSignature: (
    companyId: string,
    paymentId: string,
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
  payment: Awaited<ReturnType<PaymentVoucherRepositoryPort["getById"]>>,
  customer: { name: string; phone: string }
) {
  if (!payment) throw new UseCaseError("NOT_FOUND", "Payment voucher not found");
  return {
    date: payment.date,
    amount: payment.amount,
    party_name: payment.partyName,
    description: payment.description,
    payment_method: payment.paymentMethod,
    transfer_number: payment.transferNumber,
    bank_name: payment.bankName,
    reference_number: payment.referenceNumber,
    customer_id: payment.customerId,
    customer_name: customer.name,
    customer_phone: customer.phone,
  };
}

export function buildPaymentApprovalUseCases(deps: PaymentApprovalUseCaseDeps) {
  return {
    async sendPaymentForApproval(
      ctx: TenantContext,
      paymentId: string,
      locale: string
    ): Promise<SendPaymentApprovalResult> {
      assertCanCreateOrCancel(ctx);
      if (!paymentId?.trim()) {
        throw new UseCaseError("VALIDATION", "Payment id is required");
      }

      try {
        const payment = await deps.paymentRepository.getById(ctx, paymentId);
        if (!payment) throw new UseCaseError("NOT_FOUND", "Payment voucher not found");
        if (payment.lifecycleStatus !== "draft" && payment.lifecycleStatus !== "pending_approval") {
          throw new UseCaseError(
            "VALIDATION",
            "Only draft or pending approval payments can be sent for approval"
          );
        }
        if (!payment.customerId) {
          throw new UseCaseError("VALIDATION", "Payment must be linked to a customer");
        }

        const customer = await deps.customerRepository.getById(ctx, payment.customerId);
        if (!customer) throw new UseCaseError("NOT_FOUND", "Customer not found");

        const rawToken = generateVerificationToken();
        const tokenHash = hashVerificationToken(rawToken);
        const expiresAt = verificationExpiresAt();
        const snapshot = buildSnapshot(payment, customer);

        await deps.approvalRepository.sendForApproval(
          ctx,
          paymentId,
          tokenHash,
          expiresAt,
          snapshot
        );

        const approvalUrl = `${getAppUrl()}/${locale}/approve/${rawToken}`;
        const message =
          locale === "ar"
            ? `السلام عليكم ${customer.name}،\n\nيرجى مراجعة سند الصرف والموافقة عليه عبر الرابط:\n${approvalUrl}\n\nشكراً لكم`
            : `Hello ${customer.name},\n\nPlease review and approve your payment voucher:\n${approvalUrl}\n\nThank you`;
        const whatsAppUrl = generateWhatsAppLink(resolveWhatsAppPhone(customer.phone), message);

        try {
          await deps.activityLog.log(ctx, "document.approval_sent", paymentId, {
            documentType: "payment_voucher",
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
        rethrowApprovalError(error, "Failed to send payment for approval");
      }
    },

    async getPaymentApprovalByToken(token: string): Promise<PaymentApprovalPayload> {
      if (!token?.trim() || token.length < 16) {
        throw new UseCaseError("VALIDATION", "Invalid approval token");
      }
      try {
        const tokenHash = hashVerificationToken(token);
        const payload = await deps.approvalRepository.getByTokenHash(tokenHash);
        if (!payload) throw new UseCaseError("NOT_FOUND", "Approval link not found");
        return payload;
      } catch (error) {
        rethrowApprovalError(error, "Failed to load payment approval");
      }
    },

    async approvePaymentByToken(
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
            payload.paymentId,
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
        rethrowApprovalError(error, "Failed to approve payment");
      }
    },

    async rejectPaymentByToken(
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
        rethrowApprovalError(error, "Failed to reject payment");
      }
    },
  };
}
