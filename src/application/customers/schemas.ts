import { z } from "zod";

const saudiPhoneSchema = z
  .string()
  .min(1, "Phone is required")
  .regex(/^05\d{8}$/, "Invalid Saudi mobile number");

const optionalEmailSchema = z
  .union([z.string().email(), z.literal(""), z.null()])
  .optional()
  .transform((value) => (value === "" || value === undefined ? null : value));

const optionalNationalIdSchema = z
  .string()
  .trim()
  .max(20)
  .optional()
  .nullable()
  .transform((value) => (value === "" || value === undefined ? null : value));

export const createCustomerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  phone: saudiPhoneSchema,
  email: optionalEmailSchema,
  nationalId: optionalNationalIdSchema,
});

export const updateCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    phone: saudiPhoneSchema.optional(),
    email: optionalEmailSchema,
    nationalId: optionalNationalIdSchema,
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const customerListQuerySchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof updateCustomerSchema>;
export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
