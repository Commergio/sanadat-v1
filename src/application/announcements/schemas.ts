import { z } from "zod";

const prioritySchema = z.enum(["info", "warning", "success", "critical"]);
const targetTypeSchema = z.enum(["all", "specific"]);

const optionalIso = z
  .string()
  .min(1)
  .nullable()
  .optional()
  .transform((v) => (v === "" ? null : v ?? null));

const announcementFieldsSchema = z.object({
  title_ar: z.string().min(1).max(500),
  title_en: z.string().min(1).max(500),
  content_ar: z.string().min(1).max(10000),
  content_en: z.string().min(1).max(10000),
  priority: prioritySchema,
  published: z.boolean(),
  start_at: optionalIso,
  end_at: optionalIso,
  target_type: targetTypeSchema,
  company_ids: z.array(z.string().uuid()).optional(),
});

function refineAnnouncement(
  data: z.infer<typeof announcementFieldsSchema>,
  ctx: z.RefinementCtx
) {
  if (data.target_type === "specific") {
    if (!data.company_ids?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "company_ids required when target_type is specific",
        path: ["company_ids"],
      });
    }
  }
  if (data.start_at && data.end_at) {
    const start = new Date(data.start_at).getTime();
    const end = new Date(data.end_at).getTime();
    if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "end_at must be after start_at",
        path: ["end_at"],
      });
    }
  }
}

export const createAnnouncementSchema = announcementFieldsSchema
  .extend({
    priority: prioritySchema.default("info"),
    published: z.boolean().default(false),
  })
  .superRefine(refineAnnouncement);

export const updateAnnouncementSchema = z
  .object({
    title_ar: z.string().min(1).max(500).optional(),
    title_en: z.string().min(1).max(500).optional(),
    content_ar: z.string().min(1).max(10000).optional(),
    content_en: z.string().min(1).max(10000).optional(),
    priority: prioritySchema.optional(),
    published: z.boolean().optional(),
    start_at: optionalIso,
    end_at: optionalIso,
    target_type: targetTypeSchema.optional(),
    company_ids: z.array(z.string().uuid()).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.target_type === "specific" && data.company_ids !== undefined) {
      if (!data.company_ids.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "company_ids required when target_type is specific",
          path: ["company_ids"],
        });
      }
    }
    if (data.start_at && data.end_at) {
      const start = new Date(data.start_at).getTime();
      const end = new Date(data.end_at).getTime();
      if (!Number.isNaN(start) && !Number.isNaN(end) && end < start) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "end_at must be after start_at",
          path: ["end_at"],
        });
      }
    }
  });
