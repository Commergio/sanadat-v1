export type AnnouncementPriority = "info" | "warning" | "success" | "critical";
export type AnnouncementTargetType = "all" | "specific";

export interface AnnouncementModel {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  priority: AnnouncementPriority;
  published: boolean;
  startAt: string | null;
  endAt: string | null;
  targetType: AnnouncementTargetType;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  companyIds: string[];
  isActive: boolean;
}

export interface TenantAnnouncementModel {
  id: string;
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
  priority: AnnouncementPriority;
  startAt: string | null;
  endAt: string | null;
  read: boolean;
}

export interface AnnouncementListResult {
  items: AnnouncementModel[];
  page: number;
  limit: number;
  total: number;
}
