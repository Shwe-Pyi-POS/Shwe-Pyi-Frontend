import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="relative group">
      <button
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800 hover:bg-dark-700 text-white transition-colors"
        onClick={() => setLanguage(language === "en" ? "my" : "en")}
        title={t("language.changeLanguage")}
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">
          {language === "en" ? "English" : "မြန်မာ"}
        </span>
      </button>
    </div>
  );
};

