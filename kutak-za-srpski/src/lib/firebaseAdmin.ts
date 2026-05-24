import "server-only";

import fs from "node:fs";
import path from "node:path";
import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

type ServiceAccount = Parameters<typeof cert>[0];

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

  const serviceAccount = getServiceAccountFromFile();

  if (serviceAccount) {
    return cert(serviceAccount);
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
