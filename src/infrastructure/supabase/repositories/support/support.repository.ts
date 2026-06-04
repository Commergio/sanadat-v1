import type { SupabaseClient } from "@supabase/supabase-js";
import type { SupportTicketListQuery } from "@/application/support/query";
import type { SupportRepositoryPort } from "@/application/support/repository-ports";
import type {
  SupportTicketDetailModel,
  SupportTicketListResult,
  SupportTicketModel,
  SupportTicketNoteModel,
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/application/support/types";
import { RepositoryError } from "@/application/shared/errors";
import { toRepositoryError } from "../shared/errors";

type TicketRow = Record<string, unknown>;
type NoteRow = Record<string, unknown>;

function mapTicketRow(row: TicketRow): SupportTicketModel {
  const company = row.companies as { name?: string } | null;
  const creator = row.creator as { email?: string } | null;
  const assignee = row.assignee as { email?: string } | null;

  return {
    id: String(row.id),
    companyId: String(row.company_id),
    companyName: company?.name ?? null,
    createdBy: String(row.created_by),
    createdByEmail: creator?.email ?? null,
    subject: String(row.subject),
    description: String(row.description),
    status: row.status as SupportTicketStatus,
    priority: row.priority as SupportTicketPriority,
    assignedTo: row.assigned_to ? String(row.assigned_to) : null,
    assignedToEmail: assignee?.email ?? null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    closedAt: row.closed_at ? String(row.closed_at) : null,
  };
}

function mapNoteRow(row: NoteRow): SupportTicketNoteModel {
  const author = row.author as { email?: string } | null;
  return {
    id: String(row.id),
    ticketId: String(row.ticket_id),
    authorId: String(row.author_id),
    authorEmail: author?.email ?? null,
    body: String(row.body),
    internalOnly: Boolean(row.internal_only),
    createdAt: String(row.created_at),
  };
}

const ticketSelect = `
  *,
  companies ( name ),
  creator:profiles!created_by ( email ),
  assignee:profiles!assigned_to ( email )
`;

const noteSelect = `
  *,
  author:profiles!author_id ( email )
`;

export class SupportRepository implements SupportRepositoryPort {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForCompany(
    companyId: string,
    query: SupportTicketListQuery
  ): Promise<SupportTicketListResult> {
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let builder = this.supabase
      .from("support_tickets")
      .select(ticketSelect, { count: "exact" })
      .eq("company_id", companyId)
      .order("updated_at", { ascending: false });

    if (query.status) builder = builder.eq("status", query.status);
    if (query.priority) builder = builder.eq("priority", query.priority);
    if (query.search) {
      const term = query.search.replace(/[%]/g, "");
      builder = builder.or(`subject.ilike.%${term}%,description.ilike.%${term}%`);
    }

    const { data, error, count } = await builder.range(from, to);
    if (error) throw toRepositoryError(error, "Failed to list support tickets");

    return {
      items: ((data ?? []) as TicketRow[]).map(mapTicketRow),
      page: query.page,
      limit: query.limit,
      total: count ?? 0,
    };
  }

  async listAll(query: SupportTicketListQuery): Promise<SupportTicketListResult> {
    const from = (query.page - 1) * query.limit;
    const to = from + query.limit - 1;

    let builder = this.supabase
      .from("support_tickets")
      .select(ticketSelect, { count: "exact" })
      .order("updated_at", { ascending: false });

    if (query.status) builder = builder.eq("status", query.status);
    if (query.priority) builder = builder.eq("priority", query.priority);
    if (query.companyId) builder = builder.eq("company_id", query.companyId);
    if (query.search) {
      const term = query.search.replace(/[%]/g, "");
      builder = builder.or(`subject.ilike.%${term}%,description.ilike.%${term}%`);
    }

    const { data, error, count } = await builder.range(from, to);
    if (error) throw toRepositoryError(error, "Failed to list support tickets");

    return {
      items: ((data ?? []) as TicketRow[]).map(mapTicketRow),
      page: query.page,
      limit: query.limit,
      total: count ?? 0,
    };
  }

  private async loadNotes(
    ticketId: string,
    includeInternal: boolean
  ): Promise<SupportTicketNoteModel[]> {
    let builder = this.supabase
      .from("support_ticket_notes")
      .select(noteSelect)
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (!includeInternal) {
      builder = builder.eq("internal_only", false);
    }

    const { data, error } = await builder;
    if (error) throw toRepositoryError(error, "Failed to load ticket notes");

    return ((data ?? []) as NoteRow[]).map(mapNoteRow);
  }

  async getForCompany(
    companyId: string,
    ticketId: string,
    includeInternal: boolean
  ): Promise<SupportTicketDetailModel | null> {
    const { data, error } = await this.supabase
      .from("support_tickets")
      .select(ticketSelect)
      .eq("id", ticketId)
      .eq("company_id", companyId)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load support ticket");
    if (!data) return null;

    const notes = await this.loadNotes(ticketId, includeInternal);
    return { ticket: mapTicketRow(data as TicketRow), notes };
  }

  async getById(ticketId: string): Promise<SupportTicketDetailModel | null> {
    const { data, error } = await this.supabase
      .from("support_tickets")
      .select(ticketSelect)
      .eq("id", ticketId)
      .maybeSingle();

    if (error) throw toRepositoryError(error, "Failed to load support ticket");
    if (!data) return null;

    const notes = await this.loadNotes(ticketId, true);
    return { ticket: mapTicketRow(data as TicketRow), notes };
  }

  async createTicket(
    companyId: string,
    userId: string,
    input: Record<string, unknown>
  ): Promise<SupportTicketModel> {
    const { data, error } = await this.supabase
      .from("support_tickets")
      .insert({
        company_id: companyId,
        created_by: userId,
        subject: input.subject,
        description: input.description,
        priority: input.priority ?? "normal",
        status: "open",
      })
      .select(ticketSelect)
      .single();

    if (error) throw toRepositoryError(error, "Failed to create support ticket");

    const ticket = mapTicketRow(data as TicketRow);
    await this.logActivity(companyId, userId, "support.ticket_created", ticket.id, {
      subject: ticket.subject,
      priority: ticket.priority,
    });
    return ticket;
  }

  async updateTicket(
    ticketId: string,
    input: Record<string, unknown>,
    actorUserId: string
  ): Promise<SupportTicketModel> {
    const existing = await this.getById(ticketId);
    if (!existing) {
      throw new RepositoryError("NOT_FOUND", "Support ticket not found");
    }

    const payload: Record<string, unknown> = {};
    if (input.status !== undefined) {
      payload.status = input.status;
      if (input.status === "closed" || input.status === "resolved") {
        payload.closed_at = new Date().toISOString();
      } else if (existing.ticket.status === "closed" || existing.ticket.status === "resolved") {
        payload.closed_at = null;
      }
    }
    if (input.priority !== undefined) payload.priority = input.priority;
    if (input.assigned_to !== undefined) payload.assigned_to = input.assigned_to;

    const { data, error } = await this.supabase
      .from("support_tickets")
      .update(payload)
      .eq("id", ticketId)
      .select(ticketSelect)
      .single();

    if (error) throw toRepositoryError(error, "Failed to update support ticket");

    const ticket = mapTicketRow(data as TicketRow);
    await this.logActivity(
      existing.ticket.companyId,
      actorUserId,
      "support.ticket_updated",
      ticketId,
      { changes: input }
    );
    return ticket;
  }

  async addNote(
    ticketId: string,
    authorId: string,
    body: string,
    internalOnly: boolean
  ): Promise<SupportTicketNoteModel> {
    const ticket = await this.getById(ticketId);
    if (!ticket) {
      throw new RepositoryError("NOT_FOUND", "Support ticket not found");
    }

    const { data, error } = await this.supabase
      .from("support_ticket_notes")
      .insert({
        ticket_id: ticketId,
        author_id: authorId,
        body,
        internal_only: internalOnly,
      })
      .select(noteSelect)
      .single();

    if (error) throw toRepositoryError(error, "Failed to add ticket note");

    const note = mapNoteRow(data as NoteRow);
    await this.logActivity(
      ticket.ticket.companyId,
      authorId,
      "support.note_added",
      ticketId,
      { internal_only: internalOnly, note_id: note.id }
    );
    return note;
  }

  async logActivity(
    companyId: string,
    userId: string,
    action: string,
    ticketId: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const { error } = await this.supabase.from("activity_logs").insert({
      company_id: companyId,
      user_id: userId,
      action,
      entity_type: "support_ticket",
      entity_id: ticketId,
      metadata: metadata ?? {},
    });

    if (error) throw toRepositoryError(error, "Failed to write activity log");
  }
}
