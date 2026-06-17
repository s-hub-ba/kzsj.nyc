import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Hero } from "@/components/Hero";
import { SectionTitle } from "@/components/SectionTitle";
import { ProgramFlipCard } from "@/components/ProgramFlipCard";
import { BlogPostsGrid } from "@/components/BlogPostsGrid";
import { NewsletterForm } from "@/components/NewsletterForm";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { Link } from "@/i18n/navigation";
import { getActiveClasses, getActiveTerms, getPublishedBlogPosts } from "@/lib/firestoreServer";
import { sampleClasses, sampleTerms } from "@/lib/sampleData";
import { Locale } from "@/types/models";

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: HomePageProps) {
  const { locale } = await params;
  return {
    title:
      locale === "sr"
        ? "Početna | Škola srpskog jezika za decu u Njujorku"
        : "Home | Serbian language school for children in New York",
    description:
      locale === "sr"
        ? "Kutak za srpski je škola srpskog jezika za decu i dvojezične porodice u Njujorku. Upis u programe po uzrastu 1-7 godina."
        : "Kutak za srpski is a Serbian language school in New York for children and bilingual families, with age-based programs from 1 to 7.",
    keywords:
      locale === "sr"
        ? ["početna", "škola srpskog jezika", "srpski za decu", "njujork", "upis programa"]
        : ["home", "Serbian language school", "Serbian for kids", "New York", "enrollment"],
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
          ? "Deca rade zajedno za stolom u učionici"
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
          ? "Dete piše i vežba jezik"
          : "Child writing and practicing language skills",
    },
  ];

  const [classes, terms, posts] = await Promise.all([
    getActiveClasses(),
    getActiveTerms(),
    getPublishedBlogPosts(),
  ]);

  const classesForSection = classes.length > 0 ? classes : sampleClasses.filter((item) => item.active);
  const termsForSection = terms.length > 0 ? terms : sampleTerms;

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

        <PhotoCarousel photos={learningPhotos} />
      </section>

      <section className="reveal space-y-8">
        <SectionTitle
          eyebrow={t("programsEyebrow")}
          title={t("programsTitle")}
          description={t("programsDescription")}
          locale={locale}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {classesForSection.slice(0, 3).map((item) => (
            <ProgramFlipCard key={item.id} item={item} terms={termsForSection} locale={locale} />
          ))}
        </div>
      </section>

      <section className="reveal rounded-3xl border border-line bg-white p-8 shadow-[var(--shadow)] md:p-10">
        <div className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
          <div>
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
          </div>
          <div className="mx-auto w-full max-w-[240px] sm:max-w-[280px] md:mx-0 md:justify-self-end">
            <Image
              src="/Family Values - Online Classes.png"
              alt={locale === "sr" ? "Majka i dete u razgovoru" : "Parent and child talking"}
              width={360}
              height={300}
              className="h-auto w-full"
              priority={false}
            />
          </div>
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
