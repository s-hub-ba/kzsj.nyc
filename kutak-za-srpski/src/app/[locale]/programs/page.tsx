import { getTranslations } from "next-intl/server";
import { ProgramCard } from "@/components/ProgramCard";
import { SectionTitle } from "@/components/SectionTitle";
import { getActiveClasses, getActiveTerms } from "@/lib/firestoreServer";
import { Locale } from "@/types/models";

interface ProgramsPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: ProgramsPageProps) {
  const { locale } = await params;
  return {
    title: locale === "sr" ? "Programi | Kutak za srpski" : "Programs | Kutak za srpski",
    description:
      locale === "sr"
        ? "Programi za pojedinacne casove i semestralno ucenje."
        : "Programs for single classes and semester learning.",
  };
}

export default async function ProgramsPage({ params }: ProgramsPageProps) {
  const { locale } = await params;
  const t = await getTranslations("programs");
  const [classes, terms] = await Promise.all([getActiveClasses(), getActiveTerms()]);

  return (
    <div className="space-y-10">
      <SectionTitle title={t("title")} description={t("intro")} />
      <div className="grid gap-6 md:grid-cols-2">
        {classes.map((item) => (
          <ProgramCard key={item.id} item={item} terms={terms} locale={locale} />
        ))}
      </div>
    </div>
  );
}
