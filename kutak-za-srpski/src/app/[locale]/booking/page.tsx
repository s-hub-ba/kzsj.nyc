import { getTranslations } from "next-intl/server";
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
        ? "Prijava | Kutak za srpski jesen 2026."
        : "Sign up | Kutak za srpski Fall 2026",
    description:
      locale === "sr"
        ? "Preuzmite brošuru i popunite prijavu za jesenje programe srpskog jezika za decu."
        : "Download the program brochure and submit your application for fall Serbian language classes.",
  };
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { locale } = await params;
  const t = await getTranslations("booking");

  const isSr = locale === "sr";

  return (
    <div className="space-y-8 max-[375px]:space-y-6">
      <PageHero locale={locale} title={t("title")} description={t("intro")} variant="booking" />

      <section className="rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow)] sm:p-8">
        <p className="text-sm leading-relaxed text-[var(--muted)] sm:text-base">
          {isSr
            ? "Pre nego što popunite prijavu, pozivamo vas da preuzmete brošuru sa detaljnim opisima sva tri programa – Prve reči, Prve priče i Školarci. Brošura sadrži raspored, cene, informacije o pristupu nastavi i sve što trebate znati pre upisa."
            : "Before filling out the application, we invite you to download the program brochure with detailed descriptions of all three programs – First Words, First Stories, and Young Schoolers. It includes the schedule, prices, attendance policies, and everything you need to know before enrolling."}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {/* Brochure */}
          <a
            href={
              isSr
                ? "https://canva.link/kutakzasrpski2026jesen"
                : "https://canva.link/kutakzasrpski2026fall"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-2 rounded-2xl border border-line bg-[var(--surface-2)] p-5 transition hover:border-[var(--brand)] hover:bg-white"
          >
            <span className="text-lg font-semibold text-[var(--brand-2)]">
              📄 {isSr ? "Preuzmite brošuru" : "Download brochure"}
            </span>
            <span className="text-sm text-[var(--muted)]">
              {isSr
                ? "Detaljni opisi programa, raspored i cene za jesen 2026."
                : "Program details, schedule and prices for fall 2026."}
            </span>
          </a>

          {/* Application form */}
          <a
            href={
              isSr
                ? "https://forms.gle/fCQth6AL1rNDVwXn6"
                : "https://forms.gle/GXXRGPasom1N2jXH6"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-2 rounded-2xl border border-[var(--brand)]/40 bg-[color-mix(in_oklab,var(--brand)_6%,white)] p-5 transition hover:border-[var(--brand)] hover:bg-[color-mix(in_oklab,var(--brand)_10%,white)]"
          >
            <span className="text-lg font-semibold text-[var(--brand-2)]">
              ✍️ {isSr ? "Popunite prijavu" : "Submit application"}
            </span>
            <span className="text-sm text-[var(--muted)]">
              {isSr
                ? "Kratka online prijava – popunjavanje traje oko 3 minuta."
                : "A short online form – takes about 3 minutes to complete."}
            </span>
          </a>
        </div>

      </section>
    </div>
  );
}

