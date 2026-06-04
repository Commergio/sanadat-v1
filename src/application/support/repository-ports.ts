import type {
  SupportTicketDetailModel,
  SupportTicketListResult,
  SupportTicketModel,
  SupportTicketNoteModel,
} from "./types";
import type { SupportTicketListQuery } from "./query";

export interface SupportRepositoryPort {
  listForCompany(companyId: string, query: SupportTicketListQuery): Promise<SupportTicketListResult>;
  listAll(query: SupportTicketListQuery): Promise<SupportTicketListResult>;
  getForCompany(companyId: string, ticketId: string, includeInternal: boolean): Promise<SupportTicketDetailModel | null>;
  getById(ticketId: string): Promise<SupportTicketDetailModel | null>;
  createTicket(
    companyId: string,
    userId: string,
    input: Record<string, unknown>
  ): Promise<SupportTicketModel>;
  updateTicket(
    ticketId: string,
    input: Record<string, unknown>,
    actorUserId: string
  ): Promise<SupportTicketModel>;
  addNote(
    ticketId: string,
    authorId: string,
    body: string,
    internalOnly: boolean
  ): Promise<SupportTicketNoteModel>;
  logActivity(
    companyId: string,
    userId: string,
    action: string,
    ticketId: string,
    metadata?: Record<string, unknown>
  ): Promise<void>;
}
