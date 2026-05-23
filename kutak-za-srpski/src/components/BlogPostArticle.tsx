"use client";

import { useEffect, useState } from "react";
import { getPublishedBlogPostBySlug } from "@/lib/firestore";
import { BlogPost, Locale } from "@/types/models";

interface BlogPostArticleProps {
  locale: Locale;
  slug: string;
  initialPost: BlogPost | null;
  notFoundMessage: string;
}

export function BlogPostArticle({
  locale,
  slug,
  initialPost,
  notFoundMessage,
}: BlogPostArticleProps) {
  const [post, setPost] = useState<BlogPost | null>(initialPost);
  const [loading, setLoading] = useState(initialPost === null);

  useEffect(() => {
    if (initialPost) {
      return;
    }

    let cancelled = false;

    const loadPost = async () => {
      try {
        const fetchedPost = await getPublishedBlogPostBySlug(slug);
        if (!cancelled) {
          setPost(fetchedPost);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPost();

    return () => {
      cancelled = true;
    };
  }, [initialPost, slug]);

  if (loading) {
    return <div className="rounded-3xl border border-line bg-white p-8 text-[var(--muted)] shadow-[var(--shadow)]">Loading article...</div>;
  }

  if (!post) {
    return <div className="rounded-3xl border border-line bg-white p-8 text-[var(--muted)] shadow-[var(--shadow)]">{notFoundMessage}</div>;
  }

  return (
    <article className="mx-auto max-w-3xl rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow)] sm:p-8 max-[375px]:rounded-2xl max-[375px]:p-5">
      <h1 className="text-4xl text-[var(--brand-2)] max-[375px]:text-3xl">
        {locale === "sr" ? post.title_sr : post.title_en}
      </h1>
      <p className="mt-4 text-[var(--muted)]">
        {locale === "sr" ? post.excerpt_sr : post.excerpt_en}
      </p>
      <div className="mt-8 whitespace-pre-line text-base leading-8 text-[var(--text)] sm:text-lg">
        {locale === "sr" ? post.content_sr : post.content_en}
      </div>
    </article>
  );
}
