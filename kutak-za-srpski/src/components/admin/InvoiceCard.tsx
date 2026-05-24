"use client";

import { Invoice, InvoiceStatus, ReceivedPaymentMethod } from "@/types/models";
import { InvoiceStatusBadge } from "@/components/admin/InvoiceStatusBadge";

interface InvoiceCardProps {
  invoice: Invoice;
  onView: (invoice: Invoice) => void;
  onSendAgain: (invoice: Invoice) => void;
  onSendReminder: (invoice: Invoice) => void;
  onStatusChange: (
    invoice: Invoice,
    status: InvoiceStatus,
    paymentMethod?: ReceivedPaymentMethod,
  ) => void;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("sr-RS");
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function InvoiceCard({ invoice, onView, onSendAgain, onSendReminder, onStatusChange }: InvoiceCardProps) {
  return (
    <article className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Invoice</p>
          <h3 className="text-lg font-semibold text-[var(--brand-2)]">{invoice.invoiceNumber}</h3>
        </div>
        <InvoiceStatusBadge invoice={invoice} />
      </div>

      <div className="mt-4 space-y-2 text-sm text-muted">
        <p>
          <span className="font-semibold text-foreground">Parent:</span> {invoice.parentName}
        </p>
        <p>
          <span className="font-semibold text-foreground">Child:</span> {invoice.childName}
        </p>
        <p>
          <span className="font-semibold text-foreground">Amount:</span> {formatAmount(invoice.amount, invoice.currency)}
        </p>
        <p>
          <span className="font-semibold text-foreground">Due:</span> {formatDate(invoice.dueDate)}
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => onView(invoice)}
          className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-2"
        >
          View
        </button>
        <button
          onClick={() => onSendAgain(invoice)}
          className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-2"
        >
          Send again
        </button>
        <button
          onClick={() => onSendReminder(invoice)}
          className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-2"
        >
          Send reminder
        </button>
        <button
          onClick={() => onStatusChange(invoice, "paid", invoice.paymentMethod)}
          className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-2"
        >
          Mark paid
        </button>
        <button
          onClick={() => onStatusChange(invoice, "pending", invoice.paymentMethod)}
          className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-2"
        >
          Mark unpaid
        </button>
        <button
          onClick={() => onStatusChange(invoice, "cancelled", invoice.paymentMethod)}
          className="rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold transition hover:bg-surface-2"
        >
          Cancel
        </button>
      </div>
    </article>
  );
}
