"use client";

import { useState } from "react";
import { Booking, BookingStatus, PaymentStatus } from "@/types/models";
import { updateBookingWorkflow } from "@/lib/firestore";

interface AdminBookingsProps {
  bookings: Booking[];
  currentAdminEmail: string;
  onBookingUpdate: (bookingId: string, updates: Partial<Booking>) => void;
  onCreateInvoice: (bookingId: string) => void;
}

export function AdminBookings({
  bookings,
  currentAdminEmail,
  onBookingUpdate,
  onCreateInvoice,
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

  const semesterBookings = bookings.filter((booking) => booking.bookingType === "semester");
  const singleBookings = bookings.filter((booking) => booking.bookingType === "single");

  const renderBookingsTable = (items: Booking[]) => (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full min-w-[1300px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-muted">
            <th className="px-2 py-3">Roditelj</th>
            <th className="px-2 py-3">Dete</th>
            <th className="px-2 py-3">Tip</th>
            <th className="px-2 py-3">Waiver</th>
            <th className="px-2 py-3">Plaćanje</th>
            <th className="px-2 py-3">Status</th>
            <th className="px-2 py-3">Validnost</th>
            <th className="px-2 py-3">Akcija</th>
            <th className="px-2 py-3">Faktura</th>
            <th className="px-2 py-3">Prijavljeno</th>
          </tr>
        </thead>
        <tbody>
          {items.map((booking) => {
            const draft = drafts[booking.id];
            const isValid = draft?.waiverSigned && draft?.paymentStatus === "paid";

            return (
              <tr key={booking.id} className="border-b border-line/60 hover:bg-surface-2">
                <td className="px-2 py-3 font-medium">{booking.parentName}</td>
                <td className="px-2 py-3">{booking.childName}</td>
                <td className="px-2 py-3 text-xs">
                  {booking.bookingType === "semester" ? "Semestar" : "Pojedinačni čas"}
                </td>
                <td className="px-2 py-3">
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
                <td className="px-2 py-3">
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
                <td className="px-2 py-3">
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
                <td className="px-2 py-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      isValid ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                    }`}
                  >
                    {isValid ? "✓ Važeća" : "⚠️ Nije važeća"}
                  </span>
                </td>
                <td className="px-2 py-3">
                  <button
                    onClick={() => void saveBooking(booking.id)}
                    disabled={savingId === booking.id}
                    className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-medium transition hover:bg-surface-2 disabled:opacity-50"
                  >
                    {savingId === booking.id ? "Čuva se..." : "Spremi"}
                  </button>
                </td>
                <td className="px-2 py-3">
                  <button
                    onClick={() => onCreateInvoice(booking.id)}
                    className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-medium transition hover:bg-surface-2"
                  >
                    Create Invoice
                  </button>
                </td>
                <td className="px-2 py-3 text-xs text-muted">{formatDate(booking.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Nema prijava u ovoj kategoriji.</p>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">Ukupno prijava</h3>
          <p className="mt-2 text-3xl font-bold">{bookings.length}</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">Semestar</h3>
          <p className="mt-2 text-3xl font-bold">{semesterBookings.length}</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">Pojedinačni čas</h3>
          <p className="mt-2 text-3xl font-bold">{singleBookings.length}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Prijave po tipu</h2>
        <p className="mt-1 text-sm text-muted">Jasan pregled ko je prijavljen za ceo semestar, a ko za pojedinačni čas.</p>

        <div className="mt-6 space-y-8">
          <div>
            <h3 className="text-lg font-semibold">Semestar</h3>
            {renderBookingsTable(semesterBookings)}
          </div>

          <div>
            <h3 className="text-lg font-semibold">Pojedinačni čas</h3>
            {renderBookingsTable(singleBookings)}
          </div>
        </div>
      </section>
    </div>
  );
}
