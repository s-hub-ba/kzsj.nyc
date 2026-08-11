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
  const paragraphs = [
    t("paragraphs.1"),
    t("paragraphs.2"),
    t("paragraphs.3"),
    t("paragraphs.4"),
    t("paragraphs.5"),
    t("paragraphs.6"),
    t("paragraphs.7"),
    t("paragraphs.8"),
  ];

  return (
    <div className="space-y-8 max-[375px]:space-y-6">
      <PageHero locale={locale} title={t("title")} description={t("intro")} variant="about" />

      <section className="reveal rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7 max-[375px]:rounded-2xl">
        <div className="mx-auto max-w-4xl space-y-5 text-base leading-8 text-[var(--muted)] sm:space-y-6 sm:text-lg sm:leading-8">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-pretty">
              {paragraph}
            </p>
          ))}
        </div>
      </section>

      <section className="reveal rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7 max-[375px]:rounded-2xl">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl leading-tight text-[var(--brand-2)] sm:text-3xl">{t("founder.title")}</h2>
          <p className="mt-4 text-base leading-8 text-[var(--muted)] sm:text-lg sm:leading-8">{t("founder.bio")}</p>
        </div>
      </section>
    </div>
  );
}
