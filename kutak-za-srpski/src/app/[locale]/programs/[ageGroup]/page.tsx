import { notFound } from "next/navigation";
import { PageHero } from "@/components/PageHero";
import { Link } from "@/i18n/navigation";
import { getActiveClasses } from "@/lib/firestoreServer";
import { toCanonicalAgeGroup } from "@/lib/programAgeGroups";
import { Locale } from "@/types/models";

interface ProgramAgeGroupPageProps {
  params: Promise<{ locale: Locale; ageGroup: string }>;
}

export async function generateMetadata({ params }: ProgramAgeGroupPageProps) {
  const { locale, ageGroup } = await params;
  const classes = await getActiveClasses();
  const cls = classes.find((c) => toCanonicalAgeGroup(c.ageGroup) === ageGroup);

  if (!cls) {
    return {
      title:
        locale === "sr"
          ? "Programi | Casovi srpskog jezika za decu"
          : "Programs | Serbian language classes for children",
    };
  }

  const title = locale === "sr" ? cls.title_sr : cls.title_en;
  const description = locale === "sr" ? cls.description_sr : cls.description_en;

  return {
    title: `${title} | ${locale === "sr" ? "Program srpskog jezika" : "Serbian language program"}`,
    description,
    keywords:
      locale === "sr"
        ? ["program", "srpski jezik", cls.ageGroup, "upis"]
        : ["program", "Serbian language", cls.ageGroup, "enrollment"],
  };
}

export default async function ProgramAgeGroupPage({ params }: ProgramAgeGroupPageProps) {
  const { locale, ageGroup } = await params;
  const classes = await getActiveClasses();
  const cls = classes.find((c) => toCanonicalAgeGroup(c.ageGroup) === ageGroup);

  if (!cls) {
    notFound();
  }

  const title = locale === "sr" ? cls.title_sr : cls.title_en;
  const description = locale === "sr" ? cls.description_sr : cls.description_en;

  return (
    <div className="space-y-8 max-[375px]:space-y-6">
      <PageHero locale={locale} title={title} description="" variant="programs" />

      <section className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--brand)]">
          {cls.ageGroup}
        </p>
        <div className="mt-5 whitespace-pre-line text-sm leading-relaxed text-[var(--muted)] sm:text-base">
          {description}
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

