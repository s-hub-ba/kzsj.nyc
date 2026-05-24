"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Booking,
  CreateInvoiceInput,
  Invoice,
  InvoiceStatus,
  ReceivedPaymentMethod,
  SchoolClass,
} from "@/types/models";
import {
  createInvoice,
  getInvoiceById,
  getInvoices,
  runScheduledInvoiceReminders,
  sendInvoiceEmail,
  sendInvoiceReminder,
  updateInvoiceStatus,
} from "@/services/invoiceService";
import { CreateInvoiceModal } from "@/components/admin/CreateInvoiceModal";
import { InvoiceStats } from "@/components/admin/InvoiceStats";
import { InvoiceTable } from "@/components/admin/InvoiceTable";

interface AdminInvoicesProps {
  bookings: Booking[];
  classes: SchoolClass[];
  initialBookingId?: string | null;
  onInitialBookingHandled?: () => void;
}

export function AdminInvoices({
  bookings,
  classes,
  initialBookingId,
  onInitialBookingHandled,
}: AdminInvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [runningSchedule, setRunningSchedule] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const loaded = await getInvoices();
        setInvoices(loaded);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    if (!initialBookingId) return;
    setActiveBookingId(initialBookingId);
    setModalOpen(true);
    onInitialBookingHandled?.();
  }, [initialBookingId, onInitialBookingHandled]);

  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => a.parentName.localeCompare(b.parentName)),
    [bookings],
  );

  const openModalFromToolbar = () => {
    setActiveBookingId(sortedBookings[0]?.id ?? null);
    setModalOpen(true);
  };

  const handleCreate = async (input: CreateInvoiceInput) => {
    setCreating(true);
    setNotice("");
    try {
      const result = await createInvoice(input);
      setInvoices((prev) => [result.invoice, ...prev]);
      setModalOpen(false);
      setNotice(
        result.emailQueued
          ? `Invoice ${result.invoice.invoiceNumber} created and sent.`
          : `Invoice ${result.invoice.invoiceNumber} created, but email was not sent.`,
      );
      if (result.emailError) {
        setNotice((prev) => `${prev} ${result.emailError}`.trim());
      }
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (
    invoice: Invoice,
    status: InvoiceStatus,
    paymentMethod?: ReceivedPaymentMethod,
  ) => {
    const updated = await updateInvoiceStatus(invoice.id, status, paymentMethod);
    setInvoices((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    setNotice(`Invoice ${updated.invoiceNumber} status updated.`);
  };

  const handleSendAgain = async (invoice: Invoice) => {
    await sendInvoiceEmail(invoice.id);
    setNotice(`Invoice ${invoice.invoiceNumber} email sent again.`);
  };

  const handleSendReminder = async (invoice: Invoice) => {
    await sendInvoiceReminder(invoice.id);
    setNotice(`Reminder sent for ${invoice.invoiceNumber}.`);
  };

  const handleRunScheduled = async () => {
    setRunningSchedule(true);
    try {
      const result = await runScheduledInvoiceReminders();
      setNotice(
        `Scheduled reminders processed: ${result.processed}. Sent: ${result.sent}. Failed: ${result.failed}.`,
      );
      const loaded = await getInvoices();
      setInvoices(loaded);
    } finally {
      setRunningSchedule(false);
    }
  };

  const handleView = async (invoice: Invoice) => {
    const fresh = await getInvoiceById(invoice.id);
    setSelectedInvoice(fresh ?? invoice);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-semibold text-[var(--brand-2)]">Invoice Management</h2>
          <p className="mt-1 text-sm text-muted">
            Create invoices from bookings, send email notifications, and track payment status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleRunScheduled}
            disabled={runningSchedule}
            className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand-2)] transition hover:bg-surface-2 disabled:opacity-70"
          >
            {runningSchedule ? "Running reminders..." : "Run scheduled reminders"}
          </button>
          <button
            onClick={openModalFromToolbar}
            className="rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-2"
          >
            Create Invoice
          </button>
        </div>
      </div>

      {notice ? (
        <p className="rounded-2xl border border-line bg-white px-4 py-3 text-sm text-[var(--brand-2)] shadow-[var(--shadow)]">
          {notice}
        </p>
      ) : null}

      <InvoiceStats invoices={invoices} />

      <InvoiceTable
        invoices={invoices}
        loading={loading}
        onView={handleView}
        onSendAgain={handleSendAgain}
        onSendReminder={handleSendReminder}
        onStatusChange={handleStatusChange}
      />

      <CreateInvoiceModal
        open={modalOpen}
        bookings={sortedBookings}
        classes={classes}
        initialBookingId={activeBookingId}
        loading={creating}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />

      {selectedInvoice ? (
        <div className="fixed inset-0 z-[80] bg-black/40">
          <div className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto border-l border-line bg-white p-6 shadow-[var(--shadow)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-semibold text-[var(--brand-2)]">{selectedInvoice.invoiceNumber}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-2"
                >
                  Print
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-2"
                >
                  Close
                </button>
              </div>
            </div>

            <article className="printable-invoice mt-5 rounded-3xl border border-line bg-white p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Kutak za srpski</p>
              <h4 className="mt-2 text-3xl font-semibold text-[var(--brand-2)]">Invoice</h4>
              <p className="mt-1 text-sm text-muted">#{selectedInvoice.invoiceNumber}</p>

              <div className="mt-6 grid gap-3 rounded-2xl border border-line bg-surface-2 p-4 text-sm text-muted md:grid-cols-2">
                <p><span className="font-semibold text-foreground">Parent:</span> {selectedInvoice.parentName}</p>
                <p><span className="font-semibold text-foreground">Email:</span> {selectedInvoice.parentEmail}</p>
                <p><span className="font-semibold text-foreground">Child:</span> {selectedInvoice.childName}</p>
                <p><span className="font-semibold text-foreground">Payment method:</span> {selectedInvoice.paymentMethod ?? "-"}</p>
              </div>

              <div className="mt-4 space-y-2 text-sm text-muted">
                <p><span className="font-semibold text-foreground">Service:</span> {selectedInvoice.serviceDescription}</p>
                <p><span className="font-semibold text-foreground">Issue date:</span> {new Date(selectedInvoice.issueDate).toLocaleDateString("sr-RS")}</p>
                <p><span className="font-semibold text-foreground">Due date:</span> {new Date(selectedInvoice.dueDate).toLocaleDateString("sr-RS")}</p>
                <p><span className="font-semibold text-foreground">Amount:</span> {new Intl.NumberFormat("en-US", { style: "currency", currency: selectedInvoice.currency, minimumFractionDigits: 2 }).format(selectedInvoice.amount)}</p>
                <p><span className="font-semibold text-foreground">Payment instructions:</span> {selectedInvoice.paymentInstructions}</p>
                {selectedInvoice.notes ? (
                  <p><span className="font-semibold text-foreground">Notes:</span> {selectedInvoice.notes}</p>
                ) : null}
              </div>
            </article>
          </div>

          <style jsx global>{`
            @media print {
              body * {
                visibility: hidden;
              }

              .printable-invoice,
              .printable-invoice * {
                visibility: visible;
              }

              .printable-invoice {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                border: none;
                box-shadow: none;
              }
            }
          `}</style>
        </div>
      ) : null}
    </div>
  );
}
