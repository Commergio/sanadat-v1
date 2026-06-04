import { z } from "zod";

const statusSchema = z.enum(["open", "in_progress", "resolved", "closed"]);
const prioritySchema = z.enum(["low", "normal", "high", "urgent"]);

export const createTicketSchema = z.object({
  subject: z.string().min(3).max(300),
  description: z.string().min(10).max(10000),
  priority: prioritySchema.default("normal"),
});

export const addNoteSchema = z.object({
  body: z.string().min(1).max(10000),
  internal_only: z.boolean().optional().default(false),
});

export const updateTicketSchema = z
  .object({
    status: statusSchema.optional(),
    priority: prioritySchema.optional(),
    assigned_to: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field required",
  });
