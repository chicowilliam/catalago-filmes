import { useEffect, useMemo, useState, type ReactNode } from "react";

import { LanguageContext } from "@/i18n/LanguageContext";
import { translations, type Locale } from "@/i18n/translations";

const STORAGE_KEY = "catalogx.locale";

function getInitialLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "pt-BR" || saved === "en") return saved;
  } catch {
    // ignore storage failures
  }
  return "pt-BR";
}

function upsertMeta(selector: string, content: string, attribute: "name" | "property") {
  let meta = document.head.querySelector(`meta[${attribute}="${selector}"]`);
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute(attribute, selector);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore storage failures
    }

    const text = translations[locale];
    document.documentElement.lang = locale;
    document.title = text.documentTitle;
    upsertMeta("description", text.documentDescription, "name");
    upsertMeta("og:title", text.documentTitle, "property");
    upsertMeta("og:description", text.documentDescription, "property");
    upsertMeta("og:locale", locale === "en" ? "en_US" : "pt_BR", "property");
    upsertMeta("twitter:title", text.documentTitle, "name");
    upsertMeta("twitter:description", text.documentDescription, "name");
  }, [locale]);

  const value = useMemo(
    () => ({
      locale,
      text: translations[locale],
      setLocale,
    }),
    [locale]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
