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
    <article className="reveal group rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow)] transition duration-300 hover:-translate-y-1 hover:bg-[var(--surface-2)]">
      <div className="mb-3 inline-flex rounded-full border border-line bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-2)]">
        Blog
      </div>
      <h3 className="mb-2 text-2xl text-[var(--brand-2)]">{locale === "sr" ? post.title_sr : post.title_en}</h3>
      <p className="mb-5 text-[var(--muted)]">
        {locale === "sr" ? post.excerpt_sr : post.excerpt_en}
      </p>
      <Link
        href={`/blog/${post.slug}`}
        className="text-sm font-semibold text-[var(--brand)] transition group-hover:text-[var(--brand-2)]"
      >
        {t("readMore")}
      </Link>
    </article>
  );
}
