"use client";

import Link from "next/link";
import { Locale, SchoolClass, Term } from "@/types/models";
import { useLocale, useTranslations } from "next-intl";

interface ProgramCardProps {
  item: SchoolClass;
  terms: Term[];
  locale: Locale;
}

export function ProgramCard({ item, terms, locale }: ProgramCardProps) {
  const t = useTranslations("common");
  const tPrograms = useTranslations("programs");
  const currentLocale = useLocale() as Locale;

  const title = locale === "sr" ? item.title_sr : item.title_en;
  const description = locale === "sr" ? item.description_sr : item.description_en;

  // Get terms for this class
  const classTerms = terms.filter((term) => term.classId === item.id);

  // Calculate total available spaces across all terms for this class
  const totalAvailable = classTerms.reduce((sum, term) => {
    const maxCapacity = term.capacity + (term.overbookLimit ?? 0);
    const available = Math.max(0, maxCapacity - (term.bookedCount ?? 0));
    return sum + available;
  }, 0);

  const hasAvailability = totalAvailable > 0;

  return (
    <article className="reveal group rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow)] transition-transform duration-300 hover:-translate-y-1">
      <div className="mb-4 inline-flex rounded-full bg-surface-2 px-3 py-1 text-xs text-muted">
        {item.type === "single" ? t("single") : t("semester")}
      </div>
      <h3 className="mb-2 text-2xl text-text">{title}</h3>
      <p className="mb-4 text-muted">{description}</p>
      <div className="flex flex-wrap gap-2 text-xs text-brand-2">
        <span className="rounded-full border border-line px-3 py-1">{item.ageGroup}</span>
        <span className="rounded-full border border-line px-3 py-1">{item.level}</span>
        <span className="rounded-full border border-line px-3 py-1">${item.price}</span>
      </div>

      {/* Availability Status */}
      <div className="mt-4 border-t border-line pt-4">
        <div className="mb-3 flex items-center justify-between text-xs">
          <span className="text-muted">{tPrograms("availability")}:</span>
          <span
            className={hasAvailability ? "font-semibold text-green-700" : "font-semibold text-amber-700"}
          >
            {hasAvailability ? tPrograms("spacesAvailable") : tPrograms("spacesUnavailable")}
          </span>
        </div>

        {/* CTA Button */}
        {hasAvailability ? (
          <Link
            href={`/${currentLocale}/booking`}
            className="inline-block rounded-full bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-2"
          >
            {tPrograms("applyNow")}
          </Link>
        ) : (
          <Link
            href={`/${currentLocale}/contact`}
            className="inline-block rounded-full border border-brand px-4 py-2 text-xs font-semibold text-brand transition hover:bg-surface-2"
          >
            {tPrograms("sendInquiry")}
          </Link>
        )}
      </div>
    </article>
  );
}
