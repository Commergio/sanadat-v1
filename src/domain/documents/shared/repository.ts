import type { TenantContext, PaginatedResult, PaginationParams } from "../../shared/types";
import type {
  DocumentRegistryEntry,
  DocumentType,
  NextDocumentNumber,
} from "./types";

export interface DocumentRegistryRepository {
  list(
    ctx: TenantContext,
    params: PaginationParams & { type?: DocumentType; status?: "active" | "cancelled" }
  ): Promise<PaginatedResult<DocumentRegistryEntry>>;

  getById(ctx: TenantContext, documentId: string): Promise<DocumentRegistryEntry | null>;

  search(
    ctx: TenantContext,
    query: string,
    params: PaginationParams
  ): Promise<PaginatedResult<DocumentRegistryEntry>>;
}

export interface DocumentSequenceRepository {
  getNextNumber(
    ctx: TenantContext,
    type: DocumentType,
    locale: "ar" | "en"
  ): Promise<NextDocumentNumber>;
}

export interface CancelDocumentInput {
  documentId: string;
  reason: string;
}

export interface DocumentLifecycleRepository {
  cancel(ctx: TenantContext, input: CancelDocumentInput): Promise<void>;
}
