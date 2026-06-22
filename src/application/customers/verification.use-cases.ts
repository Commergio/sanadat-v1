import type { TenantContext } from "@/domain";
import type { ActivityLogPort } from "@/application/documents";
import { RepositoryError } from "@/application/shared/errors";
import { UseCaseError } from "@/application/shared/use-case-error";
import { getAppUrl } from "@/lib/env";
import {
  generateVerificationToken,
  hashVerificationToken,
  verificationExpiresAt,
} from "@/lib/verification/token";
import { uploadCustomerSignature } from "@/lib/storage/customer-signature";
import { assertCanReadCustomers, assertCanWriteCustomers } from "./authorization";
import type { CustomerRepositoryPort } from "./repository-ports";
import type { CustomerVerificationRepositoryPort } from "./verification-repository-ports";
import type { CustomerVerificationPayload, SendCustomerVerificationResult } from "./verification-types";

interface CustomerVerificationUseCaseDeps {
  customerRepository: CustomerRepositoryPort;
  verificationRepository: CustomerVerificationRepositoryPort;
  activityLog: ActivityLogPort;
  uploadSignature: (
    companyId: string,
    customerId: string,
    buffer: Buffer,
    contentType: string
  ) => Promise<string>;
}

function rethrowVerificationError(error: unknown, fallback: string): never {
  if (error instanceof UseCaseError) throw error;
  if (error instanceof RepositoryError) {
    throw new UseCaseError(error.code, error.message, error.causeData);
  }
  throw new UseCaseError("VALIDATION", fallback);
}

export function buildCustomerVerificationUseCases(deps: CustomerVerificationUseCaseDeps) {
  return {
    async sendCustomerVerification(
      ctx: TenantContext,
      customerId: string,
      locale: string
    ): Promise<SendCustomerVerificationResult> {
      assertCanWriteCustomers(ctx);
      if (!customerId?.trim()) {
        throw new UseCaseError("VALIDATION", "Customer id is required");
      }

      try {
        const customer = await deps.customerRepository.getById(ctx, customerId);
        if (!customer) throw new UseCaseError("NOT_FOUND", "Customer not found");
        if (customer.isVerified) {
          throw new UseCaseError("CONFLICT", "Customer is already verified");
        }

        const rawToken = generateVerificationToken();
        const tokenHash = hashVerificationToken(rawToken);
        const expiresAt = verificationExpiresAt();

        await deps.verificationRepository.storeVerificationToken(
          ctx,
          customerId,
          tokenHash,
          expiresAt
        );

        const verificationUrl = `${getAppUrl()}/${locale}/customer-verification/${rawToken}`;

        try {
          await deps.activityLog.log(ctx, "customer.verification_sent", customerId, {
            entityType: "customer",
            expiresAt: expiresAt.toISOString(),
          });
        } catch {
          // Non-blocking
        }

        return {
          verificationUrl,
          expiresAt: expiresAt.toISOString(),
        };
      } catch (error) {
        rethrowVerificationError(error, "Failed to send verification link");
      }
    },

    async getCustomerVerificationByToken(token: string): Promise<CustomerVerificationPayload> {
      if (!token?.trim() || token.length < 16) {
        throw new UseCaseError("VALIDATION", "Invalid verification token");
      }
      try {
        const tokenHash = hashVerificationToken(token);
        const payload = await deps.verificationRepository.getVerificationByTokenHash(tokenHash);
        if (!payload) throw new UseCaseError("NOT_FOUND", "Verification link not found");
        return payload;
      } catch (error) {
        rethrowVerificationError(error, "Failed to load verification");
      }
    },

    async approveCustomerVerification(
      token: string,
      signatureBuffer: Buffer,
      contentType: string,
      meta: { ip: string | null; userAgent: string | null }
    ): Promise<{ customerId: string }> {
      if (!token?.trim() || token.length < 16) {
        throw new UseCaseError("VALIDATION", "Invalid verification token");
      }
      if (!signatureBuffer?.length) {
        throw new UseCaseError("VALIDATION", "Signature is required");
      }

      try {
        const tokenHash = hashVerificationToken(token);
        const payload = await deps.verificationRepository.getVerificationByTokenHash(tokenHash);
        if (!payload) throw new UseCaseError("NOT_FOUND", "Verification link not found");
        if (payload.isVerified) {
          throw new UseCaseError("CONFLICT", "Customer already verified");
        }
        if (payload.tokenUsed) {
          throw new UseCaseError("CONFLICT", "Verification link already used");
        }
        if (payload.tokenExpired) {
          throw new UseCaseError("EXPIRED", "Verification link expired");
        }
        if (!payload.tokenValid) {
          throw new UseCaseError("VALIDATION", "Verification link is not valid");
        }

        const signaturePath = await deps.uploadSignature(
          payload.companyId,
          payload.customerId,
          signatureBuffer,
          contentType
        );

        const customerId = await deps.verificationRepository.completeVerification(
          tokenHash,
          signaturePath,
          meta.ip,
          meta.userAgent
        );

        return { customerId };
      } catch (error) {
        if (error instanceof Error && error.message === "invalid_format") {
          throw new UseCaseError("VALIDATION", "Invalid signature image format");
        }
        if (error instanceof Error && error.message === "max_size") {
          throw new UseCaseError("VALIDATION", "Signature image is too large");
        }
        rethrowVerificationError(error, "Failed to approve verification");
      }
    },
  };
}
