import { getTranslations } from "next-intl/server";
import { ProgramCard } from "@/components/ProgramCard";
import { PageHero } from "@/components/PageHero";
import { Link } from "@/i18n/navigation";
import { getActiveClasses, getActiveTerms } from "@/lib/firestoreServer";
import { toCanonicalAgeGroup, formatAgeGroupLabel, parseAgeRange } from "@/lib/programAgeGroups";
import { Locale } from "@/types/models";

interface ProgramsPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: ProgramsPageProps) {
  const { locale } = await params;
  return {
    title:
      locale === "sr"
        ? "Programi | Casovi srpskog jezika za uzrast 1-7"
        : "Programs | Serbian language classes for ages 1-7",
    description:
      locale === "sr"
        ? "Pregled programa srpskog zavičajnog jezika po uzrastu za decu od 1 do 7 godina."
        : "Explore age-based Serbian heritage language programs for children ages 1 to 7.",
    keywords:
      locale === "sr"
        ? ["programi", "casovi srpskog jezika", "uzrast 1-7", "semestar"]
        : ["programs", "Serbian heritage language classes", "ages 1-7", "semester"],
  };
}

export default async function ProgramsPage({ params }: ProgramsPageProps) {
  const { locale } = await params;
  const t = await getTranslations("programs");
  const [classes, terms] = await Promise.all([getActiveClasses(), getActiveTerms()]);
  const sortedClasses = [...classes].sort((left, right) => {
    const leftRange = parseAgeRange(left.ageGroup);
    const rightRange = parseAgeRange(right.ageGroup);

    if (!leftRange && !rightRange) return left.title_sr.localeCompare(right.title_sr);
    if (!leftRange) return 1;
    if (!rightRange) return -1;
    if (leftRange.min !== rightRange.min) return leftRange.min - rightRange.min;
    return leftRange.max - rightRange.max;
  });

  // Derive unique age group nav links from Firestore classes
  const ageGroupSlugs = new Map<string, string>();
  sortedClasses.forEach((cls) => {
    if (!cls.ageGroup) return;
    const slug = toCanonicalAgeGroup(cls.ageGroup);
    if (!ageGroupSlugs.has(slug)) {
      ageGroupSlugs.set(slug, formatAgeGroupLabel(cls.ageGroup, locale));
    }
  });
  const ageGroupLinks = Array.from(ageGroupSlugs.entries());

  return (
    <div className="space-y-8 max-[375px]:space-y-6">
      <PageHero locale={locale} title={t("title")} description={t("intro")} variant="programs" />

      {ageGroupLinks.length > 0 && (
        <section className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-6">
          <h2 className="text-2xl text-[var(--brand-2)] sm:text-3xl">
            {locale === "sr" ? "Programi po uzrastu" : "Programs by age"}
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">
            {locale === "sr"
              ? "Izaberite uzrast i otvorite detaljan opis programa."
              : "Choose an age group to open the detailed program page."}
          </p>

          <details className="mt-4 rounded-2xl border border-line bg-[var(--surface-2)] p-4">
            <summary className="cursor-pointer text-sm font-semibold text-[var(--brand-2)] sm:text-base">
              {locale === "sr" ? "Otvori meni uzrasta" : "Open age-group menu"}
            </summary>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {ageGroupLinks.map(([slug, label]) => (
                <Link
                  key={slug}
                  href={`/programs/${slug}`}
                  className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-2)] transition hover:border-[var(--brand)]"
                >
                  {label}
                </Link>
              ))}
            </div>
          </details>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {sortedClasses.map((item) => (
          <ProgramCard key={item.id} item={item} terms={terms} locale={locale} />
        ))}
      </div>
    </div>
  );
}


