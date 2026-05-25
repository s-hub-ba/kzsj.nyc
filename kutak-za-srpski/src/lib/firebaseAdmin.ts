import "server-only";

import fs from "node:fs";
import path from "node:path";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

type ServiceAccount = Parameters<typeof cert>[0];

function getServiceAccountFromEnvJson(): ServiceAccount | null {
  const rawJson = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
  if (!rawJson) {
    return null;
  }

  try {
    return JSON.parse(rawJson) as ServiceAccount;
  } catch {
    throw new Error(
      "FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON is not valid JSON. Check that the full service account JSON is copied correctly.",
    );
  }
}

function getServiceAccountFromFile(): ServiceAccount | null {
  const keyFileName = process.env.FIREBASE_ADMIN_PRIVATE_KEY_PATH || ".firebase-key.json";
  const keyPath = path.resolve(process.cwd(), keyFileName);

  if (!fs.existsSync(keyPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(keyPath, "utf-8")) as ServiceAccount;
}

function getAdminCredential() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    return cert({
      projectId,
      clientEmail,
      privateKey: privateKey.replace(/\\n/g, "\n"),
    });
  }

  const serviceAccountFromEnv = getServiceAccountFromEnvJson();
  if (serviceAccountFromEnv) {
    return cert(serviceAccountFromEnv);
  }

  const serviceAccount = getServiceAccountFromFile();

  if (serviceAccount) {
    return cert(serviceAccount);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Firebase Admin credentials are missing. Set either FIREBASE_ADMIN_PROJECT_ID/FIREBASE_ADMIN_CLIENT_EMAIL/FIREBASE_ADMIN_PRIVATE_KEY or FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON in your deployment environment.",
    );
  }

  return applicationDefault();
}

function initializeAdminApp() {
  if (getApps().length) {
    return;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  initializeApp({
    credential: getAdminCredential(),
    ...(projectId ? { projectId } : {}),
  });
}

export function getAdminDb() {
  initializeAdminApp();

  return getFirestore();
}

export function getAdminAuth() {
  initializeAdminApp();

  return getAuth();
}

export function getAdminStorageBucket() {
  initializeAdminApp();

  const bucketName =
    process.env.FIREBASE_STORAGE_BUCKET ||
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    process.env.FIREBASE_ADMIN_PROJECT_ID && process.env.FIREBASE_ADMIN_PROJECT_ID ? `${process.env.FIREBASE_ADMIN_PROJECT_ID}.appspot.com` : undefined;

  if (!bucketName) {
    throw new Error(
      "Firebase Storage bucket is missing. Set FIREBASE_STORAGE_BUCKET or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET in your deployment environment.",
    );
  }

  return getStorage().bucket(bucketName);
}
