"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { Locale } from "@/types/models";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const setLocale = (value: Locale) => {
    router.replace(pathname, { locale: value });
  };

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-2 py-1 text-sm">
      <button
        type="button"
        onClick={() => setLocale("sr")}
        className={`rounded-full px-3 py-1 transition ${
          locale === "sr" ? "bg-brand text-white" : "hover:bg-surface-2"
        }`}
      >
        SR
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-full px-3 py-1 transition ${
          locale === "en" ? "bg-brand text-white" : "hover:bg-surface-2"
        }`}
      >
        EN
      </button>
    </div>
  );
}
