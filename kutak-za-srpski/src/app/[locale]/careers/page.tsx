import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/PageHero";
import { CareersForm } from "@/components/CareersForm";
import { Locale } from "@/types/models";

interface CareersPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: CareersPageProps) {
  const { locale } = await params;

  return {
    title:
      locale === "sr"
        ? "Posao | Konkurs za nastavnike srpskog jezika"
        : "Careers | Serbian language teacher positions",
    description:
      locale === "sr"
        ? "Otvorene prijave za nastavnike srpskog jezika: stalni i povremeni angazman u radu sa decom i porodicama."
        : "Apply for Serbian language teaching roles with full-time and part-time options for educators working with children.",
    keywords:
      locale === "sr"
        ? ["posao", "nastavnik srpskog jezika", "konkurs", "rad sa decom"]
        : ["careers", "Serbian teacher", "job opening", "work with children"],
  };
}

export default async function CareersPage({ params }: CareersPageProps) {
  const { locale } = await params;
  const t = await getTranslations("careers");

  return (
    <div className="space-y-8 max-[375px]:space-y-6">
      <PageHero locale={locale} title={t("title")} description={t("intro")} variant="contact" />

      <section className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7">
        <h2 className="text-2xl text-[var(--brand-2)] sm:text-3xl">{t("whyTitle")}</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
          <li>- {t("benefits.1")}</li>
          <li>- {t("benefits.2")}</li>
          <li>- {t("benefits.3")}</li>
        </ul>
      </section>

      <CareersForm />
    </div>
  );
}
