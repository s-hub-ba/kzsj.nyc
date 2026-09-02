import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { PageHero } from "@/components/PageHero";
import { RichText } from "@/components/RichText";
import { Locale } from "@/types/models";

interface AboutPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: AboutPageProps) {
  const { locale } = await params;
  return {
    title:
      locale === "sr"
        ? "O nama | Škola srpskog zavičajnog jezika"
        : "About | Serbian heritage language school",
    description:
      locale === "sr"
        ? "Upoznajte Kutak za srpski, pedagoški pristup i vrednosti škole srpskog zavičajnog jezika za decu i porodice u Njujorku."
        : "Meet Kutak za srpski, our teaching approach, and the values behind our Serbian heritage language programs for children in New York.",
    keywords:
      locale === "sr"
        ? ["o nama", "tim škole", "srpski zavičajni jezik", "pedagoški pristup"]
        : ["about", "school team", "Serbian heritage language", "teaching approach"],
  };
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;
  const t = await getTranslations("about");
  const paragraphs = [
    t("intro"),
    t("paragraphs.1"),
    t("paragraphs.2"),
    t("paragraphs.3"),
    t("paragraphs.4"),
    t("paragraphs.5"),
    t("paragraphs.6"),
    t("paragraphs.7"),
    t("paragraphs.8"),
  ];
  const pageDescription =
    locale === "sr"
      ? "Pružamo deci prostor za razvoj, pripadnost i povezanost sa srpskim jezikom i kulturom."
      : "We help children grow confident, connected, and proud in their Serbian heritage.";

  return (
    <div className="space-y-8 max-[375px]:space-y-6">
      <PageHero locale={locale} title={t("title")} description={pageDescription} variant="about" />

      <section className="reveal rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7 max-[375px]:rounded-2xl">
        <div className="mx-auto max-w-4xl space-y-5 text-base leading-8 text-[var(--muted)] sm:space-y-6 sm:text-lg sm:leading-8">
          {paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className={`text-pretty rounded-2xl border-l-4 border-[var(--brand)] bg-[var(--surface-2)] px-4 py-3 ${index === 0 ? "font-semibold text-[var(--brand-2)]" : ""}`}
            >
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
      </section>

      <section className="reveal rounded-3xl border border-line bg-white p-3 shadow-[var(--shadow)] sm:p-4 max-[375px]:rounded-2xl">
        <div className="relative mx-auto aspect-[4/3] w-full max-w-4xl overflow-hidden rounded-2xl border border-line bg-[var(--surface-2)]">
          <Image
            src="/images/077da658-1efb-467e-bbfc-0ee9a71ed25a.jpg"
            alt={locale === "sr" ? "Fotografija iz Kutka za srpski" : "Photo from Kutak za srpski"}
            fill
            sizes="(max-width: 1024px) 100vw, 896px"
            className="object-cover"
            priority={false}
          />
        </div>
      </section>

      <section className="reveal rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7 max-[375px]:rounded-2xl">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl leading-tight text-[var(--brand-2)] sm:text-3xl">{t("founder.title")}</h2>
          <p className="mt-4 text-base leading-8 text-[var(--muted)] sm:text-lg sm:leading-8">
            <RichText text={t("founder.bio")} />
          </p>
          <p className="mt-4 text-base leading-8 text-[var(--muted)] sm:text-lg sm:leading-8">
            <RichText text={t("founder.founding")} />
          </p>
        </div>
      </section>
    </div>
  );
}
