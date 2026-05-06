import { getTranslations } from "next-intl/server";
import { BlogCard } from "@/components/BlogCard";
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
      <SectionTitle title={t("title")} description={t("intro")} />
      <div className="grid gap-6 md:grid-cols-2">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} locale={locale} />
        ))}
      </div>
    </div>
  );
}
