import { BlogPost, Locale } from "@/types/models";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

interface BlogCardProps {
  post: BlogPost;
  locale: Locale;
}

export function BlogCard({ post, locale }: BlogCardProps) {
  const t = useTranslations("common");
  return (
    <article className="reveal rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow)] transition-colors duration-300 hover:bg-surface-2">
      <h3 className="mb-2 text-2xl">{locale === "sr" ? post.title_sr : post.title_en}</h3>
      <p className="mb-5 text-muted">
        {locale === "sr" ? post.excerpt_sr : post.excerpt_en}
      </p>
      <Link
        href={`/blog/${post.slug}`}
        className="text-sm font-semibold text-brand-2"
      >
        {t("readMore")}
      </Link>
    </article>
  );
}
