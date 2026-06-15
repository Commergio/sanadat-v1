/** Normalize Saudi mobile to international WhatsApp format (9665XXXXXXXX). */
export function resolveWhatsAppPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 9) return digits;
  if (digits.startsWith("966")) return digits;
  if (digits.startsWith("0")) return `966${digits.slice(1)}`;
  return digits;
}
