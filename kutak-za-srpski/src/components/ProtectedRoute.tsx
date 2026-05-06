"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { onAdminAuthStateChanged } from "@/lib/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAdminAuthStateChanged((authUser) => {
      setUser(authUser);
      if (!authUser) {
        router.replace("/admin/login");
      }
    });

    return unsubscribe;
  }, [router]);

  if (user === undefined) {
    return <p className="p-8 text-sm text-muted">Provera prijave...</p>;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
