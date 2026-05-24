"use client";

import { useMemo, useState } from "react";
import { Booking, ReceivedPaymentMethod, SchoolClass, Term } from "@/types/models";
import { updateBookingWorkflow } from "@/lib/firestore";

interface AdminPaymentsProps {
  bookings: Booking[];
  classes: SchoolClass[];
  terms: Term[];
  currentAdminEmail: string;
  onBookingUpdate: (bookingId: string, updates: Partial<Booking>) => void;
}

export function AdminPayments({
  bookings,
  classes,
  terms,
  currentAdminEmail,
  onBookingUpdate,
}: AdminPaymentsProps) {
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<Record<string, ReceivedPaymentMethod>>(
    Object.fromEntries(
      bookings.map((b) => [
        b.id,
        b.paymentMethod ?? "cash",
      ]),
    ),
  );

  const bookingsByClass = useMemo(() => {
    const filteredByClass =
      selectedClassId === "all"
        ? bookings
        : bookings.filter((booking) => booking.selectedClassId === selectedClassId);

    const mapByClass = (items: Booking[]) =>
      classes
        .map((schoolClass) => {
          const classBookings = items.filter((booking) => booking.selectedClassId === schoolClass.id);
          return {
            classData: schoolClass,
            bookings: classBookings,
          };
        })
        .filter((group) => group.bookings.length > 0);

    return {
      semester: mapByClass(filteredByClass.filter((booking) => booking.bookingType === "semester")),
      single: mapByClass(filteredByClass.filter((booking) => booking.bookingType === "single")),
      filteredTotal: filteredByClass.length,
    };
  }, [bookings, classes, selectedClassId]);

  const unpaidCount = bookings.filter((booking) => booking.paymentStatus !== "paid").length;
  const paidCount = bookings.filter((booking) => booking.paymentStatus === "paid").length;
  const semesterCount = bookings.filter((booking) => booking.bookingType === "semester").length;
  const singleCount = bookings.filter((booking) => booking.bookingType === "single").length;

  const handleMarkAsPaid = async (bookingId: string, method: ReceivedPaymentMethod) => {
    setSavingId(bookingId);
    try {
      const booking = bookings.find((b) => b.id === bookingId);
      if (!booking) return;

      await updateBookingWorkflow(
        bookingId,
        {
          waiverSigned: booking.waiverSigned,
          paymentStatus: "paid",
          paymentMethod: method,
          status: booking.status,
        },
        currentAdminEmail,
      );

      const now = new Date().toISOString();
      onBookingUpdate(bookingId, {
        paymentStatus: "paid",
        paymentMethod: method,
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

  const methodLabels: Record<ReceivedPaymentMethod, string> = {
    cash: "💵 Gotovina",
    bank: "🏦 Transfer",
    zelle: "💳 Zelle",
    venmo: "📱 Venmo",
    other: "📝 Drugo",
  };

  const methodColors: Record<ReceivedPaymentMethod, string> = {
    cash: "bg-info/20 text-info",
    bank: "bg-info/20 text-info",
    zelle: "bg-success/20 text-success",
    venmo: "bg-success/20 text-success",
    other: "bg-muted/20 text-muted",
  };

  const classNameFor = (classId: string, locale: "sr" | "en" = "sr") => {
    const matched = classes.find((c) => c.id === classId);
    if (!matched) return classId;
    return locale === "sr" ? matched.title_sr : matched.title_en;
  };

  const termLabelFor = (termId: string) => {
    const term = terms.find((t) => t.id === termId);
    if (!term) return termId;
    return `${term.title_sr} | ${term.date} | ${term.startTime}-${term.endTime}`;
  };

  const renderPaymentGroup = (
    group: { classData: SchoolClass; bookings: Booking[] },
    typeLabel: "Semestar" | "Pojedinačni čas",
  ) => (
    <section key={`${typeLabel}-${group.classData.id}`} className="rounded-3xl border border-line bg-surface p-6">
      <h3 className="text-xl font-semibold text-[var(--brand-2)]">{group.classData.title_sr}</h3>
      <p className="mt-1 text-sm text-muted">
        {group.classData.ageGroup} · {typeLabel}
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[1400px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-3 px-2">Roditelj</th>
              <th className="py-3 px-2">Kontakt</th>
              <th className="py-3 px-2">Dete</th>
              <th className="py-3 px-2">Termin</th>
              <th className="py-3 px-2">Tip</th>
              <th className="py-3 px-2">Waiver</th>
              <th className="py-3 px-2">Placanje</th>
              <th className="py-3 px-2">Poruka</th>
              <th className="py-3 px-2">Metod</th>
              <th className="py-3 px-2">Akcija</th>
            </tr>
          </thead>
          <tbody>
            {group.bookings.map((booking) => {
              const selectedMethod = paymentMethods[booking.id] ?? booking.paymentMethod ?? "cash";
              return (
                <tr key={booking.id} className="border-b border-line/60 hover:bg-surface-2">
                  <td className="py-3 px-2 font-medium">{booking.parentName}</td>
                  <td className="py-3 px-2 text-xs">
                    <p>{booking.parentEmail}</p>
                    <p className="text-muted">{booking.parentPhone}</p>
                  </td>
                  <td className="py-3 px-2 text-xs">
                    <p>{booking.childName}</p>
                    <p className="text-muted">Uzrast: {booking.childAge}</p>
                  </td>
                  <td className="py-3 px-2 text-xs">{termLabelFor(booking.selectedTermId)}</td>
                  <td className="py-3 px-2 text-xs">{booking.bookingType === "semester" ? "Semestar" : "Pojedinacno"}</td>
                  <td className="py-3 px-2 text-xs">{booking.waiverSigned ? "Potpisan" : "Nije potpisan"}</td>
                  <td className="py-3 px-2 text-xs">{booking.paymentStatus === "paid" ? "Placeno" : "Na cekanju"}</td>
                  <td className="py-3 px-2 text-xs text-muted max-w-[220px]">{booking.message?.trim() ? booking.message : "-"}</td>
                  <td className="py-3 px-2">
                    <select
                      value={selectedMethod}
                      onChange={(event) =>
                        setPaymentMethods((prev) => ({
                          ...prev,
                          [booking.id]: event.target.value as ReceivedPaymentMethod,
                        }))
                      }
                      className={`rounded-lg border border-line px-2 py-1 text-xs ${methodColors[selectedMethod]}`}
                    >
                      <option value="cash">{methodLabels.cash}</option>
                      <option value="zelle">{methodLabels.zelle}</option>
                      <option value="bank">{methodLabels.bank}</option>
                      <option value="venmo">{methodLabels.venmo}</option>
                      <option value="other">{methodLabels.other}</option>
                    </select>
                  </td>
                  <td className="py-3 px-2">
                    {booking.paymentStatus === "paid" ? (
                      <span className="rounded-full bg-success/20 px-3 py-1 text-xs font-medium text-success">
                        Evidentirano
                      </span>
                    ) : (
                      <button
                        onClick={() => void handleMarkAsPaid(booking.id, selectedMethod)}
                        disabled={savingId === booking.id}
                        className="rounded-lg border border-line bg-white px-3 py-1 text-xs font-medium transition hover:bg-surface-2 disabled:opacity-50"
                        title={`Oznaci kao placeno (${classNameFor(booking.selectedClassId)})`}
                      >
                        {savingId === booking.id ? "Cuvanje..." : "Payment received"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">Neplacene prijave</h3>
          <p className="mt-2 text-3xl font-bold">{unpaidCount}</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">Placene prijave</h3>
          <p className="mt-2 text-3xl font-bold">{paidCount}</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">Ukupno prijava</h3>
          <p className="mt-2 text-3xl font-bold">{bookings.length}</p>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">Semestar prijave</h3>
          <p className="mt-2 text-3xl font-bold">{semesterCount}</p>
        </div>
        <div className="rounded-3xl border border-line bg-surface p-6">
          <h3 className="text-sm font-medium text-muted">Pojedinačni čas</h3>
          <p className="mt-2 text-3xl font-bold">{singleCount}</p>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Prijave po programu</h2>
        <p className="mt-1 text-sm text-muted">
          Svaki program ima svoj segment sa podacima roditelja, deteta, termina i statusa uplate.
        </p>

        <div className="mt-4">
          <label className="text-sm text-muted">Filter po programu</label>
          <select
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--brand)] md:max-w-md"
          >
            <option value="all">Svi programi</option>
            {classes.map((schoolClass) => (
              <option key={schoolClass.id} value={schoolClass.id}>
                {schoolClass.title_sr}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Plaćanja po tipu prijave</h2>
        <p className="mt-1 text-sm text-muted">
          Isti split kao u prijavama: odvojeno za semestar i pojedinačne časove.
        </p>
      </section>

      {bookingsByClass.semester.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Semestar</h3>
          {bookingsByClass.semester.map((group) => renderPaymentGroup(group, "Semestar"))}
        </section>
      )}

      {bookingsByClass.single.length > 0 && (
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Pojedinačni čas</h3>
          {bookingsByClass.single.map((group) => renderPaymentGroup(group, "Pojedinačni čas"))}
        </section>
      )}

      {bookingsByClass.filteredTotal === 0 && (
        <section className="rounded-3xl border border-line bg-surface p-6 text-sm text-muted">
          Nema prijava za izabrani program.
        </section>
      )}
    </div>
  );
}
