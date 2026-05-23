import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { ProgramCard } from "@/components/ProgramCard";
import { BlogCard } from "@/components/BlogCard";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Link } from "@/i18n/navigation";
import { getActiveClasses, getActiveTerms, getPublishedBlogPosts } from "@/lib/firestoreServer";
import { Locale } from "@/types/models";

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: HomePageProps) {
  const { locale } = await params;
  return {
    title: locale === "sr" ? "Kutak za srpski | Pocetna" : "Kutak za srpski | Home",
    description:
      locale === "sr"
        ? "Skola srpskog jezika za decu i roditelje."
        : "Serbian language school for children and families.",
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations("home");

  const [classes, terms, posts] = await Promise.all([
    getActiveClasses(),
    getActiveTerms(),
    getPublishedBlogPosts(),
  ]);

  return (
    <div className="space-y-12 max-[375px]:space-y-8 md:space-y-18">
      <Hero />

      <section className="reveal space-y-8">
        <SectionTitle
          eyebrow={t("programsEyebrow")}
          title={t("programsTitle")}
          description={t("programsDescription")}
          locale={locale}
        />
        <div className="grid gap-6 md:grid-cols-2">
          {classes.slice(0, 2).map((item) => (
            <ProgramCard key={item.id} item={item} terms={terms} locale={locale} />
          ))}
        </div>
      </section>

      <section className="reveal rounded-3xl border border-line bg-white p-8 shadow-[var(--shadow)] md:p-10">
        <SectionTitle
          eyebrow={t("bookingEyebrow")}
          title={t("bookingTitle")}
          description={t("bookingDescription")}
          locale={locale}
        />
        <div className="mt-6">
          <Link href="/booking" className="btn-primary w-full sm:w-auto">
            {t("bookingCta")}
          </Link>
        </div>
      </section>

      <section className="space-y-8">
        <SectionTitle
          eyebrow={t("blogEyebrow")}
          title={t("blogTitle")}
          description={t("blogDescription")}
          locale={locale}
        />
        <div className="grid gap-6 md:grid-cols-2">
          {posts.slice(0, 2).map((post) => (
            <BlogCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      </section>

      <section className="reveal">
        <NewsletterForm />
      </section>
    </div>
  );
}
