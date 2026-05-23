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
    <div className="inline-flex items-center gap-1 rounded-full border border-line bg-white px-1 py-1 text-sm shadow-sm">
      <button
        type="button"
        onClick={() => setLocale("sr")}
        className={`rounded-full px-3 py-1 transition ${
          locale === "sr"
            ? "bg-[var(--brand)] text-white"
            : "font-semibold text-[var(--muted)] hover:bg-[var(--surface-2)]"
        }`}
      >
        SR
      </button>
      <button
        type="button"
        onClick={() => setLocale("en")}
        className={`rounded-full px-3 py-1 transition ${
          locale === "en"
            ? "bg-[var(--brand)] text-white"
            : "font-semibold text-[var(--muted)] hover:bg-[var(--surface-2)]"
        }`}
      >
        EN
      </button>
    </div>
  );
}
