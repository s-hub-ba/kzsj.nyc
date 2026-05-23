import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/components/SectionTitle";
import { Locale } from "@/types/models";

interface AboutPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: AboutPageProps) {
  const { locale } = await params;
  return {
    title: locale === "sr" ? "O nama | Kutak za srpski" : "About | Kutak za srpski",
    description:
      locale === "sr"
        ? "Upoznajte nas tim i vrednosti skole."
        : "Meet our team and school values.",
  };
}

export default async function AboutPage() {
  const t = await getTranslations("about");

  return (
    <div className="space-y-12">
      <section className="rounded-3xl border border-line bg-white p-8 shadow-[var(--shadow)] md:p-10">
        <SectionTitle title={t("title")} description={t("intro")} />
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <article className="reveal rounded-3xl border border-line bg-white p-7 shadow-[var(--shadow)]">
          <h3 className="text-3xl text-[var(--brand-2)]">{t("cards.1.title")}</h3>
          <p className="mt-3 leading-relaxed text-[var(--muted)]">{t("cards.1.text")}</p>
        </article>
        <article className="reveal rounded-3xl border border-line bg-white p-7 shadow-[var(--shadow)]">
          <h3 className="text-3xl text-[var(--brand-2)]">{t("cards.2.title")}</h3>
          <p className="mt-3 leading-relaxed text-[var(--muted)]">{t("cards.2.text")}</p>
        </article>
        <article className="reveal rounded-3xl border border-line bg-white p-7 shadow-[var(--shadow)]">
          <h3 className="text-3xl text-[var(--brand-2)]">{t("cards.3.title")}</h3>
          <p className="mt-3 leading-relaxed text-[var(--muted)]">{t("cards.3.text")}</p>
        </article>
      </section>
    </div>
  );
}
