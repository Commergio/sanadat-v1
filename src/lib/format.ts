export function getIntlLocale(locale: string): string {
  return locale === "ar" ? "ar-SA" : "en-SA";
}

/** Parse YYYY-MM-DD without UTC timezone shift. */
function parseDateInput(date: string | Date): Date {
  if (date instanceof Date) return date;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(date);
}

export function formatCurrency(amount: number, locale: string) {
  return new Intl.NumberFormat(getIntlLocale(locale), {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | Date, locale: string) {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
    calendar: "gregory",
  }).format(parseDateInput(date));
}

export function formatNumber(num: number, locale: string) {
  return new Intl.NumberFormat(getIntlLocale(locale)).format(num);
}
