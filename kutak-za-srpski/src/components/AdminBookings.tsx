"use client";

import { useState } from "react";
import { Booking, BookingStatus, PaymentStatus } from "@/types/models";
import { updateBookingWorkflow } from "@/lib/firestore";

interface AdminBookingsProps {
  bookings: Booking[];
  currentAdminEmail: string;
  onBookingUpdate: (bookingId: string, updates: Partial<Booking>) => void;
}

export function AdminBookings({
  bookings,
  currentAdminEmail,
  onBookingUpdate,
}: AdminBookingsProps) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<
    Record<string, { waiverSigned: boolean; paymentStatus: PaymentStatus; status: BookingStatus }>
  >(
    Object.fromEntries(
      bookings.map((b) => [
        b.id,
        { waiverSigned: b.waiverSigned, paymentStatus: b.paymentStatus, status: b.status },
      ]),
    ),
  );

  const saveBooking = async (bookingId: string) => {
    const draft = drafts[bookingId];
    if (!draft) return;

    setSavingId(bookingId);
    try {
      await updateBookingWorkflow(bookingId, draft, currentAdminEmail);
      const now = new Date().toISOString();
      onBookingUpdate(bookingId, {
        waiverSigned: draft.waiverSigned,
        paymentStatus: draft.paymentStatus,
        status: draft.status,
        updatedBy: currentAdminEmail,
        updatedAt: now,
      });
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

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Sve prijave</h2>
        <p className="mt-1 text-sm text-muted">Upravljanje waiver-ima, plaćanjima i statusima</p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[1200px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-3 px-2">Roditelj</th>
                <th className="py-3 px-2">Dete</th>
                <th className="py-3 px-2">Waiver</th>
                <th className="py-3 px-2">Plaćanje</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Validnost</th>
                <th className="py-3 px-2">Akcija</th>
                <th className="py-3 px-2">Primer</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const draft = drafts[booking.id];
                const isValid = draft?.waiverSigned && draft?.paymentStatus === "paid";

                return (
                  <tr key={booking.id} className="border-b border-line/60 hover:bg-surface-2">
                    <td className="py-3 px-2 font-medium">{booking.parentName}</td>
                    <td className="py-3 px-2">{booking.childName}</td>
                    <td className="py-3 px-2">
                      <input
                        type="checkbox"
                        checked={draft?.waiverSigned ?? false}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [booking.id]: {
                              ...prev[booking.id],
                              waiverSigned: e.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4 rounded border-line"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={draft?.paymentStatus ?? "pending"}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [booking.id]: {
                              ...prev[booking.id],
                              paymentStatus: e.target.value as PaymentStatus,
                            },
                          }))
                        }
                        className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
                      >
                        <option value="pending">Na čekanju</option>
                        <option value="paid">Plaćeno</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={draft?.status ?? "pending"}
                        onChange={(e) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [booking.id]: {
                              ...prev[booking.id],
                              status: e.target.value as BookingStatus,
                            },
                          }))
                        }
                        className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
                      >
                        <option value="pending">Na čekanju</option>
                        <option value="confirmed">Potvrđena</option>
                        <option value="cancelled">Otkazana</option>
                      </select>
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          isValid ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                        }`}
                      >
                        {isValid ? "✓ Važeća" : "⚠️ Nije važeća"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => void saveBooking(booking.id)}
                        disabled={savingId === booking.id}
                        className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-medium transition hover:bg-surface-2 disabled:opacity-50"
                      >
                        {savingId === booking.id ? "Čuva se..." : "Spremi"}
                      </button>
                    </td>
                    <td className="py-3 px-2 text-xs text-muted">
                      {formatDate(booking.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
