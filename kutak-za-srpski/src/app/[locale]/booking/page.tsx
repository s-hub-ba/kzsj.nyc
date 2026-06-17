import { getTranslations } from "next-intl/server";
import { BookingForm } from "@/components/BookingForm";
import { PageHero } from "@/components/PageHero";
import { Locale } from "@/types/models";

interface BookingPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: BookingPageProps) {
  const { locale } = await params;
  return {
    title:
      locale === "sr"
        ? "Prijava | Upis na casove srpskog jezika"
        : "Sign up | Enroll in Serbian language classes",
    description:
      locale === "sr"
        ? "Online prijava za pojedinacni cas ili semestar srpskog jezika za decu. Brz upis i jasni naredni koraci."
        : "Online sign-up for single classes or full-semester Serbian language programs for children with a clear enrollment process.",
    keywords:
      locale === "sr"
        ? ["prijava", "upis", "srpski jezik za decu", "online prijava"]
        : ["sign up", "enrollment", "Serbian language for kids", "online registration"],
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { locale } = await params;
  const t = await getTranslations("booking");
  const processNotes =
    locale === "sr"
      ? [
          "1. Popunjavate prijavu za zeljeni program i termin.",
          "2. Tim Kutka vam salje waiver dokumentaciju i instrukcije za uplatu.",
          "3. Mesto je potvrdeno tek kada su waiver i uplata evidentirani.",
        ]
      : [
          "1. Submit the form for the program and term you want.",
          "2. The Kutak team sends you the waiver documents and payment instructions.",
          "3. Your place is confirmed only after both the waiver and payment are recorded.",
        ];

  return (
    <div className="space-y-8 max-[375px]:space-y-6">
      <PageHero locale={locale} title={t("title")} description={t("intro")} variant="booking" />

      <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-relaxed text-[var(--muted)] shadow-[var(--shadow)] sm:px-5 sm:py-4">
        {t("validityNotice")}
      </p>

      <section className="grid gap-3 md:grid-cols-3">
        {processNotes.map((note) => (
          <p
            key={note}
            className="rounded-2xl border border-line bg-white px-4 py-4 text-sm leading-relaxed text-[var(--muted)] shadow-[var(--shadow)]"
          >
            {note}
          </p>
        ))}
      </section>

      <BookingForm />
    </div>
  );
}
