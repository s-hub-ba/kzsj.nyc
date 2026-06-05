import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { ProgramCard } from "@/components/ProgramCard";
import { BlogPostsGrid } from "@/components/BlogPostsGrid";
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
  const learningPhotos = [
    {
      src: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
      alt:
        locale === "sr"
          ? "Deca rade zajedno za stolom u ucionici"
          : "Children learning together at a classroom table",
    },
    {
      src: "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80",
      alt:
        locale === "sr"
          ? "Nastavnica i deca kroz kreativnu aktivnost"
          : "Teacher and children during a creative lesson",
    },
    {
      src: "https://images.unsplash.com/photo-1577896851231-70ef18881754?auto=format&fit=crop&w=1200&q=80",
      alt:
        locale === "sr"
          ? "Dete pise i vezba jezik"
          : "Child writing and practicing language skills",
    },
  ];

  const [classes, terms, posts] = await Promise.all([
    getActiveClasses(),
    getActiveTerms(),
    getPublishedBlogPosts(),
  ]);

  return (
    <div className="space-y-12 max-[375px]:space-y-8 md:space-y-18">
      <Hero />

      <section className="reveal rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow)] md:p-8">
        <SectionTitle
          eyebrow={t("learningEyebrow")}
          title={t("learningTitle")}
          description={t("learningDescription")}
          locale={locale}
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {learningPhotos.map((photo, index) => (
            <article
              key={photo.src}
              className={`overflow-hidden rounded-2xl border border-line bg-[var(--surface-2)] ${
                index === 0 ? "sm:col-span-2 lg:col-span-2" : ""
              }`}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                className="h-56 w-full object-cover transition duration-300 hover:scale-[1.02] sm:h-64"
                loading="lazy"
              />
            </article>
          ))}
        </div>
      </section>

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
        <BlogPostsGrid locale={locale} initialPosts={posts} limit={2} />
      </section>

      <section className="reveal">
        <NewsletterForm />
      </section>
    </div>
  );
}
