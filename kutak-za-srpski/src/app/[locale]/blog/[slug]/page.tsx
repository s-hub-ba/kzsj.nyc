import { notFound } from "next/navigation";
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
      title: locale === "sr" ? "Blog" : "Blog",
    };
  }

  return {
    title: locale === "sr" ? post.title_sr : post.title_en,
    description: locale === "sr" ? post.excerpt_sr : post.excerpt_en,
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { locale, slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl rounded-3xl border border-line bg-surface p-8 shadow-[var(--shadow)]">
      <h1 className="text-4xl">{locale === "sr" ? post.title_sr : post.title_en}</h1>
      <p className="mt-4 text-muted">{locale === "sr" ? post.excerpt_sr : post.excerpt_en}</p>
      <div className="mt-8 whitespace-pre-line text-lg leading-8 text-text">
        {locale === "sr" ? post.content_sr : post.content_en}
      </div>
    </article>
  );
}
