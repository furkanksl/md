import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getSystemLanguage } from "@/i18n/languages";
import { resources } from "@/i18n/resources";

void i18n.use(initReactI18next).init({
  resources,
  lng: getSystemLanguage(),
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
