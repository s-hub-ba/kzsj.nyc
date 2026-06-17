import { BlogPostArticle } from "@/components/BlogPostArticle";
import { getPublishedBlogPostBySlug } from "@/lib/firestoreServer";
import { Locale } from "@/types/models";

interface BlogDetailPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateMetadata({ params }: BlogDetailPageProps) {
  const { locale, slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    return {
      title:
        locale === "sr"
          ? "Blog | Saveti za dvojezično odrastanje"
          : "Blog | Bilingual parenting and Serbian language tips",
    };
  }

  return {
    title: `${locale === "sr" ? post.title_sr : post.title_en} | Kutak blog`,
    description: locale === "sr" ? post.excerpt_sr : post.excerpt_en,
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { locale, slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  return (
    <BlogPostArticle
      locale={locale}
      slug={slug}
      initialPost={post}
      notFoundMessage={locale === "sr" ? "Članak nije pronađen." : "Article not found."}
    />
  );
}
