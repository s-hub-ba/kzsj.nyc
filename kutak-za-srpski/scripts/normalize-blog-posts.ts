#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const keyFileName = process.env.FIREBASE_ADMIN_PRIVATE_KEY_PATH || ".firebase-key.json";
const keyPath = path.resolve(process.cwd(), keyFileName);

if (!fs.existsSync(keyPath)) {
  console.error(`Firebase key file not found at ${keyPath}`);
  process.exit(1);
}

const keyContent = fs.readFileSync(keyPath, "utf-8");
const serviceAccount = JSON.parse(keyContent) as Parameters<typeof cert>[0];

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

function generateSlug(title: string) {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

async function normalizeBlogPosts() {
  const snapshot = await db.collection("blogPosts").get();

  if (snapshot.empty) {
    console.log("No blog posts found.");
    return;
  }

  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data() as Record<string, unknown>;
    const updates: Record<string, unknown> = {};

    if (typeof data.slug !== "string" || !data.slug.trim()) {
      const sourceTitle =
        typeof data.title_sr === "string" && data.title_sr.trim()
          ? data.title_sr
          : typeof data.title_en === "string" && data.title_en.trim()
            ? data.title_en
            : doc.id;
      updates.slug = generateSlug(sourceTitle);
    }

    if (typeof data.published !== "boolean") {
      updates.published = true;
    }

    if (!data.publishedAt && updates.published === true) {
      updates.publishedAt = data.createdAt ?? new Date().toISOString();
    }

    if (Object.keys(updates).length > 0) {
      updates.updatedAt = new Date().toISOString();
      await doc.ref.set(updates, { merge: true });
      updatedCount += 1;
      console.log(`Updated ${doc.id}`, updates);
    }
  }

  console.log(`Done. Updated ${updatedCount} blog post(s).`);
}

void normalizeBlogPosts().catch((error) => {
  console.error("Failed to normalize blog posts:", error);
  process.exit(1);
});
