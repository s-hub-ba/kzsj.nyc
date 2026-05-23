import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export const ADMIN_EMAILS = [
  "ivanadurovic94@gmail.com",
  "amraisakovic.fig@gmail.com",
] as const;

export function isAllowedAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return ADMIN_EMAILS.includes(email.toLowerCase() as (typeof ADMIN_EMAILS)[number]);
}

export async function adminSignIn(email: string, password: string) {
  if (!auth) {
    throw new Error("Firebase Auth nije konfigurisan.");
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);

  if (!isAllowedAdminEmail(credential.user.email)) {
    await signOut(auth);
    throw new Error("Ovaj nalog nema administratorski pristup.");
  }

  return credential.user;
}

export async function adminSignOut() {
  if (!auth) {
    return;
  }

  await signOut(auth);
}

export function onAdminAuthStateChanged(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => undefined;
  }

  const firebaseAuth = auth;

  return onAuthStateChanged(firebaseAuth, (user) => {
    if (user && !isAllowedAdminEmail(user.email)) {
      void signOut(firebaseAuth);
      callback(null);
      return;
    }

    callback(user);
  });
}
