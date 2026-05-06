import { getTranslations } from "next-intl/server";
import { BookingForm } from "@/components/BookingForm";
import { SectionTitle } from "@/components/SectionTitle";
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

export default async function BookingPage() {
  const t = await getTranslations("booking");

  return (
    <div className="space-y-8">
      <SectionTitle title={t("title")} description={t("intro")} />
      <p className="rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-muted">
        {t("validityNotice")}
      </p>
      <BookingForm />
    </div>
  );
}
