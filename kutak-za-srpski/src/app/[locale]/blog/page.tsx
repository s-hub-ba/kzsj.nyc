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
    title:
      locale === "sr"
        ? "Blog | Saveti za dvojezično odrastanje"
        : "Blog | Bilingual parenting and Serbian language tips",
    description:
      locale === "sr"
        ? "Blog sa savetima za roditelje, dvojezično odrastanje i razvoj srpskog jezika kod dece u dijaspori."
        : "Read practical posts on bilingual parenting, diaspora family life, and Serbian language development for children.",
    keywords:
      locale === "sr"
        ? ["blog", "dvojezično odrastanje", "saveti za roditelje", "srpski jezik"]
        : ["blog", "bilingual parenting", "parent tips", "Serbian language development"],
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
