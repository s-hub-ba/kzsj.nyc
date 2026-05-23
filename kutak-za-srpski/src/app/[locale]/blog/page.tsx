import { getTranslations } from "next-intl/server";
import { BlogPostsGrid } from "@/components/BlogPostsGrid";
import { SectionTitle } from "@/components/SectionTitle";
import { getPublishedBlogPosts } from "@/lib/firestoreServer";
import { Locale } from "@/types/models";

interface BlogPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: BlogPageProps) {
  const { locale } = await params;
  return {
    title: locale === "sr" ? "Blog | Kutak za srpski" : "Blog | Kutak za srpski",
    description:
      locale === "sr"
        ? "Saveti, price i teme o dvojezicnom odrastanju."
        : "Tips, stories and topics about bilingual growth.",
  };
}

export default async function BlogPage({ params }: BlogPageProps) {
  const { locale } = await params;
  const t = await getTranslations("blog");
  const posts = await getPublishedBlogPosts();

  return (
    <div className="space-y-10">
      <SectionTitle title={t("title")} description={t("intro")} locale={locale} />
      <BlogPostsGrid
        locale={locale}
        initialPosts={posts}
        emptyMessage={locale === "sr" ? "Još nema objavljenih članaka." : "No published blog posts yet."}
      />
    </div>
  );
}
