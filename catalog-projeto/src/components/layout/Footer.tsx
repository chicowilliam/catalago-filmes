import { useLanguage } from "@/i18n/LanguageContext";

export function Footer() {
  const { text } = useLanguage();

  return (
    <footer className="app-footer">
      <p>{text.footerCredit}</p>
    </footer>
  );
}
