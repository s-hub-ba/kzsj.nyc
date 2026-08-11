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

function isVisibleRecord(value: { active?: boolean }) {
  return value.active !== false;
}

export async function getActiveClassesServer(): Promise<SchoolClass[]> {
  const db = getAdminDb();
  const snapshot = await db.collection("classes").get();

  return snapshot.docs
    .map((docRef) => mapAdminDoc<SchoolClass>(docRef.id, docRef.data()))
    .filter(isVisibleRecord);
}

export async function getActiveTermsServer(classId?: string): Promise<Term[]> {
  const db = getAdminDb();
  const snapshot = classId
    ? await db.collection("terms").where("classId", "==", classId).get()
    : await db.collection("terms").get();

  return snapshot.docs
    .map((docRef) => mapAdminDoc<Term>(docRef.id, docRef.data()))
    .filter(isVisibleRecord);
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
