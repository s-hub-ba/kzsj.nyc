"use client";

import Link from "next/link";
import { Locale, SchoolClass, Term } from "@/types/models";
import { useLocale, useTranslations } from "next-intl";
import { toCanonicalAgeGroup } from "@/lib/programAgeGroups";
import { buildShortDescription } from "@/lib/classDescriptions";

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
  const shortDescription = locale === "sr"
    ? item.shortDescription_sr || item.description_sr
    : item.shortDescription_en || item.description_en;

  const classTerms = terms.filter((term) => term.classId === item.id);

  const totalAvailable = classTerms.reduce((sum, term) => {
    const maxCapacity = term.capacity + (term.overbookLimit ?? 0);
    const available = Math.max(0, maxCapacity - (term.bookedCount ?? 0));
    return sum + available;
  }, 0);

  const hasAvailability = totalAvailable > 0;
  const detailSlug = item.ageGroup ? toCanonicalAgeGroup(item.ageGroup) : null;
  const preview = buildShortDescription(shortDescription, 2, 260);

  return (
    <article className="reveal group glass rounded-3xl p-5 shadow-[var(--shadow)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_50px_-28px_rgba(21,50,80,0.4)] sm:p-6">
      <div className="mb-4 inline-flex rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold text-[var(--muted)]">
        {item.type === "single" ? t("single") : t("semester")}
      </div>
      {detailSlug ? (
        <Link href={`/${currentLocale}/programs/${detailSlug}`} className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white">
          <h3 className="mb-3 text-2xl leading-tight text-[var(--brand-2)] sm:text-[2rem]">{title}</h3>
          <div className="mb-5 rounded-2xl border border-line/80 bg-white/75 px-4 py-4 transition group-hover:border-[var(--brand)]/25 sm:px-5">
            <p className="text-base leading-7 text-[var(--muted)] sm:text-[17px] sm:leading-8">{preview}</p>
            <p className="mt-3 text-sm font-semibold text-[var(--brand)]">
              {locale === "sr" ? "Klikni za ceo opis programa" : "Click to read the full program description"}
            </p>
          </div>
        </Link>
      ) : (
        <>
          <h3 className="mb-3 text-2xl leading-tight text-[var(--brand-2)] sm:text-[2rem]">{title}</h3>
          <div className="mb-5 rounded-2xl border border-line/80 bg-white/75 px-4 py-4 sm:px-5">
            <p className="text-base leading-7 text-[var(--muted)] sm:text-[17px] sm:leading-8">{preview}</p>
          </div>
        </>
      )}
      <div className="flex flex-wrap gap-1.5 text-xs font-medium text-[var(--brand-2)] sm:gap-2 sm:text-sm">
        <span className="rounded-full border border-line bg-white px-2.5 py-1 sm:px-3">{item.ageGroup}</span>
        <span className="rounded-full border border-[var(--accent-sun)]/35 bg-[color-mix(in_oklab,var(--accent-sun)_16%,white)] px-3 py-1 font-semibold text-[var(--brand-2)]">
          ${item.price}
        </span>
      </div>

      <div className="mt-5 border-t border-line pt-4">
        <div className="mb-4 flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between sm:text-xs">
          <span className="text-[var(--muted)]">{tPrograms("availability")}:</span>
          <span
            className={
              hasAvailability
                ? "font-semibold text-[color-mix(in_oklab,var(--accent-leaf)_60%,#1f6f2f)]"
                : "font-semibold text-[color-mix(in_oklab,var(--accent-sun)_50%,#a85c00)]"
            }
          >
            {hasAvailability ? tPrograms("spacesAvailable") : tPrograms("spacesUnavailable")}
          </span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {hasAvailability ? (
            <Link
              href={`/${currentLocale}/booking`}
              className="btn-primary btn-compact inline-flex justify-center"
            >
              {tPrograms("applyNow")}
            </Link>
          ) : (
            <Link
              href={`/${currentLocale}/contact`}
              className="btn-secondary btn-compact inline-flex justify-center"
            >
              {tPrograms("sendInquiry")}
            </Link>
          )}
          {detailSlug && (
            <Link
              href={`/${currentLocale}/programs/${detailSlug}`}
              className="btn-secondary btn-compact inline-flex justify-center"
            >
              {locale === "sr" ? "Detaljan opis" : "Detailed overview"}
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}