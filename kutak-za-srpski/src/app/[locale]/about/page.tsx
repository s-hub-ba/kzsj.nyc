import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/PageHero";
import { Locale } from "@/types/models";

interface AboutPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: AboutPageProps) {
  const { locale } = await params;
  return {
    title:
      locale === "sr"
        ? "O nama | Škola srpskog jezika i zajednica porodica"
        : "About | Serbian language school and family community",
    description:
      locale === "sr"
        ? "Upoznajte tim Kutka, pedagoški pristup i vrednosti škole srpskog jezika za decu i porodice u Njujorku."
        : "Meet the Kutak team, teaching approach, and values behind our Serbian language programs for children in New York.",
    keywords:
      locale === "sr"
        ? ["o nama", "tim škole", "srpski jezik za decu", "pedagoški pristup"]
        : ["about", "school team", "Serbian language for children", "teaching approach"],
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const t = await getTranslations("about");

  return (
    <div className="space-y-8 max-[375px]:space-y-6">
      <PageHero locale={locale} title={t("title")} description={t("intro")} variant="about" />

      <section className="grid gap-6 md:grid-cols-3">
        <article className="reveal rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7 max-[375px]:rounded-2xl">
          <h3 className="text-2xl text-[var(--brand-2)] sm:text-3xl">{t("cards.1.title")}</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)] sm:text-base">{t("cards.1.text")}</p>
        </article>
        <article className="reveal rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7 max-[375px]:rounded-2xl">
          <h3 className="text-2xl text-[var(--brand-2)] sm:text-3xl">{t("cards.2.title")}</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)] sm:text-base">{t("cards.2.text")}</p>
        </article>
        <article className="reveal rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7 max-[375px]:rounded-2xl">
          <h3 className="text-2xl text-[var(--brand-2)] sm:text-3xl">{t("cards.3.title")}</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)] sm:text-base">{t("cards.3.text")}</p>
        </article>
      </section>
    </div>
  );
}
