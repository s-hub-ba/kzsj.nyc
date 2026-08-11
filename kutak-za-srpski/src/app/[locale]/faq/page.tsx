import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/PageHero";
import { Locale } from "@/types/models";

interface FaqPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: FaqPageProps) {
  const { locale } = await params;

  return {
    title:
      locale === "sr"
        ? "FAQ | Najcesca pitanja o programu i upisu"
        : "FAQ | Program and enrollment questions",
    description:
      locale === "sr"
        ? "Najcesca pitanja roditelja o rasporedu, nivou jezika, prijavi i organizaciji casova."
        : "Common parent questions about class schedules, language levels, enrollment, and logistics.",
    keywords:
      locale === "sr"
        ? ["faq", "najcesca pitanja", "upis", "srpski jezik"]
        : ["faq", "frequently asked questions", "enrollment", "Serbian language"],
  };
}

export default async function FaqPage({ params }: FaqPageProps) {
  const { locale } = await params;
  const t = await getTranslations("faqPage");

  const entries = ["1", "2", "3", "4", "5", "6"] as const;

  return (
    <div className="space-y-10 max-[375px]:space-y-7">
      <PageHero locale={locale} title={t("title")} description={t("intro")} variant="faq" />

      <section className="mx-auto w-full max-w-4xl space-y-7 sm:space-y-8">
        {entries.map((item) => (
          <article key={item} className="rounded-2xl border border-line/75 bg-white/95 p-6 shadow-sm sm:p-8">
            <h2 className="text-[1.32rem] font-semibold leading-snug tracking-[0.01em] text-[var(--brand-2)] sm:text-[1.58rem]">
              {t(`items.${item}.q`)}
            </h2>
            <p className="mt-4 whitespace-pre-line text-[15px] leading-8 text-[var(--muted)] sm:text-[17px]">
              {t(`items.${item}.a`)}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
