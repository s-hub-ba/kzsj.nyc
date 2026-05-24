import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/PageHero";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Locale } from "@/types/models";

interface NewsletterPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: NewsletterPageProps) {
  const { locale } = await params;

  return {
    title: locale === "sr" ? "Newsletter | Kutak za srpski" : "Newsletter | Kutak za srpski",
    description:
      locale === "sr"
        ? "Prijavite se na newsletter i dobijajte novosti i savete jednom mesecno."
        : "Subscribe to the newsletter to receive monthly updates and practical guidance.",
  };
}

export default async function NewsletterPage({ params }: NewsletterPageProps) {
  const { locale } = await params;
  const t = await getTranslations("newsletterPage");

  return (
    <div className="space-y-8 max-[375px]:space-y-6">
      <PageHero locale={locale} title={t("title")} description={t("intro")} variant="contact" />

      <section className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7">
        <h2 className="text-2xl text-[var(--brand-2)] sm:text-3xl">{t("whatYouGet")}</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-[var(--muted)] sm:text-base">
          <li>- {t("items.1")}</li>
          <li>- {t("items.2")}</li>
          <li>- {t("items.3")}</li>
        </ul>
      </section>

      <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm leading-relaxed text-[var(--muted)] shadow-[var(--shadow)] sm:px-5 sm:py-4">
        {t("separationNote")}
      </p>

      <NewsletterForm />
    </div>
  );
}
