import { z } from "zod";

export const receiptVoucherInputSchema = z.object({
  date: z.string().min(1),
  amount: z.number().positive("Amount must be positive"),
  partyName: z.string().min(1, "Party name is required"),
  customerId: z.string().uuid("Customer is required"),
  description: z.string().optional(),
  paymentMethod: z.enum(["cash", "bank_transfer", "pos"]),
  transferNumber: z.string().optional(),
  bankName: z.string().optional(),
  transferDate: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
  linkedInvoiceId: z.string().optional(),
});

export const paymentVoucherInputSchema = z.object({
  date: z.string().min(1),
  amount: z.number().positive("Amount must be positive"),
  partyName: z.string().min(1, "Party name is required"),
  description: z.string().optional(),
  paymentMethod: z.enum(["cash", "bank_transfer", "pos"]),
  transferNumber: z.string().optional(),
  bankName: z.string().optional(),
  transferDate: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export const invoiceItemInputSchema = z.object({
  description: z.string().min(1, "Item description is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().positive("Unit price must be positive"),
});

export const invoiceInputSchema = z.object({
  date: z.string().min(1),
  partyName: z.string().min(1, "Party name is required"),
  description: z.string().optional(),
  paymentMethod: z.enum(["cash", "bank_transfer", "pos"]),
  transferNumber: z.string().optional(),
  bankName: z.string().optional(),
  referenceNumber: z.string().optional(),
  items: z.array(invoiceItemInputSchema).min(1, "Invoice must have at least one item"),
  discount: z.number().min(0).optional(),
  tax: z.number().min(0).optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  const subtotal = data.items.reduce(
    (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
    0
  );
  const total = subtotal - Number(data.discount ?? 0) + Number(data.tax ?? 0);

  if (total <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Total amount must be positive",
      path: ["items"],
    });
  }
});
