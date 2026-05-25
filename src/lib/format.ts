export function getIntlLocale(locale: string): string {
  return locale === "ar" ? "ar-SA" : "en-SA";
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
  }).format(new Date(date));
}

export function formatNumber(num: number, locale: string) {
  return new Intl.NumberFormat(getIntlLocale(locale)).format(num);
}
