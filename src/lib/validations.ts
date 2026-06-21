import { z } from "zod";

type T = (key: string) => string;

export const createLoginSchema = (t: T) =>
  z.object({
    email: z.string().email(t("emailInvalid")),
    password: z.string().min(6, t("passwordMin6")),
  });

export const createRegisterSchema = (t: T) =>
  z
    .object({
      companyName: z.string().min(2, t("companyRequired")),
      email: z.string().email(t("emailInvalid")),
      phone: z
        .string()
        .regex(/^05\d{8}$/, t("phoneInvalid")),
      password: z.string().min(8, t("passwordMin8")),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordMismatch"),
      path: ["confirmPassword"],
    });

export const createForgotPasswordSchema = (t: T) =>
  z.object({
    email: z.string().email(t("emailInvalid")),
  });

export const createCompanySchema = (t: T) =>
  z.object({
    name: z.string().min(2, t("companyRequired")),
    name_en: z.string().optional(),
    cr_number: z.string().optional(),
    vat_number: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email(t("emailInvalid")).optional().or(z.literal("")),
  });

export const createCompanySettingsSchema = (t: T) =>
  z.object({
    name: z.string().min(2, t("companyRequired")),
    cr_number: z.string().min(1, t("crRequired")),
    vat_number: z.string().optional(),
    license_number: z.string().min(1, t("licenseRequired")),
    address: z.string().min(1, t("addressRequired")),
    phone: z
      .string()
      .min(1, t("phoneRequired"))
      .regex(/^05\d{8}$/, t("phoneInvalid")),
    responsible_person: z.string().min(2, t("responsibleRequired")),
  });

export const createDocumentBaseSchema = (t: T) =>
  z.object({
    date: z.string(),
    party_name: z.string().min(2, t("partyRequired")),
    amount: z
      .number({ error: t("amountPositive") })
      .positive(t("amountPositive")),
    description: z.string().optional(),
    notes: z.string().optional(),
    payment_method: z.enum(["cash", "bank_transfer", "pos"]),
    transfer_number: z.string().optional(),
    bank_name: z.string().optional(),
    transfer_date: z.string().optional(),
    reference_number: z.string().optional(),
  });

export const createInvoiceItemSchema = (t: T) =>
  z.object({
    description: z.string().min(1, t("descriptionRequired")),
    quantity: z.number().positive(),
    unit_price: z.number().positive(t("amountPositive")),
  });

export const createInvoiceSchema = (t: T) =>
  z.object({
    date: z.string(),
    customer_id: z.string().uuid(t("customerRequired")),
    party_name: z.string().min(2, t("partyRequired")),
    description: z.string().optional(),
    items: z.array(createInvoiceItemSchema(t)).min(1, t("itemRequired")),
    discount: z.number().min(0),
    payment_method: z.enum(["cash", "bank_transfer", "pos"]),
    transfer_number: z.string().optional(),
    bank_name: z.string().optional(),
    reference_number: z.string().optional(),
  }).superRefine((data, ctx) => {
    const subtotal = data.items.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
      0
    );
    const total = subtotal - Number(data.discount ?? 0);
    if (total <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: t("amountPositive"),
        path: ["discount"],
      });
    }
  });

// Legacy exports for gradual migration
export const loginSchema = createLoginSchema((k) => k);
export const registerSchema = createRegisterSchema((k) => k);
export const forgotPasswordSchema = createForgotPasswordSchema((k) => k);
export const companySchema = createCompanySchema((k) => k);
export const documentBaseSchema = createDocumentBaseSchema((k) => k);
export const invoiceSchema = createInvoiceSchema((k) => k);

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>;
export type CompanyInput = z.infer<ReturnType<typeof createCompanySchema>>;
export type CompanySettingsInput = z.infer<
  ReturnType<typeof createCompanySettingsSchema>
>;
export type InvoiceInput = z.infer<ReturnType<typeof createInvoiceSchema>>;
