"use client";

import { useCallback, useMemo, useState } from "react";
import { BlogPost } from "@/types/models";
import { saveBlogPost } from "@/lib/firestore";

interface AdminBlogProps {
  posts: BlogPost[];
  onPostUpdate: (posts: BlogPost[]) => void;
}

export function AdminBlog({ posts, onPostUpdate }: AdminBlogProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title_sr: "",
    title_en: "",
    excerpt_sr: "",
    excerpt_en: "",
    content_sr: "",
    content_en: "",
    slug: "",
    sendAsNewsletter: false,
  });

  const draftPosts = useMemo(() => posts.filter((p) => !p.published), [posts]);
  const publishedPosts = useMemo(() => posts.filter((p) => p.published), [posts]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
  };

  const handleTitleChange = (field: "sr" | "en", value: string) => {
    setFormData((prev) => ({
      ...prev,
      [`title_${field}`]: value,
      slug: field === "sr" ? generateSlug(value) : prev.slug,
    }));
  };

  const handleSave = async (asDraft: boolean) => {
    if (
      !formData.title_sr ||
      !formData.title_en ||
      !formData.excerpt_sr ||
      !formData.excerpt_en ||
      !formData.content_sr ||
      !formData.content_en
    ) {
      alert("Popunite sva polja!");
      return;
    }

    setSaving(true);
    try {
      const blogPost: BlogPost = {
        id: editingId || `post_${Date.now()}`,
        title_sr: formData.title_sr,
        title_en: formData.title_en,
        excerpt_sr: formData.excerpt_sr,
        excerpt_en: formData.excerpt_en,
        content_sr: formData.content_sr,
        content_en: formData.content_en,
        slug: formData.slug || generateSlug(formData.title_sr),
        published: !asDraft,
        publishedAt: !asDraft ? new Date().toISOString() : undefined,
        createdAt: editingId ? undefined : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sendAsNewsletter: formData.sendAsNewsletter && !asDraft,
      };

      await saveBlogPost(blogPost);

      // Update local state
      const updated = editingId
        ? posts.map((p) => (p.id === editingId ? blogPost : p))
        : [...posts, blogPost];

      onPostUpdate(updated);

      // Reset form
      setFormData({
        title_sr: "",
        title_en: "",
        excerpt_sr: "",
        excerpt_en: "",
        content_sr: "",
        content_en: "",
        slug: "",
        sendAsNewsletter: false,
      });
      setEditingId(null);
      setShowNewForm(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Čuvanje blog objave nije uspelo.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (post: BlogPost) => {
    setFormData({
      title_sr: post.title_sr,
      title_en: post.title_en,
      excerpt_sr: post.excerpt_sr,
      excerpt_en: post.excerpt_en,
      content_sr: post.content_sr,
      content_en: post.content_en,
      slug: post.slug,
      sendAsNewsletter: post.sendAsNewsletter ?? false,
    });
    setEditingId(post.id);
    setShowNewForm(true);
  };

  const handlePublishDraft = async (post: BlogPost) => {
    setSaving(true);
    try {
      const publishedPost: BlogPost = {
        ...post,
        published: true,
        publishedAt: post.publishedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sendAsNewsletter: post.sendAsNewsletter ?? false,
      };

      await saveBlogPost(publishedPost);

      onPostUpdate(posts.map((item) => (item.id === post.id ? publishedPost : item)));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Objavljivanje nacrta nije uspelo.");
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      return new Date(isoString).toLocaleDateString("sr-RS");
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-6">
      {/* New/Edit Form */}
      {showNewForm && (
        <section className="rounded-3xl border border-line bg-surface p-6">
          <h2 className="text-2xl font-semibold">
            {editingId ? "Uredi članak" : "Kreiraj novi članak"}
          </h2>

          <div className="mt-6 space-y-4">
            {/* Serbian Section */}
            <div className="border-b border-line pb-6">
              <h3 className="font-medium text-muted mb-4">🇷🇸 Srpski</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Naslov</label>
                  <input
                    type="text"
                    value={formData.title_sr}
                    onChange={(e) => handleTitleChange("sr", e.target.value)}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2"
                    placeholder="Naslov članka na srpskom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Kratka verzija</label>
                  <textarea
                    value={formData.excerpt_sr}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, excerpt_sr: e.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-sm"
                    placeholder="Kratka verzija članka (do 160 karaktera)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Tekst</label>
                  <textarea
                    value={formData.content_sr}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, content_sr: e.target.value }))
                    }
                    rows={6}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-sm"
                    placeholder="Tekst članka na srpskom"
                  />
                </div>
              </div>
            </div>

            {/* English Section */}
            <div className="pb-6">
              <h3 className="font-medium text-muted mb-4">🇬🇧 Engleski</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) => handleTitleChange("en", e.target.value)}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2"
                    placeholder="Article title in English"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Short version</label>
                  <textarea
                    value={formData.excerpt_en}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, excerpt_en: e.target.value }))
                    }
                    rows={2}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-sm"
                    placeholder="Short version of article (up to 160 characters)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <textarea
                    value={formData.content_en}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, content_en: e.target.value }))
                    }
                    rows={6}
                    className="w-full rounded-lg border border-line bg-white px-3 py-2 font-mono text-sm"
                    placeholder="Article content in English"
                  />
                </div>
              </div>
            </div>

            {/* Newsletter Option */}
            <div className="rounded-xl border border-line bg-surface-2 p-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.sendAsNewsletter}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, sendAsNewsletter: e.target.checked }))
                  }
                  className="h-4 w-4 rounded border-line"
                />
                <span className="text-sm font-medium">
                  📧 Pošalji kao newsletter pri objavljivanju
                </span>
              </label>
              <p className="mt-2 text-xs text-muted">
                Automatski pošalji ovaj članak svim pretplatnicima newsletter-a
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => void handleSave(true)}
                disabled={saving}
                className="flex-1 rounded-lg border border-line bg-white px-4 py-2 font-medium transition hover:bg-surface-2 disabled:opacity-50"
              >
                {saving ? "Čuva se..." : "💾 Spremi kao draft"}
              </button>
              <button
                onClick={() => void handleSave(false)}
                disabled={saving}
                className="flex-1 rounded-lg bg-accent px-4 py-2 font-medium text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Čuva se..." : "🚀 Objavi"}
              </button>
              <button
                onClick={() => {
                  setShowNewForm(false);
                  setEditingId(null);
                  setFormData({
                    title_sr: "",
                    title_en: "",
                    excerpt_sr: "",
                    excerpt_en: "",
                    content_sr: "",
                    content_en: "",
                    slug: "",
                    sendAsNewsletter: false,
                  });
                }}
                className="rounded-lg border border-line bg-white px-4 py-2 font-medium transition hover:bg-surface-2"
              >
                ✕ Otkaži
              </button>
            </div>
          </div>
        </section>
      )}

      {/* New Post Button */}
      {!showNewForm && (
        <button
          onClick={() => setShowNewForm(true)}
          className="w-full rounded-lg border border-accent/50 bg-accent/10 px-4 py-3 font-medium text-accent transition hover:bg-accent/20"
        >
          ✏️ Kreiraj novi članak
        </button>
      )}

      {/* Draft Posts */}
      {draftPosts.length > 0 && (
        <section className="rounded-3xl border border-warning/50 bg-warning/5 p-6">
          <h2 className="text-2xl font-semibold">Članci u draftu</h2>
          <div className="mt-4 space-y-3">
            {draftPosts.map((post) => (
              <div key={post.id} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-medium">{post.title_sr}</h3>
                    <p className="mt-1 text-sm text-muted">{post.title_en}</p>
                    <p className="mt-2 text-xs text-muted">
                      Kreirano: {formatDate(post.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-medium transition hover:bg-surface-2"
                    >
                      Uredi
                    </button>
                    <button
                      onClick={() => void handlePublishDraft(post)}
                      className="rounded-lg bg-accent/20 px-3 py-1 text-xs font-medium text-accent transition hover:bg-accent/30"
                    >
                      Objavi
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Published Posts */}
      {publishedPosts.length > 0 && (
        <section className="rounded-3xl border border-line bg-surface p-6">
          <h2 className="text-2xl font-semibold">Objavljeni članci</h2>
          <p className="mt-1 text-sm text-muted">{publishedPosts.length} članak/a</p>
          <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
            {publishedPosts.map((post) => (
              <div key={post.id} className="rounded-lg border border-line/60 bg-surface-2 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium">{post.title_sr}</h3>
                    <p className="mt-1 text-sm text-muted">{post.title_en}</p>
                    <div className="mt-2 flex gap-2 text-xs text-muted">
                      <span>📅 {formatDate(post.publishedAt)}</span>
                      {post.sendAsNewsletter && <span>📧 Poslano kao newsletter</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(post)}
                    className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-medium transition hover:bg-surface-2 whitespace-nowrap"
                  >
                    Uredi
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
