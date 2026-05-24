"use client";

import { Invoice } from "@/types/models";
import { getEffectiveInvoiceStatus } from "@/services/invoiceService";

interface InvoiceStatsProps {
  invoices: Invoice[];
}

function amountTotal(items: Invoice[]) {
  return items.reduce((sum, invoice) => sum + invoice.amount, 0);
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function InvoiceStats({ invoices }: InvoiceStatsProps) {
  const withComputedStatus = invoices.map((invoice) => ({
    ...invoice,
    computedStatus: getEffectiveInvoiceStatus(invoice),
  }));

  const paid = withComputedStatus.filter((item) => item.computedStatus === "paid");
  const pending = withComputedStatus.filter((item) => item.computedStatus === "pending");
  const overdue = withComputedStatus.filter((item) => item.computedStatus === "overdue");
  const unpaid = withComputedStatus.filter((item) => item.computedStatus === "pending" || item.computedStatus === "overdue");
  const paidByMethod = paid.reduce(
    (acc, invoice) => {
      const key = invoice.paymentMethod ?? "other";
      acc[key] += invoice.amount;
      return acc;
    },
    { cash: 0, zelle: 0, bank: 0, venmo: 0, other: 0 },
  );

  return (
    <section className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
      <article className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Total invoices</p>
        <p className="mt-2 text-3xl font-bold text-[var(--brand-2)]">{invoices.length}</p>
      </article>
      <article className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Paid invoices</p>
        <p className="mt-2 text-3xl font-bold text-success">{paid.length}</p>
      </article>
      <article className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Pending invoices</p>
        <p className="mt-2 text-3xl font-bold text-warning">{pending.length}</p>
      </article>
      <article className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Overdue invoices</p>
        <p className="mt-2 text-3xl font-bold text-danger">{overdue.length}</p>
      </article>
      <article className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Total revenue</p>
        <p className="mt-2 text-2xl font-bold text-[var(--brand-2)]">{formatCurrency(amountTotal(invoices))}</p>
      </article>
      <article className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Unpaid revenue</p>
        <p className="mt-2 text-2xl font-bold text-danger">{formatCurrency(amountTotal(unpaid))}</p>
      </article>
      </div>

      <article className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)]">
        <p className="text-xs uppercase tracking-[0.14em] text-muted">Paid revenue by method</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <p className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-muted">
            Cash: <span className="font-semibold text-foreground">{formatCurrency(paidByMethod.cash)}</span>
          </p>
          <p className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-muted">
            Zelle: <span className="font-semibold text-foreground">{formatCurrency(paidByMethod.zelle)}</span>
          </p>
          <p className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-muted">
            Bank: <span className="font-semibold text-foreground">{formatCurrency(paidByMethod.bank)}</span>
          </p>
          <p className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-muted">
            Venmo: <span className="font-semibold text-foreground">{formatCurrency(paidByMethod.venmo)}</span>
          </p>
          <p className="rounded-xl border border-line bg-surface-2 px-3 py-2 text-sm text-muted">
            Other: <span className="font-semibold text-foreground">{formatCurrency(paidByMethod.other)}</span>
          </p>
        </div>
      </article>
    </section>
  );
}
