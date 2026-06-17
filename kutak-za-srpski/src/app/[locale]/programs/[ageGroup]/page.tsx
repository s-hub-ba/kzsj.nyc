import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { Link } from "@/i18n/navigation";
import { getProgramAgeGroup } from "@/lib/programAgeGroups";
import { Locale } from "@/types/models";

interface ProgramAgeGroupPageProps {
  params: Promise<{ locale: Locale; ageGroup: string }>;
}

export async function generateMetadata({ params }: ProgramAgeGroupPageProps) {
  const { locale, ageGroup } = await params;
  const group = getProgramAgeGroup(locale, ageGroup);

  if (!group) {
    return {
      title:
        locale === "sr"
          ? "Programi | Casovi srpskog jezika za decu"
          : "Programs | Serbian language classes for children",
    };
  }

  return {
    title: `${group.title} | ${locale === "sr" ? "Program srpskog jezika" : "Serbian language program"}`,
    description: group.summary,
    keywords:
      locale === "sr"
        ? ["program", "srpski jezik", group.ageLabel, "upis"]
        : ["program", "Serbian language", group.ageLabel, "enrollment"],
  };
}

export default async function ProgramAgeGroupPage({ params }: ProgramAgeGroupPageProps) {
  const { locale, ageGroup } = await params;
  const group = getProgramAgeGroup(locale, ageGroup);

  if (!group) {
    notFound();
  }

  return (
    <div className="space-y-8 max-[375px]:space-y-6">
      <PageHero locale={locale} title={group.title} description={group.summary} variant="programs" />

      <section className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">{group.ageLabel}</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-line bg-[var(--surface-2)] p-4">
            <h2 className="text-xl text-[var(--brand-2)]">
              {locale === "sr" ? "Ciljevi programa" : "Program goals"}
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted)]">
              {group.goals.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-line bg-[var(--surface-2)] p-4">
            <h2 className="text-xl text-[var(--brand-2)]">
              {locale === "sr" ? "Kako izgleda cas" : "How classes are structured"}
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-[var(--muted)]">
              {group.structure.map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link href="/programs" className="btn-secondary">
          {locale === "sr" ? "Nazad na sve programe" : "Back to all programs"}
        </Link>
        <Link href="/booking" className="btn-primary">
          {locale === "sr" ? "Rezervisi mesto" : "Book a spot"}
        </Link>
      </div>
    </div>
  );
}
