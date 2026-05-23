import "server-only";

import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  limit,
  query,
  where,
  type Firestore,
} from "firebase/firestore";
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

const publicFirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasPublicFirebaseConfig = Object.values(publicFirebaseConfig).every(Boolean);

let loggedFallbackNotice = false;

let publicDb: Firestore | null = null;

function normalizeTimestamp(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return value;
}

function mapPublicDoc<T extends { id: string }>(
  id: string,
  data: Omit<T, "id"> | Record<string, unknown>,
): T {
  return {
    id,
    ...(Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, normalizeTimestamp(value)]),
    ) as Omit<T, "id">),
  } as T;
}

function getPublicDb() {
  if (!hasPublicFirebaseConfig) {
    return null;
  }

  if (publicDb) {
    return publicDb;
  }

  const app = getApps().length ? getApp() : initializeApp(publicFirebaseConfig);
  publicDb = getFirestore(app);
  return publicDb;
}

async function getActiveClassesPublic(): Promise<SchoolClass[]> {
  const db = getPublicDb();
  if (!db) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_* configuration for public Firestore reads.");
  }

  const snapshot = await getDocs(query(collection(db, "classes"), where("active", "==", true)));
  return snapshot.docs.map((docRef) => mapPublicDoc<SchoolClass>(docRef.id, docRef.data()));
}

async function getActiveTermsPublic(classId?: string): Promise<Term[]> {
  const db = getPublicDb();
  if (!db) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_* configuration for public Firestore reads.");
  }

  const constraints = [where("active", "==", true)] as ReturnType<typeof where>[];
  if (classId) {
    constraints.push(where("classId", "==", classId));
  }

  const snapshot = await getDocs(query(collection(db, "terms"), ...constraints));
  return snapshot.docs.map((docRef) => mapPublicDoc<Term>(docRef.id, docRef.data()));
}

async function getPublishedBlogPostsPublic(): Promise<BlogPost[]> {
  const db = getPublicDb();
  if (!db) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_* configuration for public Firestore reads.");
  }

  const snapshot = await getDocs(query(collection(db, "blogPosts"), where("published", "==", true)));
  const posts = snapshot.docs.map((docRef) => mapPublicDoc<BlogPost>(docRef.id, docRef.data()));

  // Keep consistent order without requiring a composite index.
  return posts.sort((a, b) => (a.createdAt ?? "") < (b.createdAt ?? "") ? 1 : -1);
}

async function getPublishedBlogPostBySlugPublic(slug: string): Promise<BlogPost | null> {
  const db = getPublicDb();
  if (!db) {
    throw new Error("Missing NEXT_PUBLIC_FIREBASE_* configuration for public Firestore reads.");
  }

  const snapshot = await getDocs(
    query(collection(db, "blogPosts"), where("slug", "==", slug), limit(1)),
  );
  const first = snapshot.docs[0];
  if (!first) return null;

  const post = mapPublicDoc<BlogPost>(first.id, first.data());
  return post.published ? post : null;
}

function logFallbackNoticeOnce() {
  if (loggedFallbackNotice) return;

  console.warn(
    "[firestore-server] Using sample data fallback. Add FIREBASE_ADMIN_* for admin access or NEXT_PUBLIC_FIREBASE_* for public Firestore reads.",
  );
  loggedFallbackNotice = true;
}

export async function getActiveClasses(): Promise<SchoolClass[]> {
  if (hasAdminCredentials) {
    try {
      return await getActiveClassesServer();
    } catch (error) {
      console.error("[firestore-server] admin fallback getActiveClasses", error);
    }
  }

  if (hasPublicFirebaseConfig) {
    try {
      return await getActiveClassesPublic();
    } catch (error) {
      console.error("[firestore-server] public fallback getActiveClasses", error);
    }
  }

  logFallbackNoticeOnce();
  return sampleClasses.filter((item) => item.active);
}

export async function getActiveTerms(classId?: string): Promise<Term[]> {
  if (hasAdminCredentials) {
    try {
      return await getActiveTermsServer(classId);
    } catch (error) {
      console.error("[firestore-server] admin fallback getActiveTerms", error);
    }
  }

  if (hasPublicFirebaseConfig) {
    try {
      return await getActiveTermsPublic(classId);
    } catch (error) {
      console.error("[firestore-server] public fallback getActiveTerms", error);
    }
  }

  logFallbackNoticeOnce();
  return sampleTerms.filter((item) => item.active && (!classId || item.classId === classId));
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  if (hasAdminCredentials) {
    try {
      return await getPublishedBlogPostsServer();
    } catch (error) {
      console.error("[firestore-server] admin fallback getPublishedBlogPosts", error);
    }
  }

  if (hasPublicFirebaseConfig) {
    try {
      return await getPublishedBlogPostsPublic();
    } catch (error) {
      console.error("[firestore-server] public fallback getPublishedBlogPosts", error);
    }
  }

  logFallbackNoticeOnce();
  return sampleBlogPosts.filter((item) => item.published);
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (hasAdminCredentials) {
    try {
      return await getPublishedBlogPostBySlugServer(slug);
    } catch (error) {
      console.error("[firestore-server] admin fallback getPublishedBlogPostBySlug", error);
    }
  }

  if (hasPublicFirebaseConfig) {
    try {
      return await getPublishedBlogPostBySlugPublic(slug);
    } catch (error) {
      console.error("[firestore-server] public fallback getPublishedBlogPostBySlug", error);
    }
  }

  logFallbackNoticeOnce();
  return sampleBlogPosts.find((item) => item.slug === slug && item.published) ?? null;
}
