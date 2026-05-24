"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Booking, CreateInvoiceInput, ReceivedPaymentMethod, SchoolClass } from "@/types/models";

interface CreateInvoiceModalProps {
  open: boolean;
  bookings: Booking[];
  classes: SchoolClass[];
  initialBookingId?: string | null;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (input: CreateInvoiceInput) => Promise<void>;
}

function dateLabel(date: Date) {
  return date.toLocaleDateString("sr-RS");
}

export function CreateInvoiceModal({
  open,
  bookings,
  classes,
  initialBookingId,
  loading,
  onClose,
  onSubmit,
}: CreateInvoiceModalProps) {
  const [bookingId, setBookingId] = useState("");
  const [serviceDescription, setServiceDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState<ReceivedPaymentMethod>("bank");
  const [paymentInstructions, setPaymentInstructions] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const chosenId = initialBookingId ?? bookings[0]?.id ?? "";
    setBookingId(chosenId);
    setAmount("");
    setCurrency("USD");
    setPaymentMethod("bank");
    setPaymentInstructions("");
    setNotes("");
    setError("");
  }, [open, initialBookingId, bookings]);

  const selectedBooking = useMemo(
    () => bookings.find((booking) => booking.id === bookingId),
    [bookingId, bookings],
  );

  useEffect(() => {
    if (!selectedBooking) {
      setServiceDescription("");
      return;
    }

    const classMatch = classes.find((item) => item.id === selectedBooking.selectedClassId);
    setServiceDescription(classMatch?.title_en ?? selectedBooking.selectedClassId);
  }, [selectedBooking, classes]);

  if (!open) {
    return null;
  }

  const issueDate = new Date();
  const dueDate = new Date(issueDate.getTime());
  dueDate.setDate(dueDate.getDate() + 30);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!selectedBooking || !amount || !serviceDescription.trim() || !paymentInstructions.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    await onSubmit({
      bookingId: selectedBooking.id,
      serviceDescription: serviceDescription.trim(),
      amount: Number(amount),
      currency,
      paymentMethod,
      paymentInstructions: paymentInstructions.trim(),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-[var(--brand-2)]">Create invoice</h2>
          <button
            onClick={onClose}
            className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-2"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block text-sm text-muted">
            Booking
            <select
              value={bookingId}
              onChange={(event) => setBookingId(event.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none transition focus:border-brand"
            >
              {bookings.map((booking) => (
                <option key={booking.id} value={booking.id}>
                  {booking.parentName} | {booking.childName}
                </option>
              ))}
            </select>
          </label>

          {selectedBooking ? (
            <div className="grid gap-3 rounded-2xl border border-line bg-surface-2 p-4 text-sm text-muted md:grid-cols-3">
              <p>
                <span className="font-semibold text-foreground">Parent:</span> {selectedBooking.parentName}
              </p>
              <p>
                <span className="font-semibold text-foreground">Email:</span> {selectedBooking.parentEmail}
              </p>
              <p>
                <span className="font-semibold text-foreground">Child:</span> {selectedBooking.childName}
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm text-muted md:col-span-2">
              Service description
              <input
                value={serviceDescription}
                onChange={(event) => setServiceDescription(event.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none transition focus:border-brand"
              />
            </label>

            <label className="text-sm text-muted">
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none transition focus:border-brand"
              />
            </label>

            <label className="text-sm text-muted">
              Currency
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none transition focus:border-brand"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="RSD">RSD</option>
              </select>
            </label>

            <label className="text-sm text-muted">
              Payment method
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value as ReceivedPaymentMethod)}
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none transition focus:border-brand"
              >
                <option value="bank">Bank transfer</option>
                <option value="zelle">Zelle</option>
                <option value="cash">Cash</option>
                <option value="venmo">Venmo</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="text-sm text-muted md:col-span-2">
              Payment instructions
              <textarea
                rows={4}
                value={paymentInstructions}
                onChange={(event) => setPaymentInstructions(event.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none transition focus:border-brand"
              />
            </label>

            <label className="text-sm text-muted md:col-span-2">
              Notes (optional)
              <textarea
                rows={3}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none transition focus:border-brand"
              />
            </label>
          </div>

          <div className="rounded-2xl border border-line bg-surface-2 p-4 text-sm text-muted">
            <p>
              <span className="font-semibold text-foreground">Issue date:</span> {dateLabel(issueDate)}
            </p>
            <p className="mt-1">
              <span className="font-semibold text-foreground">Due date:</span> {dateLabel(dueDate)} (automatic +30 days)
            </p>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white transition hover:bg-brand-2 disabled:opacity-70"
          >
            {loading ? "Creating..." : "Create & Send Invoice"}
          </button>
        </form>
      </div>
    </div>
  );
}
