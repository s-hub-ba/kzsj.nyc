import { auth } from "@/lib/firebase";
import { CreateInvoiceInput, Invoice, InvoiceStatus, ReceivedPaymentMethod } from "@/types/models";

type InvoiceAdminAction =
  | "generateInvoiceNumber"
  | "createInvoice"
  | "sendInvoiceEmail"
  | "sendInvoiceReminder"
  | "sendScheduledInvoiceReminders"
  | "updateInvoiceStatus"
  | "getInvoices"
  | "getInvoiceById";

async function callInvoiceAdminApi<T>(
  action: InvoiceAdminAction,
  payload?: Record<string, unknown>,
): Promise<T> {
  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error("Admin korisnik nije prijavljen.");
  }

  const token = await currentUser.getIdToken(true);
  const response = await fetch("/api/admin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, payload }),
  });

  const data = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? "Invoice operacija nije uspela.");
  }

  return data;
}

export function getEffectiveInvoiceStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.status !== "pending") {
    return invoice.status;
  }

  const due = Date.parse(invoice.dueDate);
  if (Number.isNaN(due)) {
    return "pending";
  }

  return due < Date.now() ? "overdue" : "pending";
}

export async function generateInvoiceNumber(issueDate?: string) {
  const result = await callInvoiceAdminApi<{ invoiceNumber: string }>("generateInvoiceNumber", {
    issueDate,
  });
  return result.invoiceNumber;
}

export async function createInvoice(input: CreateInvoiceInput) {
  const result = await callInvoiceAdminApi<{ invoice: Invoice; emailQueued: boolean; emailError?: string }>(
    "createInvoice",
    input as unknown as Record<string, unknown>,
  );
  return result;
}

export async function sendInvoiceEmail(invoiceId: string) {
  return callInvoiceAdminApi<{ ok: true; id?: string }>("sendInvoiceEmail", { invoiceId });
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
  paymentMethod?: ReceivedPaymentMethod,
) {
  const result = await callInvoiceAdminApi<{ invoice: Invoice }>("updateInvoiceStatus", {
    invoiceId,
    status,
    paymentMethod,
  });
  return result.invoice;
}

export async function sendInvoiceReminder(invoiceId: string) {
  return callInvoiceAdminApi<{ ok: true; id?: string }>("sendInvoiceReminder", { invoiceId });
}

export async function runScheduledInvoiceReminders() {
  return callInvoiceAdminApi<{
    ok: true;
    processed: number;
    sent: number;
    failed: number;
  }>("sendScheduledInvoiceReminders");
}

export async function getInvoices() {
  const result = await callInvoiceAdminApi<{ invoices: Invoice[] }>("getInvoices");
  return result.invoices;
}

export async function getInvoiceById(invoiceId: string) {
  const result = await callInvoiceAdminApi<{ invoice: Invoice | null }>("getInvoiceById", {
    invoiceId,
  });
  return result.invoice;
}
