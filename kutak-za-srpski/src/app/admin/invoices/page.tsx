"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminInvoices } from "@/components/AdminInvoices";
import { getAdminDashboardData } from "@/lib/firestore";
import { onAdminAuthStateChanged } from "@/lib/auth";
import { Booking, SchoolClass } from "@/types/models";

export default function AdminInvoicesPage() {
  const router = useRouter();
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAdminAuthStateChanged((user) => {
      setCurrentAdmin(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!currentAdmin?.email) {
      return;
    }

    const load = async () => {
      try {
        const data = await getAdminDashboardData();
        setBookings(data.bookings);
        setClasses(data.classes);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [currentAdmin?.email]);

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-bg px-4 py-8 md:px-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Invoices</h1>
              <p className="text-sm text-muted">Standalone invoice management view for admin users.</p>
            </div>
            <button
              onClick={() => router.push("/admin")}
              className="rounded-full border border-line bg-white px-4 py-2 text-sm font-semibold transition hover:bg-surface-2"
            >
              Back to dashboard
            </button>
          </div>

          {loading ? (
            <p className="rounded-2xl border border-line bg-white px-4 py-4 text-sm text-muted shadow-[var(--shadow)]">
              Loading invoices...
            </p>
          ) : (
            <AdminInvoices bookings={bookings} classes={classes} />
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
