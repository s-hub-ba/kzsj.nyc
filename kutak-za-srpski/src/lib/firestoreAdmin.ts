import "server-only";

import { getAdminDb } from "@/lib/firebaseAdmin";
import { BlogPost, SchoolClass, Term } from "@/types/models";

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

function mapAdminDoc<T extends { id: string }>(
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

export async function getActiveClassesServer(): Promise<SchoolClass[]> {
  const db = getAdminDb();
  const snapshot = await db.collection("classes").where("active", "==", true).get();

  return snapshot.docs.map((docRef) => mapAdminDoc<SchoolClass>(docRef.id, docRef.data()));
}

export async function getActiveTermsServer(classId?: string): Promise<Term[]> {
  const db = getAdminDb();
  let ref = db.collection("terms").where("active", "==", true);

  if (classId) {
    ref = ref.where("classId", "==", classId);
  }

  const snapshot = await ref.get();

  return snapshot.docs.map((docRef) => mapAdminDoc<Term>(docRef.id, docRef.data()));
}

export async function getPublishedBlogPostsServer(): Promise<BlogPost[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection("blogPosts")
    .where("published", "==", true)
    .orderBy("createdAt", "desc")
    .get();

  return snapshot.docs.map((docRef) => mapAdminDoc<BlogPost>(docRef.id, docRef.data()));
}

export async function getPublishedBlogPostBySlugServer(slug: string): Promise<BlogPost | null> {
  const db = getAdminDb();
  const snapshot = await db
    .collection("blogPosts")
    .where("slug", "==", slug)
    .where("published", "==", true)
    .limit(1)
    .get();

  const first = snapshot.docs[0];
  return first ? mapAdminDoc<BlogPost>(first.id, first.data()) : null;
}
