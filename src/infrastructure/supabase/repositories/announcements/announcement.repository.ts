import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AnnouncementListQuery,
  AnnouncementRepositoryPort,
} from "@/application/announcements/repository-ports";
import type {
  AnnouncementListResult,
  AnnouncementModel,
  AnnouncementPriority,
  AnnouncementTargetType,
  TenantAnnouncementModel,
} from "@/application/announcements/types";
import { RepositoryError } from "@/application/shared/errors";
import { toRepositoryError } from "../shared/errors";

type AnnouncementRow = Record<string, unknown>;
type TargetRow = { announcement_id: string; company_id: string };

function computeIsActive(row: AnnouncementRow): boolean {
  if (!row.published) return false;
  const now = Date.now();
  if (row.start_at) {
    const start = new Date(String(row.start_at)).getTime();
    if (!Number.isNaN(start) && start > now) return false;
  }
  if (row.end_at) {
    const end = new Date(String(row.end_at)).getTime();
    if (!Number.isNaN(end) && end < now) return false;
  }
  return true;
}

function mapAnnouncementRow(
  row: AnnouncementRow,
  companyIds: string[]
): AnnouncementModel {
  return {
    id: String(row.id),
    titleAr: String(row.title_ar),
    titleEn: String(row.title_en),
    contentAr: String(row.content_ar),
    contentEn: String(row.content_en),
    priority: row.priority as AnnouncementPriority,
    published: Boolean(row.published),
    startAt: row.start_at ? String(row.start_at) : null,
    endAt: row.end_at ? String(row.end_at) : null,
    targetType: row.target_type as AnnouncementTargetType,
    createdBy: row.created_by ? String(row.created_by) : null,
    updatedBy: row.updated_by ? String(row.updated_by) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    companyIds,
    isActive: computeIsActive(row),
  };
}

function mapTenantRow(row: AnnouncementRow, read: boolean): TenantAnnouncementModel {
  return {
    id: String(row.id),
    titleAr: String(row.title_ar),
    titleEn: String(row.title_en),
    contentAr: String(row.content_ar),
    contentEn: String(row.content_en),
    priority: row.priority as AnnouncementPriority,
    startAt: row.start_at ? String(row.start_at) : null,
    endAt: row.end_at ? String(row.end_at) : null,
    read,
  };
}

function buildInsertPayload(
  input: Record<string, unknown>,
  adminUserId: string
): Record<string, unknown> {
  return {
    title_ar: input.title_ar,
    title_en: input.title_en,
    content_ar: input.content_ar,
    content_en: input.content_en,
    priority: input.priority ?? "info",
    published: input.published ?? false,
    start_at: input.start_at ?? null,
    end_at: input.end_at ?? null,
    target_type: input.target_type ?? "all",
    created_by: adminUserId,
    updated_by: adminUserId,
  };
}

function buildUpdatePayload(
  input: Record<string, unknown>,
  adminUserId: string
): Record<string, unknown> {
  const payload: Record<string, unknown> = { updated_by: adminUserId };
  if (input.title_ar !== undefined) payload.title_ar = input.title_ar;
  if (input.title_en !== undefined) payload.title_en = input.title_en;
  if (input.content_ar !== undefined) payload.content_ar = input.content_ar;
  if (input.content_en !== undefined) payload.content_en = input.content_en;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.published !== undefined) payload.published = input.published;
  if (input.start_at !== undefined) payload.start_at = input.start_at;
  if (input.end_at !== undefined) payload.end_at = input.end_at;
  if (input.target_type !== undefined) payload.target_type = input.target_type;
  return payload;
}

export class AnnouncementRepository implements AnnouncementRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  private async loadTargetsForAnnouncements(
    ids: string[]
  ): Promise<Map<string, string[]>> {
    const map = new Map<string, string[]>();
    if (ids.length === 0) return map;

    const { data, error } = await this.supabase
      .from("announcement_targets")
      .select("announcement_id, company_id")
      .in("announcement_id", ids);

    if (error) throw toRepositoryError(error, "Failed to load announcement targets");

    for (const row of (data ?? []) as TargetRow[]) {
      const list = map.get(row.announcement_id) ?? [];
      list.push(row.company_id);
      map.set(row.announcement_id, list);
    }
    return map;
  }

  private async replaceTargets(
    announcementId: string,
    targetType: AnnouncementTargetType,
    companyIds?: string[]
  ): Promise<void> {
    const { error: delError } = await this.supabase
      .from("announcement_targets")
      .delete()
      .eq("announcement_id", announcementId);

    if (delError) throw toRepositoryError(delError, "Failed to clear announcement targets");

    if (targetType === "specific" && companyIds?.length) {
      const rows = companyIds.map((companyId) => ({
        announcement_id: announcementId,
        company_id: companyId,
      }));
      const { error: insError } = await this.supabase
        .from("announcement_targets")
        .insert(rows);

      if (insError) throw toRepositoryError(insError, "Failed to set announcement targets");
    }
  }

  async listAll(query: AnnouncementListQuery): Promise<AnnouncementListResult> {
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let builder = this.supabase
      .from("announcements")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (query.search) {
      const term = query.search.replace(/[%]/g, "");
      builder = builder.or(
        `title_ar.ilike.%${term}%,title_en.ilike.%${term}%,content_ar.ilike.%${term}%,content_en.ilike.%${term}%`
      );
    }

    const { data, error, count } = await builder.range(from, to);
    if (error) throw toRepositoryError(error, "Failed to list announcements");

    const rows = (data ?? []) as AnnouncementRow[];
    const targetMap = await this.loadTargetsForAnnouncements(rows.map((r) => String(r.id)));

    return {
      items: rows.map((row) =>
        mapAnnouncementRow(row, targetMap.get(String(row.id)) ?? [])
      ),
      page: query.page,
      limit: query.limit,
      total: count ?? 0,
    };
  }

  async getById(id: string): Promise<AnnouncementModel | null> {
    const { data, error } = await this.supabase
      .from("announcements")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load announcement");
    if (!data) return null;

    const targetMap = await this.loadTargetsForAnnouncements([id]);
    return mapAnnouncementRow(data as AnnouncementRow, targetMap.get(id) ?? []);
  }

  async create(
    input: Record<string, unknown>,
    adminUserId: string
  ): Promise<AnnouncementModel> {
    const targetType = (input.target_type as AnnouncementTargetType) ?? "all";
    const companyIds = input.company_ids as string[] | undefined;

    const { data, error } = await this.supabase
      .from("announcements")
      .insert(buildInsertPayload(input, adminUserId))
      .select("*")
      .single();

    if (error) throw toRepositoryError(error, "Failed to create announcement");

    const id = String(data.id);
    await this.replaceTargets(id, targetType, companyIds);

    const created = await this.getById(id);
    if (!created) {
      throw new RepositoryError("RPC_ERROR", "Announcement created but not found");
    }
    return created;
  }

  async update(
    id: string,
    input: Record<string, unknown>,
    adminUserId: string
  ): Promise<AnnouncementModel> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new RepositoryError("NOT_FOUND", "Announcement not found");
    }

    const { error } = await this.supabase
      .from("announcements")
      .update(buildUpdatePayload(input, adminUserId))
      .eq("id", id)
      .select("id")
      .single();

    if (error) throw toRepositoryError(error, "Failed to update announcement");

    const targetType =
      (input.target_type as AnnouncementTargetType | undefined) ?? existing.targetType;
    if (input.target_type !== undefined || input.company_ids !== undefined) {
      const companyIds =
        (input.company_ids as string[] | undefined) ?? existing.companyIds;
      await this.replaceTargets(id, targetType, companyIds);
    }

    const updated = await this.getById(id);
    if (!updated) {
      throw new RepositoryError("RPC_ERROR", "Announcement updated but not found");
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const { data, error } = await this.supabase
      .from("announcements")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to delete announcement");
    if (!data) {
      throw new RepositoryError("NOT_FOUND", "Announcement not found");
    }
  }

  async listForTenant(
    companyId: string,
    userId: string
  ): Promise<TenantAnnouncementModel[]> {
    const { data: announcements, error: annError } = await this.supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (annError) throw toRepositoryError(annError, "Failed to load announcements");

    const { data: reads, error: readError } = await this.supabase
      .from("announcement_reads")
      .select("announcement_id")
      .eq("user_id", userId)
      .eq("company_id", companyId);

    if (readError) throw toRepositoryError(readError, "Failed to load announcement reads");

    const readIds = new Set((reads ?? []).map((r) => String(r.announcement_id)));

    return ((announcements ?? []) as AnnouncementRow[]).map((row) =>
      mapTenantRow(row, readIds.has(String(row.id)))
    );
  }

  async markRead(
    announcementId: string,
    companyId: string,
    userId: string
  ): Promise<void> {
    const { error } = await this.supabase.from("announcement_reads").upsert(
      {
        announcement_id: announcementId,
        user_id: userId,
        company_id: companyId,
        read_at: new Date().toISOString(),
      },
      { onConflict: "announcement_id,user_id,company_id" }
    );

    if (error) throw toRepositoryError(error, "Failed to mark announcement as read");
  }
}
