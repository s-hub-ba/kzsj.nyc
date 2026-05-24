"use client";

import { Invoice, InvoiceStatus } from "@/types/models";
import { getEffectiveInvoiceStatus } from "@/services/invoiceService";

interface InvoiceStatusBadgeProps {
  status?: InvoiceStatus;
  dueDate?: string;
  invoice?: Invoice;
}

const stylesByStatus: Record<InvoiceStatus, string> = {
  pending: "bg-warning/20 text-warning",
  paid: "bg-success/20 text-success",
  overdue: "bg-danger/20 text-danger",
  cancelled: "bg-muted/20 text-muted",
};

const labelsByStatus: Record<InvoiceStatus, string> = {
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

export function InvoiceStatusBadge({ status, dueDate, invoice }: InvoiceStatusBadgeProps) {
  const computed: InvoiceStatus = invoice
    ? getEffectiveInvoiceStatus(invoice)
    : status === "pending" && dueDate
      ? Date.parse(dueDate) < Date.now()
        ? "overdue"
        : "pending"
      : (status ?? "pending");

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${stylesByStatus[computed]}`}>
      {labelsByStatus[computed]}
    </span>
  );
}
