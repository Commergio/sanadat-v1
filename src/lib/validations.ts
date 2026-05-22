import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
});

export const registerSchema = z
  .object({
    companyName: z.string().min(2, "اسم المنشأة مطلوب"),
    email: z.string().email("البريد الإلكتروني غير صالح"),
    phone: z
      .string()
      .regex(/^05\d{8}$/, "رقم الجوال غير صالح (مثال: 0512345678)"),
    password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمات المرور غير متطابقة",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
});

export const companySchema = z.object({
  name: z.string().min(2, "اسم المنشأة مطلوب"),
  name_en: z.string().optional(),
  cr_number: z.string().optional(),
  vat_number: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

export const documentBaseSchema = z.object({
  date: z.string(),
  party_name: z.string().min(2, "اسم الطرف مطلوب"),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  description: z.string().optional(),
  payment_method: z.enum(["cash", "bank_transfer", "pos"]),
  transfer_number: z.string().optional(),
  bank_name: z.string().optional(),
  reference_number: z.string().optional(),
});

export const receiptVoucherSchema = documentBaseSchema;
export const paymentVoucherSchema = documentBaseSchema;

export const invoiceItemSchema = z.object({
  description: z.string().min(1, "الوصف مطلوب"),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
});

export const invoiceSchema = z.object({
  date: z.string(),
  party_name: z.string().min(2, "اسم العميل مطلوب"),
  description: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, "أضف بنداً واحداً على الأقل"),
  discount: z.number().min(0),
  payment_method: z.enum(["cash", "bank_transfer", "pos"]),
  transfer_number: z.string().optional(),
  bank_name: z.string().optional(),
  reference_number: z.string().optional(),
});

export const cancelDocumentSchema = z.object({
  reason: z.string().min(3, "سبب الإلغاء مطلوب"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
