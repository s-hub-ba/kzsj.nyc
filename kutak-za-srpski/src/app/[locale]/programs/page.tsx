import { getTranslations } from "next-intl/server";
import { ProgramCard } from "@/components/ProgramCard";
import { PageHero } from "@/components/PageHero";
import { Link } from "@/i18n/navigation";
import { getActiveClasses, getActiveTerms } from "@/lib/firestoreServer";
import { toCanonicalAgeGroup, formatAgeGroupLabel } from "@/lib/programAgeGroups";
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
        ? "Pregled programa srpskog jezika po uzrastu: pojedinacni casovi i semestralni programi za decu od 1 do 7 godina."
        : "Explore age-based Serbian language programs with single classes and semester enrollment for children ages 1 to 7.",
    keywords:
      locale === "sr"
        ? ["programi", "casovi srpskog jezika", "uzrast 1-7", "semestar", "pojedinacni cas"]
        : ["programs", "Serbian classes", "ages 1-7", "semester", "single class"],
  };
}

export default async function ProgramsPage({ params }: ProgramsPageProps) {
  const { locale } = await params;
  const t = await getTranslations("programs");
  const [classes, terms] = await Promise.all([getActiveClasses(), getActiveTerms()]);

  // Derive unique age group nav links from Firestore classes
  const ageGroupSlugs = new Map<string, string>();
  classes.forEach((cls) => {
    if (!cls.ageGroup) return;
    const slug = toCanonicalAgeGroup(cls.ageGroup);
    if (!ageGroupSlugs.has(slug)) {
      ageGroupSlugs.set(slug, formatAgeGroupLabel(cls.ageGroup, locale));
    }
  });
  const ageGroupLinks = Array.from(ageGroupSlugs.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  const systemNotes =
    locale === "sr"
      ? [
          "Prijava postaje vazeca tek nakon potpisanog waiver dokumenta i evidentirane uplate.",
          "Online placanje preko sajta jos nije aktivno; uplata se vodi van sajta dok se poslovna infrastruktura ne zavrsi.",
          "Svaki novi blog automatski se salje newsletter pretplatnicima.",
        ]
      : [
          "A sign-up becomes valid only after the waiver is signed and the payment is recorded.",
          "Online payment through the website is not active yet; payments are tracked offline until the business setup is complete.",
          "Every new blog post is automatically sent to newsletter subscribers.",
        ];

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
        {classes.map((item) => (
          <ProgramCard key={item.id} item={item} terms={terms} locale={locale} />
        ))}
      </div>

      <section className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7">
        <h2 className="text-2xl text-[var(--brand-2)] sm:text-3xl">
          {locale === "sr" ? "Kako funkcionise upis" : "How enrollment works"}
        </h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {systemNotes.map((note) => (
            <p
              key={note}
              className="rounded-2xl border border-line bg-[var(--surface-2)] px-4 py-4 text-sm leading-relaxed text-[var(--muted)]"
            >
              {note}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}


