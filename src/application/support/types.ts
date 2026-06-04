export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type SupportTicketPriority = "low" | "normal" | "high" | "urgent";

export interface SupportTicketModel {
  id: string;
  companyId: string;
  companyName: string | null;
  createdBy: string;
  createdByEmail: string | null;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  assignedTo: string | null;
  assignedToEmail: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface SupportTicketNoteModel {
  id: string;
  ticketId: string;
  authorId: string;
  authorEmail: string | null;
  body: string;
  internalOnly: boolean;
  createdAt: string;
}

export interface SupportTicketDetailModel {
  ticket: SupportTicketModel;
  notes: SupportTicketNoteModel[];
}

export interface SupportTicketListResult {
  items: SupportTicketModel[];
  page: number;
  limit: number;
  total: number;
}
