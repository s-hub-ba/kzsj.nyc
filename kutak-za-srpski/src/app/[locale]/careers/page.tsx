import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/PageHero";
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
        ? "Pripremamo prijave za držanje časova srpskog jezika subotom, uz moguću nedelju u budućnosti u skladu sa potražnjom."
        : "Applications for teaching Serbian classes on Saturdays are coming soon, with possible Sunday classes in the future based on demand.",
    keywords:
      locale === "sr"
        ? ["posao", "nastavnik srpskog jezika", "konkurs", "rad sa decom"]
        : ["careers", "Serbian teacher", "job opening", "work with children"],
  };
}

export default async function CareersPage({ params }: CareersPageProps) {
  const { locale } = await params;
  const t = await getTranslations("careers");
  const formUrl = "https://docs.google.com/forms/d/e/1FAIpQLSfvJr3iJROIW290R00Lpn9zoyaAWURKbYiVQHSw3nUSMOptJA/viewform?usp=dialog";

  return (
    <div className="space-y-8 max-[375px]:space-y-6">
      <PageHero
        locale={locale}
        title={t("title")}
        description={t("intro")}
        variant="booking"
        eyebrowOverride={locale === "sr" ? "Posao" : "Careers"}
        titleWidthOverride={locale === "sr" ? "max-w-[28ch]" : "max-w-[30ch]"}
      />

      <section className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7">
        <h2 className="text-2xl text-[var(--brand-2)] sm:text-3xl">{t("whyTitle")}</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
          <li>- {t("benefits.1")}</li>
          <li>- {t("benefits.2")}</li>
          <li>- {t("benefits.3")}</li>
        </ul>
      </section>

      <section className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7">
        <h3 className="text-xl text-[var(--brand-2)] sm:text-2xl">{t("applicationTitle")}</h3>
        <p className="mt-3 text-sm leading-relaxed text-[var(--muted)] sm:text-base">{t("applicationNote")}</p>
        <a
          href={formUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mt-5 inline-flex"
        >
          {t("applyCta")}
        </a>
        {/* Internal website form is intentionally kept in codebase and can be re-enabled later. */}
      </section>
    </div>
  );
}
