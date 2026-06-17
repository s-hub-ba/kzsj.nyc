import { getTranslations } from "next-intl/server";
import { ProgramCard } from "@/components/ProgramCard";
import { PageHero } from "@/components/PageHero";
import { Link } from "@/i18n/navigation";
import { getActiveClasses, getActiveTerms } from "@/lib/firestoreServer";
import { PROGRAM_AGE_GROUPS } from "@/lib/programAgeGroups";
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
  const agePrograms = PROGRAM_AGE_GROUPS[locale];

  const programHighlights =
    locale === "sr"
      ? [
          {
            title: "Dajmo im reci",
            age: "Uzrast: od 1 do 3 godine",
            attendance: "Neophodno prisustvo jednog roditelja po detetu",
            schedule: "Subotom: 10:00h - 11:20h (80 minuta)",
            calendar: "Svake subote od 5. septembra do 19. decembra 2026. (16 casova)",
            capacity: "Maksimalno 10 dece, uz moguc manualni override za jos 2 mesta po potrebi",
          },
          {
            title: "Pricajmo zajedno",
            age: "Uzrast: od 3 do 5 godina",
            attendance: "Prisustvo roditelja po dogovoru",
            schedule: "Subotom: 11:30h - 12:50h (80 minuta)",
            calendar: "Svake subote od 5. septembra do 19. decembra 2026. (16 casova)",
            capacity: "Maksimalno 10 dece, uz moguc manualni override za jos 2 mesta po potrebi",
          },
          {
            title: "Nasi skolarci",
            age: "Uzrast: od 5 do 7 godina",
            attendance: "Samostalno prisustvo deteta na casu",
            schedule: "Subotom: 13:00h - 14:20h (80 minuta)",
            calendar: "Svake subote od 5. septembra do 19. decembra 2026. (16 casova)",
            capacity: "Maksimalno 10 dece, uz moguc manualni override za jos 2 mesta po potrebi",
          },
        ]
      : [
          {
            title: "Let's Give Them Words",
            age: "Age: 1 to 3 years",
            attendance: "One parent per child is required",
            schedule: "Saturdays: 10:00 - 11:20 (80 minutes)",
            calendar: "Every Saturday from September 5 to December 19, 2026 (16 classes)",
            capacity: "Maximum 10 children, with a manual override for 2 additional spots if needed",
          },
          {
            title: "Let's Speak Together",
            age: "Age: 3 to 5 years",
            attendance: "Parent attendance by agreement",
            schedule: "Saturdays: 11:30 - 12:50 (80 minutes)",
            calendar: "Every Saturday from September 5 to December 19, 2026 (16 classes)",
            capacity: "Maximum 10 children, with a manual override for 2 additional spots if needed",
          },
          {
            title: "Our Young Schoolers",
            age: "Age: 5 to 7 years",
            attendance: "Children attend independently",
            schedule: "Saturdays: 13:00 - 14:20 (80 minutes)",
            calendar: "Every Saturday from September 5 to December 19, 2026 (16 classes)",
            capacity: "Maximum 10 children, with a manual override for 2 additional spots if needed",
          },
        ];

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
            {agePrograms.map((group) => (
              <Link
                key={group.slug}
                href={`/programs/${group.slug}`}
                className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-2)] transition hover:border-[var(--brand)]"
              >
                {group.ageLabel}
              </Link>
            ))}
          </div>
        </details>
      </section>

      <section className="grid gap-5 lg:grid-cols-3">
        {programHighlights.map((program, index) => (
          <article
            key={program.title}
            className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-6"
          >
            <h2 className="text-2xl text-[var(--brand-2)]">{program.title}</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-[var(--muted)] sm:text-[15px]">
              <p>{program.age}</p>
              <p>{program.attendance}</p>
              <p>{program.schedule}</p>
              <p>{program.calendar}</p>
              <p>{program.capacity}</p>
              <Link
                href={`/programs/${agePrograms[index]?.slug ?? "1-3"}`}
                className="inline-flex rounded-full border border-line bg-[var(--surface-2)] px-3 py-1.5 font-semibold text-[var(--brand-2)] transition hover:border-[var(--brand)]"
              >
                {locale === "sr" ? "Detaljan opis" : "Detailed overview"}
              </Link>
            </div>
          </article>
        ))}
      </section>

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
