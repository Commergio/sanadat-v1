/**
 * Domain layer public API.
 * Import from '@/domain' in application and infrastructure layers.
 */

// Shared
export type {
  TenantContext,
  PaginatedResult,
  PaginationParams,
  DomainErrorCode,
} from "./shared/types";
export { DomainError } from "./shared/types";

// Identity
export type {
  PlatformRole,
  TenantRole,
  Profile,
  CompanyMember,
  CompanyInvitation,
  IdentityRepository,
} from "./identity/types";
export { TENANT_ROLE_RANK, hasMinimumRole } from "./identity/types";

// Company (tenant)
export type {
  Company,
  UpdateCompanyInput,
  CompanyRepository,
} from "./company/entity";

// Documents — shared
export type {
  DocumentType,
  DocumentStatus,
  PaymentMethod,
  InvoicePaymentStatus,
  DocumentBase,
  DocumentRegistryEntry,
  NextDocumentNumber,
  DocumentTypeDefinition,
} from "./documents/shared/types";
export {
  DOCUMENT_TYPE_DEFINITIONS,
  getDocumentTypeDefinition,
} from "./documents/shared/types";
export type {
  DocumentRegistryRepository,
  DocumentSequenceRepository,
  DocumentLifecycleRepository,
  CancelDocumentInput,
} from "./documents/shared/repository";

// Documents — type-specific
export type {
  ReceiptVoucher,
  CreateReceiptInput,
  ReceiptRepository,
} from "./documents/receipt/entity";
export type {
  PaymentVoucher,
  CreatePaymentInput,
  PaymentRepository,
} from "./documents/payment/entity";
export type {
  Invoice,
  InvoiceItem,
  CreateInvoiceInput,
  CreateInvoiceItemInput,
  InvoiceRepository,
} from "./documents/invoice/entity";

// Billing
export type {
  SubscriptionStatus,
  PaymentGateway,
  PaymentStatus,
  SubscriptionPlan,
  Subscription,
  PaymentTransaction,
  BillingRepository,
} from "./billing/types";
