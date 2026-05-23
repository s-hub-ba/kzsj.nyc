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
    title: locale === "sr" ? "Rezervacija | Kutak za srpski" : "Booking | Kutak za srpski",
    description:
      locale === "sr"
        ? "Rezervisite pojedinacni cas ili semestar online."
        : "Book a single class or semester online.",
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { locale } = await params;
  const t = await getTranslations("booking");

  return (
    <div className="space-y-8 max-[375px]:space-y-6">
      <PageHero locale={locale} title={t("title")} description={t("intro")} variant="booking" />

      <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-relaxed text-[var(--muted)] shadow-[var(--shadow)] sm:px-5 sm:py-4">
        {t("validityNotice")}
      </p>

      <BookingForm />
    </div>
  );
}
