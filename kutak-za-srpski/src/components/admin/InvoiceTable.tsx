"use client";

import { useMemo, useState } from "react";
import { Invoice, InvoiceStatus, ReceivedPaymentMethod } from "@/types/models";
import { InvoiceStatusBadge } from "@/components/admin/InvoiceStatusBadge";
import { InvoiceCard } from "@/components/admin/InvoiceCard";

interface InvoiceTableProps {
  invoices: Invoice[];
  loading?: boolean;
  onView: (invoice: Invoice) => void;
  onSendAgain: (invoice: Invoice) => void;
  onSendReminder: (invoice: Invoice) => void;
  onStatusChange: (
    invoice: Invoice,
    status: InvoiceStatus,
    paymentMethod?: ReceivedPaymentMethod,
  ) => void;
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("sr-RS");
}

export function InvoiceTable({
  invoices,
  loading,
  onView,
  onSendAgain,
  onSendReminder,
  onStatusChange,
}: InvoiceTableProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "all">("all");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [methodByInvoice, setMethodByInvoice] = useState<Record<string, ReceivedPaymentMethod>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const rows = invoices.filter((invoice) => {
      const searchMatch =
        !q ||
        invoice.invoiceNumber.toLowerCase().includes(q) ||
        invoice.parentName.toLowerCase().includes(q) ||
        invoice.parentEmail.toLowerCase().includes(q) ||
        invoice.childName.toLowerCase().includes(q);

      const currentStatus: InvoiceStatus =
        invoice.status === "pending" && Date.parse(invoice.dueDate) < Date.now()
          ? "overdue"
          : invoice.status;

      const statusMatch = statusFilter === "all" || currentStatus === statusFilter;
      return searchMatch && statusMatch;
    });

    rows.sort((a, b) => {
      const left = Date.parse(a.dueDate);
      const right = Date.parse(b.dueDate);
      return sortDirection === "asc" ? left - right : right - left;
    });

    return rows;
  }, [invoices, query, statusFilter, sortDirection]);

  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--brand-2)]">Invoices</h2>
          <p className="mt-1 text-sm text-muted">Search, filter, and update invoice status in one place.</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by invoice, parent, child..."
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-brand"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as InvoiceStatus | "all")}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-brand"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={sortDirection}
            onChange={(event) => setSortDirection(event.target.value as "asc" | "desc")}
            className="rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-brand"
          >
            <option value="asc">Due date: soonest first</option>
            <option value="desc">Due date: latest first</option>
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:hidden">
        {filtered.map((invoice) => (
          <InvoiceCard
            key={invoice.id}
            invoice={invoice}
            onView={onView}
            onSendAgain={onSendAgain}
            onSendReminder={onSendReminder}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>

      <div className="mt-6 hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-3 px-2">Invoice #</th>
              <th className="py-3 px-2">Parent</th>
              <th className="py-3 px-2">Child</th>
              <th className="py-3 px-2">Amount</th>
              <th className="py-3 px-2">Due date</th>
              <th className="py-3 px-2">Payment method</th>
              <th className="py-3 px-2">Status</th>
              <th className="py-3 px-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((invoice) => {
              const selectedMethod = methodByInvoice[invoice.id] ?? invoice.paymentMethod ?? "bank";

              return (
              <tr key={invoice.id} className="border-b border-line/60 hover:bg-surface-2">
                <td className="py-3 px-2 font-semibold text-[var(--brand-2)]">{invoice.invoiceNumber}</td>
                <td className="py-3 px-2">
                  <p className="font-medium">{invoice.parentName}</p>
                  <p className="text-xs text-muted">{invoice.parentEmail}</p>
                </td>
                <td className="py-3 px-2">{invoice.childName}</td>
                <td className="py-3 px-2">{formatAmount(invoice.amount, invoice.currency)}</td>
                <td className="py-3 px-2">{formatDate(invoice.dueDate)}</td>
                <td className="py-3 px-2">
                  <select
                    value={selectedMethod}
                    onChange={(event) =>
                      setMethodByInvoice((prev) => ({
                        ...prev,
                        [invoice.id]: event.target.value as ReceivedPaymentMethod,
                      }))
                    }
                    className="rounded-lg border border-line bg-white px-2 py-1 text-xs"
                  >
                    <option value="bank">Bank</option>
                    <option value="zelle">Zelle</option>
                    <option value="cash">Cash</option>
                    <option value="venmo">Venmo</option>
                    <option value="other">Other</option>
                  </select>
                </td>
                <td className="py-3 px-2">
                  <InvoiceStatusBadge invoice={invoice} />
                </td>
                <td className="py-3 px-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onView(invoice)}
                      className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold transition hover:bg-surface-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => onSendAgain(invoice)}
                      className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold transition hover:bg-surface-2"
                    >
                      Send Again
                    </button>
                    <button
                      onClick={() => onSendReminder(invoice)}
                      className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold transition hover:bg-surface-2"
                    >
                      Send Reminder
                    </button>
                    <button
                      onClick={() => onStatusChange(invoice, "paid", selectedMethod)}
                      className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold transition hover:bg-surface-2"
                    >
                      Mark Paid
                    </button>
                    <button
                      onClick={() => onStatusChange(invoice, "pending", selectedMethod)}
                      className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold transition hover:bg-surface-2"
                    >
                      Mark Unpaid
                    </button>
                    <button
                      onClick={() => onStatusChange(invoice, "cancelled", selectedMethod)}
                      className="rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold transition hover:bg-surface-2"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!loading && filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-line bg-surface-2 px-4 py-4 text-sm text-muted">
          No invoices match the current search or filters.
        </p>
      ) : null}
    </section>
  );
}
