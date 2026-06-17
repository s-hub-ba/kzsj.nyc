"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Locale, SchoolClass, Term } from "@/types/models";

interface ProgramFlipCardProps {
  item: SchoolClass;
  terms: Term[];
  locale: Locale;
}

export function ProgramFlipCard({ item, terms, locale }: ProgramFlipCardProps) {
  const tCommon = useTranslations("common");
  const tPrograms = useTranslations("programs");
  const [flipped, setFlipped] = useState(false);

  const title = locale === "sr" ? item.title_sr : item.title_en;
  const description = locale === "sr" ? item.description_sr : item.description_en;

  const hasAvailability = useMemo(() => {
    const classTerms = terms.filter((term) => term.classId === item.id);
    const totalAvailable = classTerms.reduce((sum, term) => {
      const maxCapacity = term.capacity + (term.overbookLimit ?? 0);
      const available = Math.max(0, maxCapacity - (term.bookedCount ?? 0));
      return sum + available;
    }, 0);

    return totalAvailable > 0;
  }, [item.id, terms]);

  return (
    <article className="group mx-auto w-full max-w-[360px] [perspective:1200px]">
      <button
        type="button"
        onClick={() => setFlipped((prev) => !prev)}
        aria-pressed={flipped}
        className="relative block h-[300px] w-full rounded-3xl text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)] sm:h-[320px]"
      >
        <div
          className={`relative h-full w-full rounded-3xl transition-transform duration-700 [transform-style:preserve-3d] md:group-hover:[transform:rotateY(180deg)] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          <div className="absolute inset-0 rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow)] [backface-visibility:hidden]">
            <div className="mb-3 inline-flex rounded-full border border-line bg-[var(--surface-2)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
              {item.type === "single" ? tCommon("single") : tCommon("semester")}
            </div>
            <h3 className="text-2xl leading-tight text-[var(--brand-2)] sm:text-3xl">{title}</h3>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-[var(--brand-2)]">
              <span className="rounded-full border border-line bg-white px-3 py-1">{item.ageGroup}</span>
              <span className="rounded-full border border-line bg-white px-3 py-1">{item.level}</span>
              <span className="rounded-full border border-[var(--accent-sun)]/35 bg-[color-mix(in_oklab,var(--accent-sun)_16%,white)] px-3 py-1 font-semibold text-[var(--brand-2)]">
                ${item.price}
              </span>
            </div>
            <p className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {locale === "sr" ? "Klikni karticu za detalje" : "Tap card for details"}
            </p>
          </div>

          <div className="absolute inset-0 rounded-3xl border border-line bg-[var(--surface-2)] p-6 shadow-[var(--shadow)] [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <h3 className="text-xl leading-tight text-[var(--brand-2)] sm:text-2xl">{title}</h3>
            <p className="mt-3 line-clamp-5 text-sm text-[var(--muted)]">{description}</p>
            <div className="mt-5 border-t border-line pt-4">
              <div className="mb-3 text-xs font-semibold text-[var(--muted)]">
                {tPrograms("availability")}: {hasAvailability ? tPrograms("spacesAvailable") : tPrograms("spacesUnavailable")}
              </div>
              {hasAvailability ? (
                <Link href="/booking" className="btn-primary btn-compact inline-flex">
                  {tPrograms("applyNow")}
                </Link>
              ) : (
                <Link href="/contact" className="btn-secondary btn-compact inline-flex">
                  {tPrograms("sendInquiry")}
                </Link>
              )}
            </div>
          </div>
        </div>
      </button>
    </article>
  );
}