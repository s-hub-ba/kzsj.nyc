import { getTranslations } from "next-intl/server";
import { PageHero } from "@/components/PageHero";
import { Locale } from "@/types/models";

interface ContactPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: ContactPageProps) {
  const { locale } = await params;
  return {
    title:
      locale === "sr"
        ? "Kontakt | Skola srpskog jezika Kutak za srpski"
        : "Contact | Kutak Serbian language school",
    description:
      locale === "sr"
        ? "Kontaktirajte nas za upis, termine i preporuku programa srpskog jezika za vase dete."
        : "Contact us for enrollment help, scheduling, and personalized Serbian program recommendations.",
    keywords:
      locale === "sr"
        ? ["kontakt", "upis", "program srpskog jezika", "termini"]
        : ["contact", "enrollment help", "Serbian language program", "schedule"],
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const t = await getTranslations("contact");

  return (
    <div className="space-y-8 max-[375px]:space-y-6">
      <PageHero locale={locale} title={t("title")} description={t("intro")} variant="contact" />

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7 max-[375px]:rounded-2xl">
          <h3 className="text-2xl text-[var(--brand-2)] sm:text-3xl">{t("visit")}</h3>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--muted)] sm:text-base">{t("visitText")}</p>
        </article>
        <article className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7 max-[375px]:rounded-2xl">
          <h3 className="text-2xl text-[var(--brand-2)] sm:text-3xl">{t("write")}</h3>
          <p className="mt-3 text-base font-semibold text-[var(--brand)] sm:text-lg">hello@kutakzasrpski.com</p>
          <p className="text-base font-semibold text-[var(--brand)] sm:text-lg">+381 60 123 4567</p>
        </article>
      </section>
    </div>
  );
}
