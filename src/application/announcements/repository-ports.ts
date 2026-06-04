import type {
  AnnouncementListResult,
  AnnouncementModel,
  TenantAnnouncementModel,
} from "./types";

export interface AnnouncementListQuery {
  page: number;
  limit: number;
  search?: string;
}

export interface AnnouncementRepositoryPort {
  listAll(query: AnnouncementListQuery): Promise<AnnouncementListResult>;
  getById(id: string): Promise<AnnouncementModel | null>;
  create(
    input: Record<string, unknown>,
    adminUserId: string
  ): Promise<AnnouncementModel>;
  update(
    id: string,
    input: Record<string, unknown>,
    adminUserId: string
  ): Promise<AnnouncementModel>;
  delete(id: string): Promise<void>;
  listForTenant(companyId: string, userId: string): Promise<TenantAnnouncementModel[]>;
  markRead(announcementId: string, companyId: string, userId: string): Promise<void>;
}
