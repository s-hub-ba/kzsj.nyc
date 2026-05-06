import "server-only";

import {
  getActiveClassesServer,
  getActiveTermsServer,
  getPublishedBlogPostBySlugServer,
  getPublishedBlogPostsServer,
} from "@/lib/firestoreAdmin";
import { sampleBlogPosts, sampleClasses, sampleTerms } from "@/lib/sampleData";
import { BlogPost, SchoolClass, Term } from "@/types/models";

export async function getActiveClasses(): Promise<SchoolClass[]> {
  try {
    return await getActiveClassesServer();
  } catch (error) {
    console.error("[firestore-server] fallback getActiveClasses", error);
    return sampleClasses.filter((item) => item.active);
  }
}

export async function getActiveTerms(classId?: string): Promise<Term[]> {
  try {
    return await getActiveTermsServer(classId);
  } catch (error) {
    console.error("[firestore-server] fallback getActiveTerms", error);
    return sampleTerms.filter((item) => item.active && (!classId || item.classId === classId));
  }
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  try {
    return await getPublishedBlogPostsServer();
  } catch (error) {
    console.error("[firestore-server] fallback getPublishedBlogPosts", error);
    return sampleBlogPosts.filter((item) => item.published);
  }
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    return await getPublishedBlogPostBySlugServer(slug);
  } catch (error) {
    console.error("[firestore-server] fallback getPublishedBlogPostBySlug", error);
    return sampleBlogPosts.find((item) => item.slug === slug && item.published) ?? null;
  }
}
