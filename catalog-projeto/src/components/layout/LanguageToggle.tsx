import { useLanguage } from "@/i18n/LanguageContext";

export function LanguageToggle() {
  const { locale, setLocale, text } = useLanguage();

  return (
    <div className="language-toggle" role="group" aria-label={text.languageSwitcherLabel}>
      <button
        type="button"
        className={`language-toggle-btn${locale === "pt-BR" ? " is-active" : ""}`}
        aria-pressed={locale === "pt-BR"}
        onClick={() => setLocale("pt-BR")}
      >
        {text.languagePortuguese}
      </button>
      <button
        type="button"
        className={`language-toggle-btn${locale === "en" ? " is-active" : ""}`}
        aria-pressed={locale === "en"}
        onClick={() => setLocale("en")}
      >
        {text.languageEnglish}
      </button>
    </div>
  );
}