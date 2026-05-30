import { getRequestConfig } from "next-intl/server";
import { IntlErrorCode } from "next-intl";
import { routing, type Locale } from "./routing";
import { mergeMessages } from "./merge-messages";

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as Locale)) {
    locale = routing.defaultLocale;
  }

  const enMessages = (await import("../../messages/en.json")).default;
  const localeMessages = (await import(`../../messages/${locale}.json`)).default;

  const messages =
    locale === "en"
      ? localeMessages
      : (mergeMessages(enMessages, localeMessages) as typeof localeMessages);

  return {
    locale,
    messages,
    onError(error) {
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        if (process.env.NODE_ENV === "development") {
          console.warn(error.message);
        }
      } else {
        console.error(error);
      }
    },
    getMessageFallback({ namespace, key, error }) {
      const path = [namespace, key].filter(Boolean).join(".");
      if (error.code === IntlErrorCode.MISSING_MESSAGE) {
        return path;
      }
      return `Translation error: ${path}`;
    },
  };
});
