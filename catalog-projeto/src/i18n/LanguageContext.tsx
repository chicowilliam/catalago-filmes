import { createContext, useContext } from "react";

import { translations, type Locale, type TranslationDictionary } from "@/i18n/translations";

export interface LanguageContextValue {
  locale: Locale;
  text: TranslationDictionary;
  setLocale: (locale: Locale) => void;
}

const defaultValue: LanguageContextValue = {
  locale: "pt-BR",
  text: translations["pt-BR"],
  setLocale: () => undefined,
};

export const LanguageContext = createContext<LanguageContextValue>(defaultValue);

export function useLanguage() {
  return useContext(LanguageContext);
}