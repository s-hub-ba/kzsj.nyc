import { getTranslations } from "next-intl/server";
import { SectionTitle } from "@/components/SectionTitle";
import { Locale } from "@/types/models";

interface ContactPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: ContactPageProps) {
  const { locale } = await params;
  return {
    title: locale === "sr" ? "Kontakt | Kutak za srpski" : "Contact | Kutak za srpski",
    description:
      locale === "sr"
        ? "Kontaktirajte nas za pitanja i personalizovane preporuke."
        : "Get in touch for questions and personalized recommendations.",
  };
}

export default async function ContactPage() {
  const t = await getTranslations("contact");

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-line bg-white p-8 shadow-[var(--shadow)] md:p-10">
        <SectionTitle title={t("title")} description={t("intro")} />
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-line bg-white p-7 shadow-[var(--shadow)]">
          <h3 className="text-3xl text-[var(--brand-2)]">{t("visit")}</h3>
          <p className="mt-3 leading-relaxed text-[var(--muted)]">{t("visitText")}</p>
        </article>
        <article className="rounded-3xl border border-line bg-white p-7 shadow-[var(--shadow)]">
          <h3 className="text-3xl text-[var(--brand-2)]">{t("write")}</h3>
          <p className="mt-3 text-lg font-semibold text-[var(--brand)]">hello@kutakzasrpski.com</p>
          <p className="text-lg font-semibold text-[var(--brand)]">+381 60 123 4567</p>
        </article>
      </section>
    </div>
  );
}
