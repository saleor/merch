import type {
  Language,
  LanguageId,
  Market,
  MarketId,
  SUPPORTED_MARKETS,
  SupportedLocale,
} from "@/regions/types";

export const LOCALE_CHANNEL_MAP: Record<
  SupportedLocale,
  (typeof SUPPORTED_MARKETS)[number]
> = {
  "en-GB": "gb",
};

export const LANGUAGES = {
  GB: {
    id: "gb",
    name: "English (British)",
    code: "EN_GB",
    locale: "en-GB",
  },
} satisfies Record<Uppercase<LanguageId>, Language>;

export const MARKETS = {
  GB: {
    id: "gb",
    name: "Europe",
    channel: "eu",
    currency: "EUR",
    continent: "Europe",
    countryCode: "GB",
    defaultLanguage: LANGUAGES.GB,
    supportedLanguages: [LANGUAGES.GB],
  },
} satisfies Record<Uppercase<MarketId>, Market>;
