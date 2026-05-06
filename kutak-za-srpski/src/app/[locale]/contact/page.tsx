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
    <div className="space-y-8">
      <SectionTitle title={t("title")} description={t("intro")} />
      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-2xl">{t("visit")}</h3>
          <p className="mt-3 text-muted">{t("visitText")}</p>
        </article>
        <article className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-2xl">{t("write")}</h3>
          <p className="mt-3 text-muted">hello@kutakzasrpski.com</p>
          <p className="text-muted">+381 60 123 4567</p>
        </article>
      </section>
    </div>
  );
}
