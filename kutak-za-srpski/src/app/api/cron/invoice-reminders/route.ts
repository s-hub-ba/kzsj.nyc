import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { writeEmailLog } from "@/lib/emailLogs";
import { sendInvoiceReminderEmail } from "@/services/emailService";
import { Invoice } from "@/types/models";

function mapDoc<T extends { id: string }>(
  id: string,
  data: Omit<T, "id"> | Record<string, unknown>,
): T {
  return { id, ...(data as Omit<T, "id">) } as T;
}

function normalizeInvoiceStatus(invoice: Invoice): Invoice {
  if (invoice.status !== "pending") {
    return invoice;
  }

  const dueDateMs = Date.parse(invoice.dueDate);
  if (Number.isNaN(dueDateMs)) {
    return invoice;
  }

  return dueDateMs < Date.now() ? { ...invoice, status: "overdue" } : invoice;
}

function getInvoiceDaysOverdue(invoice: Invoice) {
  const dueMs = Date.parse(invoice.dueDate);
  if (Number.isNaN(dueMs)) return 0;
  const diff = Date.now() - dueMs;
  if (diff <= 0) return 0;
  return Math.floor(diff / (24 * 60 * 60 * 1000));
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.INVOICE_REMINDER_CRON_SECRET;
  if (!secret) {
    return false;
  }

  const authHeader = request.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const customHeaderToken = request.headers.get("x-cron-secret");

  return bearerToken === secret || customHeaderToken === secret;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const snapshot = await db
    .collection("invoices")
    .where("reminderEnabled", "==", true)
    .where("status", "in", ["pending", "overdue"])
    .get();

  const nowMs = Date.now();
  const candidates = snapshot.docs
    .map((docRef) => normalizeInvoiceStatus(mapDoc<Invoice>(docRef.id, docRef.data())))
    .filter((invoice) => {
      const nextReminderMs = Date.parse(invoice.nextReminderAt ?? invoice.dueDate);
      return !Number.isNaN(nextReminderMs) && nextReminderMs <= nowMs;
    });

  let sent = 0;
  let failed = 0;

  for (const invoice of candidates) {
    try {
      const result = await sendInvoiceReminderEmail({
        invoice,
        daysOverdue: getInvoiceDaysOverdue(invoice),
      });

      const now = new Date();
      const intervalDays = invoice.reminderIntervalDays ?? 7;
      const nextReminderAt = new Date(now.getTime());
      nextReminderAt.setDate(nextReminderAt.getDate() + intervalDays);

      await db.collection("invoices").doc(invoice.id).set(
        {
          status: normalizeInvoiceStatus(invoice).status,
          reminderCount: (invoice.reminderCount ?? 0) + 1,
          lastReminderSentAt: now.toISOString(),
          nextReminderAt: nextReminderAt.toISOString(),
          updatedAt: now.toISOString(),
        },
        { merge: true },
      );

      await writeEmailLog({
        type: "invoice-reminder",
        bookingId: invoice.bookingId,
        parentEmail: invoice.parentEmail,
        parentName: invoice.parentName,
        subject: `Kutak za srpski | Reminder ${invoice.invoiceNumber}`,
        status: "sent",
        provider: "resend",
        providerMessageId: result.id,
        triggeredBy: "system",
      });

      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    processed: candidates.length,
    sent,
    failed,
  });
}
