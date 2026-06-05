"use client";

import { useEffect, useMemo, useState } from "react";
import { Booking, BookingStatus, PaymentStatus, SchoolClass, Term } from "@/types/models";
import {
  assignBookingToTerm,
  sendBookingToQueue,
  updateBookingWorkflow,
} from "@/lib/firestore";

interface AdminBookingsProps {
  bookings: Booking[];
  classes: SchoolClass[];
  terms: Term[];
  currentAdminEmail: string;
  onBookingUpdate: (bookingId: string, updates: Partial<Booking>) => void;
  onTermsUpdate: (terms: Term[]) => void;
  onCreateInvoice: (bookingId: string) => void;
}

type BookingDraft = {
  waiverSigned: boolean;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
};

function isAssigned(booking: Booking) {
  if (booking.placementStatus) {
    return booking.placementStatus === "assigned";
  }

  return booking.status === "confirmed";
}

function formatDate(isoString?: string) {
  if (!isoString) return "-";
  try {
    return new Date(isoString).toLocaleDateString("sr-RS");
  } catch {
    return isoString;
  }
}

export function AdminBookings({
  bookings,
  classes,
  terms,
  currentAdminEmail,
  onBookingUpdate,
  onTermsUpdate,
  onCreateInvoice,
}: AdminBookingsProps) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [dragBookingId, setDragBookingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, BookingDraft>>(
    Object.fromEntries(
      bookings.map((b) => [
        b.id,
        { waiverSigned: b.waiverSigned, paymentStatus: b.paymentStatus, status: b.status },
      ]),
    ),
  );
  const [targetTermByBooking, setTargetTermByBooking] = useState<Record<string, string>>({});

  useEffect(() => {
    setDrafts(
      Object.fromEntries(
        bookings.map((b) => [
          b.id,
          { waiverSigned: b.waiverSigned, paymentStatus: b.paymentStatus, status: b.status },
        ]),
      ),
    );
  }, [bookings]);

  const classById = useMemo(
    () => Object.fromEntries(classes.map((item) => [item.id, item])),
    [classes],
  );
  const termById = useMemo(() => Object.fromEntries(terms.map((item) => [item.id, item])), [terms]);

  const queueBookings = bookings.filter((booking) => !isAssigned(booking));
  const assignedBookings = bookings.filter((booking) => isAssigned(booking));

  const assignedByTerm = useMemo(() => {
    return assignedBookings.reduce<Record<string, Booking[]>>((acc, booking) => {
      const termId = booking.selectedTermId;
      if (!acc[termId]) {
        acc[termId] = [];
      }
      acc[termId].push(booking);
      return acc;
    }, {});
  }, [assignedBookings]);

  const orderedAssignedTerms = useMemo(() => {
    return terms
      .filter((term) => assignedByTerm[term.id]?.length)
      .sort((a, b) => {
        const aDate = Date.parse(`${a.date}T${a.startTime}:00`);
        const bDate = Date.parse(`${b.date}T${b.startTime}:00`);
        return aDate - bDate;
      });
  }, [assignedByTerm, terms]);

  const bookingById = useMemo(
    () => Object.fromEntries(bookings.map((booking) => [booking.id, booking])),
    [bookings],
  );

  const updateTermsCount = (sourceTermId?: string, targetTermId?: string) => {
    if (!sourceTermId && !targetTermId) return;

    onTermsUpdate(
      terms.map((term) => {
        if (sourceTermId && term.id === sourceTermId && sourceTermId !== targetTermId) {
          return { ...term, bookedCount: Math.max((term.bookedCount ?? 0) - 1, 0) };
        }

        if (targetTermId && term.id === targetTermId && sourceTermId !== targetTermId) {
          return { ...term, bookedCount: (term.bookedCount ?? 0) + 1 };
        }

        if (targetTermId && term.id === targetTermId && !sourceTermId) {
          return { ...term, bookedCount: (term.bookedCount ?? 0) + 1 };
        }

        return term;
      }),
    );
  };

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

  const moveToTerm = async (booking: Booking, targetTermId: string) => {
    if (!targetTermId) return;

    setMovingId(booking.id);
    try {
      const sourceTermId = isAssigned(booking) ? booking.selectedTermId : undefined;
      await assignBookingToTerm(booking.id, targetTermId);
      const selectedTerm = termById[targetTermId];
      const now = new Date().toISOString();

      onBookingUpdate(booking.id, {
        selectedTermId: targetTermId,
        selectedClassId: selectedTerm?.classId ?? booking.selectedClassId,
        placementStatus: "assigned",
        status: booking.status === "cancelled" ? "pending" : "confirmed",
        updatedBy: currentAdminEmail,
        updatedAt: now,
      });

      updateTermsCount(sourceTermId, targetTermId);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Pomeranje kandidata nije uspelo.");
    } finally {
      setMovingId(null);
    }
  };

  const moveToQueue = async (booking: Booking) => {
    setMovingId(booking.id);
    try {
      const sourceTermId = isAssigned(booking) ? booking.selectedTermId : undefined;
      await sendBookingToQueue(booking.id);
      const now = new Date().toISOString();

      onBookingUpdate(booking.id, {
        placementStatus: "queue",
        status: booking.status === "cancelled" ? "cancelled" : "pending",
        updatedBy: currentAdminEmail,
        updatedAt: now,
      });

      if (sourceTermId) {
        updateTermsCount(sourceTermId, undefined);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Premestanje u queue nije uspelo.");
    } finally {
      setMovingId(null);
    }
  };

  const onDragStartBooking = (bookingId: string) => {
    setDragBookingId(bookingId);
  };

  const onDragEndBooking = () => {
    setDragBookingId(null);
  };

  const onDropToTerm = async (targetTermId: string) => {
    if (!dragBookingId) return;
    const booking = bookingById[dragBookingId];
    setDragBookingId(null);
    if (!booking) return;
    await moveToTerm(booking, targetTermId);
  };

  const onDropToQueue = async () => {
    if (!dragBookingId) return;
    const booking = bookingById[dragBookingId];
    setDragBookingId(null);
    if (!booking || !isAssigned(booking)) return;
    await moveToQueue(booking);
  };

  const renderWorkflowControls = (booking: Booking) => {
    const draft = drafts[booking.id];
    const isValid = draft?.waiverSigned && draft?.paymentStatus === "paid";

    return (
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-xs">
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
          Waiver
        </label>

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
          className="rounded-xl border border-line bg-white px-3 py-2 text-xs"
        >
          <option value="pending">Placanje: na cekanju</option>
          <option value="paid">Placanje: placeno</option>
          <option value="cancelled">Placanje: otkazano</option>
        </select>

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
          className="rounded-xl border border-line bg-white px-3 py-2 text-xs"
        >
          <option value="pending">Status: na cekanju</option>
          <option value="confirmed">Status: potvrdena</option>
          <option value="cancelled">Status: otkazana</option>
        </select>

        <div className="flex items-center rounded-xl border border-line bg-surface-2 px-3 py-2 text-xs">
          {isValid ? "Validna prijava" : "Nije validna"}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => void saveBooking(booking.id)}
            disabled={savingId === booking.id}
            className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium transition hover:bg-surface-2 disabled:opacity-50"
          >
            {savingId === booking.id ? "Cuva se..." : "Snimi"}
          </button>
          <button
            onClick={() => onCreateInvoice(booking.id)}
            className="rounded-xl border border-line bg-white px-3 py-2 text-xs font-medium transition hover:bg-surface-2"
          >
            Faktura
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">Ukupno prijava</h3>
          <p className="mt-2 text-3xl font-bold">{bookings.length}</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">Queue</h3>
          <p className="mt-2 text-3xl font-bold">{queueBookings.length}</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">U grupama</h3>
          <p className="mt-2 text-3xl font-bold">{assignedBookings.length}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Queue kandidata</h2>
        <p className="mt-1 text-sm text-muted">
          Kandidati iz queue-a mogu odmah da se dodaju u grupu.
        </p>

        <div
          className={`mt-6 space-y-4 rounded-2xl p-2 transition ${dragBookingId ? "bg-brand/5" : ""}`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            void onDropToQueue();
          }}
        >
          {queueBookings.map((booking) => {
            const selectedTermId = targetTermByBooking[booking.id] ?? booking.selectedTermId;
            return (
              <article
                key={booking.id}
                draggable
                onDragStart={() => onDragStartBooking(booking.id)}
                onDragEnd={onDragEndBooking}
                className={`rounded-2xl border border-line bg-surface-2 p-4 ${dragBookingId === booking.id ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold">{booking.childName}</p>
                    <p className="text-sm text-muted">
                      Roditelj: {booking.parentName} ({booking.parentEmail})
                    </p>
                    <p className="text-xs text-muted">Prijavljeno: {formatDate(booking.createdAt)}</p>
                  </div>

                  <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                    <select
                      value={selectedTermId}
                      onChange={(e) =>
                        setTargetTermByBooking((prev) => ({ ...prev, [booking.id]: e.target.value }))
                      }
                      className="min-w-[250px] rounded-xl border border-line bg-white px-3 py-2 text-xs"
                    >
                      <option value="">Izaberi termin za dodelu</option>
                      {terms.map((term) => {
                        const cls = classById[term.classId];
                        const max = term.capacity + (term.overbookLimit ?? 0);
                        return (
                          <option key={term.id} value={term.id}>
                            {cls?.title_sr ?? "Grupa"} | {term.title_sr} | {term.bookedCount}/{max}
                          </option>
                        );
                      })}
                    </select>

                    <button
                      onClick={() => void moveToTerm(booking, selectedTermId)}
                      disabled={!selectedTermId || movingId === booking.id}
                      className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                    >
                      {movingId === booking.id ? "Dodela..." : "Dodaj u grupu"}
                    </button>
                  </div>
                </div>

                <div className="mt-3">{renderWorkflowControls(booking)}</div>
              </article>
            );
          })}

          {queueBookings.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-surface-2 px-4 py-10 text-center text-sm text-muted">
              Queue je trenutno prazan.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Grupe i kandidati</h2>
        <p className="mt-1 text-sm text-muted">
          Svaki termin prikazuje prijavljene kandidate. Mozete ih ukloniti iz grupe ili prebaciti u drugi termin.
        </p>

        <div className="mt-6 space-y-5">
          {orderedAssignedTerms.map((term) => {
            const termBookings = assignedByTerm[term.id] ?? [];
            const cls = classById[term.classId];
            const max = term.capacity + (term.overbookLimit ?? 0);
            const fill = max > 0 ? Math.min(((term.bookedCount ?? 0) / max) * 100, 100) : 0;

            return (
              <article
                key={term.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => {
                  void onDropToTerm(term.id);
                }}
                className={`rounded-2xl border border-line bg-surface-2 p-4 transition ${dragBookingId ? "ring-1 ring-brand/30" : ""}`}
              >
                <header className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{cls?.title_sr ?? "Grupa"} - {term.title_sr}</h3>
                    <p className="text-sm text-muted">
                      {term.date} | {term.startTime} - {term.endTime} | {term.location}
                    </p>
                  </div>
                  <div className="min-w-[220px]">
                    <p className="mb-1 text-right text-xs text-muted">
                      Popunjenost: {term.bookedCount}/{max}
                    </p>
                    <div className="h-2 overflow-hidden rounded-full bg-line">
                      <div className="h-full bg-brand" style={{ width: `${fill}%` }} />
                    </div>
                  </div>
                </header>

                <div className="mt-4 space-y-3">
                  {termBookings.map((booking) => {
                    const selectedTermId = targetTermByBooking[booking.id] ?? booking.selectedTermId;
                    return (
                      <div
                        key={booking.id}
                        draggable
                        onDragStart={() => onDragStartBooking(booking.id)}
                        onDragEnd={onDragEndBooking}
                        className={`rounded-xl border border-line bg-white p-3 ${dragBookingId === booking.id ? "opacity-60" : ""}`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{booking.childName}</p>
                            <p className="text-sm text-muted">
                              {booking.parentName} ({booking.parentEmail})
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <select
                              value={selectedTermId}
                              onChange={(e) =>
                                setTargetTermByBooking((prev) => ({ ...prev, [booking.id]: e.target.value }))
                              }
                              className="min-w-[220px] rounded-lg border border-line bg-white px-2 py-1 text-xs"
                            >
                              {terms.map((targetTerm) => {
                                const targetClass = classById[targetTerm.classId];
                                const targetMax = targetTerm.capacity + (targetTerm.overbookLimit ?? 0);
                                return (
                                  <option key={targetTerm.id} value={targetTerm.id}>
                                    {targetClass?.title_sr ?? "Grupa"} | {targetTerm.title_sr} | {targetTerm.bookedCount}/{targetMax}
                                  </option>
                                );
                              })}
                            </select>

                            <button
                              onClick={() => void moveToTerm(booking, selectedTermId)}
                              disabled={movingId === booking.id || selectedTermId === booking.selectedTermId}
                              className="rounded-lg border border-line px-3 py-1 text-xs font-medium transition hover:bg-surface-2 disabled:opacity-50"
                            >
                              Prebaci
                            </button>

                            <button
                              onClick={() => void moveToQueue(booking)}
                              disabled={movingId === booking.id}
                              className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-1 text-xs font-medium text-warning transition hover:bg-warning/20 disabled:opacity-50"
                            >
                              Vrati u queue
                            </button>
                          </div>
                        </div>

                        <div className="mt-3">{renderWorkflowControls(booking)}</div>
                      </div>
                    );
                  })}

                  {termBookings.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-line px-3 py-6 text-center text-sm text-muted">
                      Jos nema kandidata u ovom terminu.
                    </p>
                  ) : null}
                </div>
              </article>
            );
          })}

          {orderedAssignedTerms.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
              Nema grupa sa dodeljenim kandidatima.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
