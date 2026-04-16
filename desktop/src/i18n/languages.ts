export const supportedLanguages = [
  "en",
  "es",
  "zh-Hans",
  "ko",
  "ja",
  "fr",
  "de",
  "nl",
] as const;

export type AppLanguage = (typeof supportedLanguages)[number];

export const appLanguageLabels: Record<AppLanguage, string> = {
  en: "English",
  es: "Español",
  "zh-Hans": "简体中文",
  ko: "한국어",
  ja: "日本語",
  fr: "Français",
  de: "Deutsch",
  nl: "Nederlands",
};

const normalizeBrowserLanguage = (value: string): string => value.toLowerCase();

export const getSystemLanguage = (): AppLanguage => {
  const fromNavigator =
    typeof navigator === "undefined"
      ? "en"
      : navigator.language || (Array.isArray(navigator.languages) ? navigator.languages[0] : "en");

  const normalized = normalizeBrowserLanguage(fromNavigator);

  if (normalized.startsWith("zh")) return "zh-Hans";
  if (normalized.startsWith("es")) return "es";
  if (normalized.startsWith("ko")) return "ko";
  if (normalized.startsWith("ja")) return "ja";
  if (normalized.startsWith("fr")) return "fr";
  if (normalized.startsWith("de")) return "de";
  if (normalized.startsWith("nl")) return "nl";

  return "en";
};

export const isAppLanguage = (value: string | null | undefined): value is AppLanguage => {
  if (!value) return false;
  return (supportedLanguages as readonly string[]).includes(value);
};
