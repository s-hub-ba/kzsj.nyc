import "server-only";

import {
  getActiveClassesServer,
  getActiveTermsServer,
  getPublishedBlogPostBySlugServer,
  getPublishedBlogPostsServer,
} from "@/lib/firestoreAdmin";
import { sampleBlogPosts, sampleClasses, sampleTerms } from "@/lib/sampleData";
import { BlogPost, SchoolClass, Term } from "@/types/models";

const hasAdminCredentials =
  Boolean(process.env.FIREBASE_ADMIN_PROJECT_ID) &&
  Boolean(process.env.FIREBASE_ADMIN_CLIENT_EMAIL) &&
  Boolean(process.env.FIREBASE_ADMIN_PRIVATE_KEY);

let loggedFallbackNotice = false;

function logFallbackNoticeOnce() {
  if (loggedFallbackNotice) return;

  console.warn(
    "[firestore-server] Using sample data fallback. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY to enable server Firestore.",
  );
  loggedFallbackNotice = true;
}

export async function getActiveClasses(): Promise<SchoolClass[]> {
  if (!hasAdminCredentials) {
    logFallbackNoticeOnce();
    return sampleClasses.filter((item) => item.active);
  }

  try {
    return await getActiveClassesServer();
  } catch (error) {
    console.error("[firestore-server] fallback getActiveClasses", error);
    return sampleClasses.filter((item) => item.active);
  }
}

export async function getActiveTerms(classId?: string): Promise<Term[]> {
  if (!hasAdminCredentials) {
    logFallbackNoticeOnce();
    return sampleTerms.filter((item) => item.active && (!classId || item.classId === classId));
  }

  try {
    return await getActiveTermsServer(classId);
  } catch (error) {
    console.error("[firestore-server] fallback getActiveTerms", error);
    return sampleTerms.filter((item) => item.active && (!classId || item.classId === classId));
  }
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  if (!hasAdminCredentials) {
    logFallbackNoticeOnce();
    return sampleBlogPosts.filter((item) => item.published);
  }

  try {
    return await getPublishedBlogPostsServer();
  } catch (error) {
    console.error("[firestore-server] fallback getPublishedBlogPosts", error);
    return sampleBlogPosts.filter((item) => item.published);
  }
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!hasAdminCredentials) {
    logFallbackNoticeOnce();
    return sampleBlogPosts.find((item) => item.slug === slug && item.published) ?? null;
  }

  try {
    return await getPublishedBlogPostBySlugServer(slug);
  } catch (error) {
    console.error("[firestore-server] fallback getPublishedBlogPostBySlug", error);
    return sampleBlogPosts.find((item) => item.slug === slug && item.published) ?? null;
  }
}
