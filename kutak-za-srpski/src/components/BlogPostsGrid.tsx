"use client";

import { useEffect, useState } from "react";
import { BlogCard } from "@/components/BlogCard";
import { getPublishedBlogPosts } from "@/lib/firestore";
import { BlogPost, Locale } from "@/types/models";

interface BlogPostsGridProps {
  locale: Locale;
  initialPosts: BlogPost[];
  limit?: number;
  emptyMessage?: string;
}

export function BlogPostsGrid({
  locale,
  initialPosts,
  limit,
  emptyMessage,
}: BlogPostsGridProps) {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = useState(initialPosts.length === 0);

  useEffect(() => {
    if (initialPosts.length > 0) {
      return;
    }

    let cancelled = false;

    const loadPosts = async () => {
      try {
        const fetchedPosts = await getPublishedBlogPosts();
        if (!cancelled) {
          setPosts(fetchedPosts);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadPosts();

    return () => {
      cancelled = true;
    };
  }, [initialPosts]);

  const visiblePosts = typeof limit === "number" ? posts.slice(0, limit) : posts;

  if (loading) {
    return <p className="text-[var(--muted)]">Loading blog posts...</p>;
  }

  if (visiblePosts.length === 0) {
    return (
      <div className="rounded-3xl border border-line bg-white p-6 text-[var(--muted)] shadow-[var(--shadow)]">
        {emptyMessage ?? "No published blog posts yet."}
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {visiblePosts.map((post) => (
        <BlogCard key={post.id} post={post} locale={locale} />
      ))}
    </div>
  );
}
