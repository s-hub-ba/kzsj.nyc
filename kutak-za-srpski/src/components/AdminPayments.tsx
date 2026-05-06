"use client";

import { useState } from "react";
import { Booking } from "@/types/models";
import { updateBookingWorkflow } from "@/lib/firestore";

type PaymentMethod = "pending" | "cash" | "bank" | "zelle" | "venmo" | "other";

interface AdminPaymentsProps {
  bookings: Booking[];
  currentAdminEmail: string;
  onBookingUpdate: (bookingId: string, updates: Partial<Booking>) => void;
}

export function AdminPayments({
  bookings,
  currentAdminEmail,
  onBookingUpdate,
}: AdminPaymentsProps) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, PaymentMethod>>(
    Object.fromEntries(
      bookings.map((b) => [
        b.id,
        b.paymentStatus === "paid" ? ("pending" as PaymentMethod) : "pending",
      ]),
    ),
  );

  const unpaidBookings = bookings.filter((b) => b.paymentStatus !== "paid");
  const totalUnpaid = unpaidBookings.length;
  const totalUnpaidAmount = unpaidBookings.length * 24; // $24 per class

  const handleMarkAsPaid = async (bookingId: string, method: PaymentMethod) => {
    setSavingId(bookingId);
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;

      await updateBookingWorkflow(
        bookingId,
        {
          waiverSigned: booking.waiverSigned,
          paymentStatus: "paid",
          status: booking.status,
        },
        currentAdminEmail,
      );

      const now = new Date().toISOString();
      onBookingUpdate(bookingId, {
        paymentStatus: "paid",
        updatedBy: currentAdminEmail,
        updatedAt: now,
      });

      setPaymentMethods((prev) => ({
        ...prev,
        [bookingId]: method,
      }));
    } finally {
      setSavingId(null);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "—";
    try {
      return new Date(isoString).toLocaleDateString("sr-RS");
    } catch {
      return isoString;
    }
  };

  const methodLabels: Record<PaymentMethod, string> = {
    pending: "⏳ Na čekanju",
    cash: "💵 Gotovina",
    bank: "🏦 Transfer",
    zelle: "💳 Zelle",
    venmo: "📱 Venmo",
    other: "📝 Drugo",
  };

  const methodColors: Record<PaymentMethod, string> = {
    pending: "bg-warning/20 text-warning",
    cash: "bg-info/20 text-info",
    bank: "bg-info/20 text-info",
    zelle: "bg-success/20 text-success",
    venmo: "bg-success/20 text-success",
    other: "bg-muted/20 text-muted",
  };

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">Ukupne neplačene prijave</h3>
          <p className="mt-2 text-3xl font-bold">{totalUnpaid}</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">Ukupna dužna suma</h3>
          <p className="mt-2 text-3xl font-bold">${totalUnpaidAmount.toFixed(2)}</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">Plaćene prijave</h3>
          <p className="mt-2 text-3xl font-bold">
            {bookings.filter((b) => b.paymentStatus === "paid").length}
          </p>
        </div>
      </section>

      {/* Unpaid Bookings */}
      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Neplačene prijave</h2>
        <p className="mt-1 text-sm text-muted">Označite plaćanja preko različitih kanala</p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-3 px-2">Roditelj</th>
                <th className="py-3 px-2">Dete</th>
                <th className="py-3 px-2">Program</th>
                <th className="py-3 px-2">Iznos</th>
                <th className="py-3 px-2">Metoda plaćanja</th>
                <th className="py-3 px-2">Akcije</th>
                <th className="py-3 px-2">Primer</th>
              </tr>
            </thead>
            <tbody>
              {unpaidBookings.map((booking) => (
                <tr key={booking.id} className="border-b border-line/60 hover:bg-surface-2">
                  <td className="py-3 px-2 font-medium">{booking.parentName}</td>
                  <td className="py-3 px-2">{booking.childName}</td>
                  <td className="py-3 px-2 text-sm text-muted">{booking.selectedClassId}</td>
                  <td className="py-3 px-2 font-medium">$24.00</td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        methodColors[paymentMethods[booking.id] ?? "pending"]
                      }`}
                    >
                      {methodLabels[paymentMethods[booking.id] ?? "pending"]}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex flex-wrap gap-1">
                      {["cash", "bank", "zelle", "venmo"].map((method) => (
                        <button
                          key={method}
                          onClick={() =>
                            void handleMarkAsPaid(booking.id, method as PaymentMethod)
                          }
                          disabled={savingId === booking.id}
                          className="rounded-lg border border-line bg-white px-2 py-1 text-xs font-medium transition hover:bg-surface-2 disabled:opacity-50"
                          title={`Označi kao plaćeno - ${methodLabels[method as PaymentMethod]}`}
                        >
                          {methodLabels[method as PaymentMethod].split(" ")[0]}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs text-muted">
                    {formatDate(booking.createdAt)}
                  </td>
                </tr>
              ))}
              {unpaidBookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-3 px-2 text-center text-muted">
                    Sve prijave su plaćene! ✓
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Payment Summary by Method */}
      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Pregled po metodama</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(["cash", "bank", "zelle", "venmo"] as const).map((method) => {
            const count = bookings.filter((b) => paymentMethods[b.id] === method).length;
            return (
              <div key={method} className="rounded-xl border border-line bg-surface-2 p-4">
                <h3 className="font-medium text-muted">{methodLabels[method]}</h3>
                <p className="mt-2 text-2xl font-bold">{count}</p>
                <p className="mt-1 text-sm text-muted">${(count * 24).toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
