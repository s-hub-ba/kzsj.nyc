import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export async function adminSignIn(email: string, password: string) {
  if (!auth) {
    throw new Error("Firebase Auth nije konfigurisan.");
  }

  const credential = await signInWithEmailAndPassword(auth, email, password);
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

  return onAuthStateChanged(auth, callback);
}
