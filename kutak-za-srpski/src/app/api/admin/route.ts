import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { writeEmailLog } from "@/lib/emailLogs";
import {
  sendBlogNewsletter,
  sendInvoiceEmail as sendInvoiceEmailViaResend,
  sendInvoiceReminderEmail,
  sendPaymentReceivedConfirmation,
  sendTeacherAssignmentEmail,
} from "@/services/emailService";
import {
  BlogPost,
  Booking,
  BookingPlacementStatus,
  BookingStatus,
  CreateInvoiceInput,
  EmailLog,
  EmploymentType,
  Invoice,
  InvoiceStatus,
  JobApplication,
  NewsletterSubscriber,
  PaymentStatus,
  ReceivedPaymentMethod,
  SchoolClass,
  Term,
  TermCapacityPolicy,
  WorkerProfile,
} from "@/types/models";

const STATIC_ADMIN_EMAILS = [
  "ivanadurovic94@gmail.com",
  "amraisakovic.fig@gmail.com",
];

function getAdminEmailsFromEnv() {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw) return [];

  return raw
    .split(/[;,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

const ADMIN_EMAILS = new Set([
  ...STATIC_ADMIN_EMAILS,
  ...getAdminEmailsFromEnv(),
]);

type AdminAction =
  | "getDashboardData"
  | "getInvoices"
  | "getInvoiceById"
  | "generateInvoiceNumber"
  | "createInvoice"
  | "sendInvoiceEmail"
  | "sendInvoiceReminder"
  | "sendScheduledInvoiceReminders"
  | "updateInvoiceStatus"
  | "saveClass"
  | "deleteClass"
  | "saveTerm"
  | "deleteTerm"
  | "updateTermCapacityPolicy"
  | "updateBookingWorkflow"
  | "assignBookingToTerm"
  | "sendBookingToQueue"
  | "createWorkerFromApplication"
  | "saveWorkerProfile"
  | "assignWorkerToTerm"
  | "assignWorkerToClass"
  | "saveBlogPost"
  | "deleteBlogPost";

function normalizeTimestamp(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as { toDate: () => Date }).toDate === "function"
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return value;
}

function mapDoc<T extends { id: string }>(
  id: string,
  data: Omit<T, "id"> | Record<string, unknown>,
): T {
  return {
    id,
    ...(Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, normalizeTimestamp(value)]),
    ) as Omit<T, "id">),
  } as T;
}

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    throw new Error("Nedostaje admin token.");
  }

  const decoded = await getAdminAuth().verifyIdToken(token);
  const email = decoded.email?.toLowerCase();

  if (!email || !ADMIN_EMAILS.has(email)) {
    throw new Error("Nemate dozvolu za ovu admin akciju.");
  }

  return email;
}

async function getDashboardData() {
  const db = getAdminDb();
  const [bookingsSnap, classesSnap, termsSnap, subscribersSnap, jobApplicationsSnap, workersSnap, postsSnap, emailLogsSnap, invoicesSnap] = await Promise.all([
    db.collection("bookings").orderBy("createdAt", "desc").get(),
    db.collection("classes").get(),
    db.collection("terms").get(),
    db.collection("newsletterSubscribers").orderBy("createdAt", "desc").get(),
    db.collection("jobApplications").orderBy("createdAt", "desc").get(),
    db.collection("workers").orderBy("createdAt", "desc").get(),
    db.collection("blogPosts").orderBy("createdAt", "desc").get(),
    db.collection("emailLogs").orderBy("createdAt", "desc").limit(200).get(),
    db.collection("invoices").orderBy("createdAt", "desc").get(),
  ]);

  return {
    bookings: bookingsSnap.docs.map((docRef) => mapDoc<Booking>(docRef.id, docRef.data())),
    classes: classesSnap.docs.map((docRef) => mapDoc<SchoolClass>(docRef.id, docRef.data())),
    terms: termsSnap.docs.map((docRef) => mapDoc<Term>(docRef.id, docRef.data())),
    newsletterSubscribers: subscribersSnap.docs.map((docRef) =>
      mapDoc<NewsletterSubscriber>(docRef.id, docRef.data()),
    ),
    jobApplications: jobApplicationsSnap.docs.map((docRef) =>
      mapDoc<JobApplication>(docRef.id, docRef.data()),
    ),
    workers: workersSnap.docs.map((docRef) => mapDoc<WorkerProfile>(docRef.id, docRef.data())),
    posts: postsSnap.docs.map((docRef) => mapDoc<BlogPost>(docRef.id, docRef.data())),
    emailLogs: emailLogsSnap.docs.map((docRef) => mapDoc<EmailLog>(docRef.id, docRef.data())),
    invoices: invoicesSnap.docs.map((docRef) => mapDoc<Invoice>(docRef.id, docRef.data())),
  };
}

function normalizeInvoiceStatus(invoice: Invoice): Invoice {
  if (invoice.status !== "pending") {
    return invoice;
  }

  const dueDateMs = Date.parse(invoice.dueDate);
  if (Number.isNaN(dueDateMs)) {
    return invoice;
  }

  return dueDateMs < Date.now()
    ? { ...invoice, status: "overdue" }
    : invoice;
}

function safeDateFromInput(value?: string) {
  if (!value) {
    return new Date();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

async function generateInvoiceNumber(issueDateInput?: string) {
  const db = getAdminDb();
  const issueDate = safeDateFromInput(issueDateInput);
  const year = issueDate.getFullYear();
  const counterRef = db.collection("invoiceCounters").doc(String(year));

  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(counterRef);
    const lastNumber = snapshot.exists ? Number(snapshot.data()?.lastNumber ?? 0) : 0;
    const nextNumber = lastNumber + 1;
    const now = new Date();

    transaction.set(
      counterRef,
      {
        year,
        lastNumber: nextNumber,
        updatedAt: now,
        createdAt: snapshot.exists ? snapshot.data()?.createdAt ?? now : now,
      },
      { merge: true },
    );

    return `KZS-${year}-${String(nextNumber).padStart(3, "0")}`;
  });
}

async function createInvoice(payload: CreateInvoiceInput, adminEmail: string) {
  const db = getAdminDb();

  if (!payload.bookingId || !payload.amount || !payload.paymentInstructions?.trim()) {
    throw new Error("Nedostaju obavezna polja za kreiranje fakture.");
  }

  const bookingSnapshot = await db.collection("bookings").doc(payload.bookingId).get();
  if (!bookingSnapshot.exists) {
    throw new Error("Prijava nije pronadjena.");
  }

  const booking = mapDoc<Booking>(bookingSnapshot.id, bookingSnapshot.data() ?? {});
  const issueDate = new Date();
  const dueDate = new Date(issueDate.getTime());
  dueDate.setDate(dueDate.getDate() + 30);

  const invoiceNumber = await generateInvoiceNumber(issueDate.toISOString());
  const now = new Date();
  const normalizedNotes = payload.notes?.trim();
  const invoicePayload: Omit<Invoice, "id"> = {
    invoiceNumber,
    bookingId: booking.id,
    parentName: booking.parentName,
    parentEmail: booking.parentEmail,
    childName: booking.childName,
    serviceDescription: payload.serviceDescription?.trim() || booking.selectedClassId,
    amount: payload.amount,
    currency: payload.currency || "USD",
    issueDate: issueDate.toISOString(),
    dueDate: dueDate.toISOString(),
    status: "pending",
    paymentInstructions: payload.paymentInstructions.trim(),
    paymentMethod: payload.paymentMethod,
    ...(normalizedNotes ? { notes: normalizedNotes } : {}),
    bookingType: booking.bookingType,
    selectedClassId: booking.selectedClassId,
    selectedTermId: booking.selectedTermId,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    reminderEnabled: true,
    reminderIntervalDays: 7,
    reminderCount: 0,
    nextReminderAt: dueDate.toISOString(),
  };

  const createdRef = await db.collection("invoices").add(invoicePayload);
  const createdSnapshot = await createdRef.get();
  const createdInvoice = mapDoc<Invoice>(createdSnapshot.id, createdSnapshot.data() ?? invoicePayload);

  let emailQueued = false;
  let emailError: string | undefined;
  try {
    const emailResult = await sendInvoiceEmailViaResend({ invoice: createdInvoice });
    emailQueued = true;

    await writeEmailLog({
      type: "invoice-sent",
      bookingId: createdInvoice.bookingId,
      parentEmail: createdInvoice.parentEmail,
      parentName: createdInvoice.parentName,
      subject: `Kutak za srpski | Invoice ${createdInvoice.invoiceNumber}`,
      status: "sent",
      provider: "resend",
      providerMessageId: emailResult.id,
      triggeredBy: "admin",
      triggeredByEmail: adminEmail,
    });
  } catch (error) {
    emailError = error instanceof Error ? error.message : "Slanje invoice emaila nije uspelo.";

    await writeEmailLog({
      type: "invoice-sent",
      bookingId: createdInvoice.bookingId,
      parentEmail: createdInvoice.parentEmail,
      parentName: createdInvoice.parentName,
      subject: `Kutak za srpski | Invoice ${createdInvoice.invoiceNumber}`,
      status: "failed",
      provider: "resend",
      errorMessage: emailError,
      triggeredBy: "admin",
      triggeredByEmail: adminEmail,
    });
  }

  return {
    invoice: normalizeInvoiceStatus(createdInvoice),
    emailQueued,
    emailError,
  };
}

async function getInvoices() {
  const db = getAdminDb();
  const snapshot = await db.collection("invoices").orderBy("createdAt", "desc").get();
  const invoices = snapshot.docs.map((docRef) => normalizeInvoiceStatus(mapDoc<Invoice>(docRef.id, docRef.data())));
  return { invoices };
}

async function getInvoiceById(invoiceId: string) {
  const db = getAdminDb();
  const snapshot = await db.collection("invoices").doc(invoiceId).get();
  if (!snapshot.exists) {
    return { invoice: null };
  }

  return {
    invoice: normalizeInvoiceStatus(mapDoc<Invoice>(snapshot.id, snapshot.data() ?? {})),
  };
}

async function sendInvoiceEmail(invoiceId: string, adminEmail: string) {
  const db = getAdminDb();
  const snapshot = await db.collection("invoices").doc(invoiceId).get();
  if (!snapshot.exists) {
    throw new Error("Faktura nije pronadjena.");
  }

  const invoice = mapDoc<Invoice>(snapshot.id, snapshot.data() ?? {});
  const result = await sendInvoiceEmailViaResend({ invoice });

  await writeEmailLog({
    type: "invoice-sent",
    bookingId: invoice.bookingId,
    parentEmail: invoice.parentEmail,
    parentName: invoice.parentName,
    subject: `Kutak za srpski | Invoice ${invoice.invoiceNumber}`,
    status: "sent",
    provider: "resend",
    providerMessageId: result.id,
    triggeredBy: "admin",
    triggeredByEmail: adminEmail,
  });

  await db.collection("invoices").doc(invoiceId).set(
    {
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return { ok: true, id: result.id };
}

function getInvoiceDaysOverdue(invoice: Invoice) {
  const dueMs = Date.parse(invoice.dueDate);
  if (Number.isNaN(dueMs)) {
    return 0;
  }

  const diffMs = Date.now() - dueMs;
  if (diffMs <= 0) {
    return 0;
  }

  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

async function sendInvoiceReminder(invoiceId: string, adminEmail: string, automated = false) {
  const db = getAdminDb();
  const snapshot = await db.collection("invoices").doc(invoiceId).get();
  if (!snapshot.exists) {
    throw new Error("Faktura nije pronadjena.");
  }

  const invoice = mapDoc<Invoice>(snapshot.id, snapshot.data() ?? {});
  const effectiveStatus = normalizeInvoiceStatus(invoice).status;

  if (effectiveStatus === "paid" || effectiveStatus === "cancelled") {
    return { ok: true, skipped: true };
  }

  const result = await sendInvoiceReminderEmail({
    invoice,
    daysOverdue: getInvoiceDaysOverdue(invoice),
  });

  const now = new Date();
  const intervalDays = invoice.reminderIntervalDays ?? 7;
  const nextReminderAt = new Date(now.getTime());
  nextReminderAt.setDate(nextReminderAt.getDate() + intervalDays);

  await db.collection("invoices").doc(invoiceId).set(
    {
      status: effectiveStatus,
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
    triggeredBy: automated ? "system" : "admin",
    triggeredByEmail: automated ? undefined : adminEmail,
  });

  return { ok: true, id: result.id };
}

async function sendScheduledInvoiceReminders(adminEmail: string) {
  const db = getAdminDb();
  const snapshot = await db
    .collection("invoices")
    .where("reminderEnabled", "==", true)
    .where("status", "in", ["pending", "overdue"])
    .get();

  const nowMs = Date.now();
  const candidates = snapshot.docs
    .map((docRef) => mapDoc<Invoice>(docRef.id, docRef.data()))
    .filter((invoice) => {
      const nextReminderMs = Date.parse(invoice.nextReminderAt ?? invoice.dueDate);
      return !Number.isNaN(nextReminderMs) && nextReminderMs <= nowMs;
    });

  let sent = 0;
  let failed = 0;

  for (const invoice of candidates) {
    try {
      await sendInvoiceReminder(invoice.id, adminEmail, true);
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return {
    ok: true,
    processed: candidates.length,
    sent,
    failed,
  };
}

async function updateInvoiceStatus(
  invoiceId: string,
  status: InvoiceStatus,
  paymentMethod?: ReceivedPaymentMethod,
) {
  const db = getAdminDb();
  const nextStatus: InvoiceStatus = status === "overdue" ? "pending" : status;
  const updatePayload: Record<string, unknown> = {
    status: nextStatus,
    updatedAt: new Date().toISOString(),
  };

  if (paymentMethod) {
    updatePayload.paymentMethod = paymentMethod;
  }

  await db.collection("invoices").doc(invoiceId).set(
    updatePayload,
    { merge: true },
  );

  const updatedSnapshot = await db.collection("invoices").doc(invoiceId).get();
  if (!updatedSnapshot.exists) {
    throw new Error("Faktura nije pronadjena.");
  }

  return {
    invoice: normalizeInvoiceStatus(mapDoc<Invoice>(updatedSnapshot.id, updatedSnapshot.data() ?? {})),
  };
}

async function saveClass(payload: Partial<SchoolClass> & Pick<SchoolClass, "title_sr" | "title_en">) {
  const db = getAdminDb();
  const now = new Date().toISOString();

  if (payload.id) {
    const { id, ...rest } = payload;
    await db.collection("classes").doc(id).set({ ...rest, updatedAt: now }, { merge: true });
    return id;
  }

  const docRef = await db.collection("classes").add({
    ...payload,
    active: payload.active ?? true,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

async function saveTerm(payload: Partial<Term> & Pick<Term, "classId" | "title_sr" | "title_en">) {
  const db = getAdminDb();
  const now = new Date().toISOString();

  if (payload.id) {
    const { id, ...rest } = payload;
    await db.collection("terms").doc(id).set({ ...rest, updatedAt: now }, { merge: true });
    return id;
  }

  const docRef = await db.collection("terms").add({
    ...payload,
    active: payload.active ?? true,
    bookedCount: payload.bookedCount ?? 0,
    createdAt: now,
    updatedAt: now,
  });
  return docRef.id;
}

async function updateTermCapacityPolicy(termId: string, policy: TermCapacityPolicy, adminEmail: string) {
  const db = getAdminDb();
  const now = new Date().toISOString();

  if (policy === "strict-10") {
    await db.collection("terms").doc(termId).set({ capacity: 10, overbookLimit: 0, updatedBy: adminEmail, updatedAt: now }, { merge: true });
    return;
  }

  if (policy === "direct-12") {
    await db.collection("terms").doc(termId).set({ capacity: 12, overbookLimit: 0, updatedBy: adminEmail, updatedAt: now }, { merge: true });
    return;
  }

  await db.collection("terms").doc(termId).set({ capacity: 10, overbookLimit: 2, updatedBy: adminEmail, updatedAt: now }, { merge: true });
}

async function updateBookingWorkflow(
  bookingId: string,
  input: {
    waiverSigned: boolean;
    paymentStatus: PaymentStatus;
    paymentMethod?: ReceivedPaymentMethod;
    status?: BookingStatus;
  },
  adminEmail: string,
) {
  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(bookingId);
  const existingSnapshot = await bookingRef.get();
  const existingBooking = existingSnapshot.exists
    ? mapDoc<Booking>(existingSnapshot.id, existingSnapshot.data() ?? {})
    : null;

  if (!existingBooking) {
    throw new Error("Prijava nije pronadjena.");
  }

  const isValidBooking = input.waiverSigned && input.paymentStatus === "paid";
  const now = new Date().toISOString();
  const nextStatus = input.status ?? (isValidBooking ? "confirmed" : "pending");

  await bookingRef.set(
    {
      waiverSigned: input.waiverSigned,
      waiverSignedAt: input.waiverSigned ? now : null,
      paymentStatus: input.paymentStatus,
      paymentMethod: input.paymentMethod ?? null,
      status: nextStatus,
      updatedBy: adminEmail,
      updatedAt: now,
    },
    { merge: true },
  );

  const transitionedToPaid = existingBooking.paymentStatus !== "paid" && input.paymentStatus === "paid";
  if (!transitionedToPaid) {
    return;
  }

  const [classesSnap, termsSnap] = await Promise.all([
    db.collection("classes").doc(existingBooking.selectedClassId).get(),
    db.collection("terms").doc(existingBooking.selectedTermId).get(),
  ]);

  const selectedClass = classesSnap.exists
    ? mapDoc<SchoolClass>(classesSnap.id, classesSnap.data() ?? {})
    : undefined;
  const selectedTerm = termsSnap.exists
    ? mapDoc<Term>(termsSnap.id, termsSnap.data() ?? {})
    : undefined;
  const allTerms = selectedClass
    ? (
        await db
          .collection("terms")
          .where("classId", "==", selectedClass.id)
          .where("active", "==", true)
          .get()
      ).docs.map((docRef) => mapDoc<Term>(docRef.id, docRef.data()))
    : [];

  const updatedBooking: Booking = {
    ...existingBooking,
    waiverSigned: input.waiverSigned,
    paymentStatus: input.paymentStatus,
    paymentMethod: input.paymentMethod,
    status: nextStatus,
    updatedAt: now,
    updatedBy: adminEmail,
  };

  try {
    const result = await sendPaymentReceivedConfirmation({
      booking: updatedBooking,
      selectedClass,
      selectedTerm,
      allTerms,
    });

    await writeEmailLog({
      type: "payment-confirmed",
      bookingId,
      parentEmail: updatedBooking.parentEmail,
      parentName: updatedBooking.parentName,
      subject: "Kutak za srpski | Uplata je evidentirana",
      status: "sent",
      provider: "resend",
      providerMessageId: result.id,
      triggeredBy: "admin",
      triggeredByEmail: adminEmail,
    });
  } catch (error) {
    await writeEmailLog({
      type: "payment-confirmed",
      bookingId,
      parentEmail: updatedBooking.parentEmail,
      parentName: updatedBooking.parentName,
      subject: "Kutak za srpski | Uplata je evidentirana",
      status: "failed",
      provider: "resend",
      errorMessage: error instanceof Error ? error.message : "Payment confirmation email failed",
      triggeredBy: "admin",
      triggeredByEmail: adminEmail,
    });
  }
}

function isBookingAssigned(booking: Booking) {
  if (booking.placementStatus) {
    return booking.placementStatus === "assigned";
  }

  return booking.status === "confirmed";
}

function toMinutes(timeValue: string) {
  const match = timeValue.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  return hh * 60 + mm;
}

function getWeekday(dateValue: string) {
  const [yearStr, monthStr, dayStr] = dateValue.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);

  if (!year || !month || !day) {
    return null;
  }

  const weekdayIndex = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  return weekdays[weekdayIndex] ?? null;
}

function isWorkerCompatibleWithTerm(worker: WorkerProfile, term: Term) {
  if (!worker.active) {
    return false;
  }

  const weekday = getWeekday(term.date);
  const termStart = toMinutes(term.startTime);
  const termEnd = toMinutes(term.endTime);
  const slots = worker.weeklyAvailability ?? [];

  if (!weekday || termStart === null || termEnd === null || slots.length === 0) {
    return false;
  }

  return slots.some((slot) => {
    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);
    if (slot.day !== weekday || slotStart === null || slotEnd === null) {
      return false;
    }

    return slotStart <= termStart && slotEnd >= termEnd;
  });
}

async function assignBookingToTerm(bookingId: string, targetTermId: string, adminEmail: string) {
  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(bookingId);
  const targetTermRef = db.collection("terms").doc(targetTermId);
  const now = new Date().toISOString();

  await db.runTransaction(async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);
    if (!bookingSnapshot.exists) {
      throw new Error("Prijava nije pronadjena.");
    }

    const booking = mapDoc<Booking>(bookingSnapshot.id, bookingSnapshot.data() ?? {});
    const targetTermSnapshot = await transaction.get(targetTermRef);
    if (!targetTermSnapshot.exists) {
      throw new Error("Ciljni termin nije pronadjen.");
    }

    const targetTerm = mapDoc<Term>(targetTermSnapshot.id, targetTermSnapshot.data() ?? {});
    const wasAssigned = isBookingAssigned(booking);
    const sourceTermId = booking.selectedTermId;

    if (sourceTermId !== targetTermId) {
      const maxAllowed = targetTerm.capacity + (targetTerm.overbookLimit ?? 0);
      const currentCount = targetTerm.bookedCount ?? 0;
      if (currentCount >= maxAllowed) {
        throw new Error("Ciljni termin je popunjen.");
      }
    }

    if (wasAssigned && sourceTermId && sourceTermId !== targetTermId) {
      const sourceTermRef = db.collection("terms").doc(sourceTermId);
      const sourceTermSnapshot = await transaction.get(sourceTermRef);

      if (sourceTermSnapshot.exists) {
        const sourceTerm = mapDoc<Term>(sourceTermSnapshot.id, sourceTermSnapshot.data() ?? {});
        const nextCount = Math.max((sourceTerm.bookedCount ?? 0) - 1, 0);
        transaction.update(sourceTermRef, {
          bookedCount: nextCount,
          updatedBy: adminEmail,
          updatedAt: now,
        });
      }
    }

    if (!wasAssigned || sourceTermId !== targetTermId) {
      transaction.update(targetTermRef, {
        bookedCount: (targetTerm.bookedCount ?? 0) + 1,
        updatedBy: adminEmail,
        updatedAt: now,
      });
    }

    transaction.set(
      bookingRef,
      {
        selectedClassId: targetTerm.classId,
        selectedTermId: targetTermId,
        placementStatus: "assigned" as BookingPlacementStatus,
        status: booking.status === "cancelled" ? "pending" : "confirmed",
        updatedBy: adminEmail,
        updatedAt: now,
      },
      { merge: true },
    );
  });

  return { ok: true };
}

async function sendBookingToQueue(bookingId: string, adminEmail: string) {
  const db = getAdminDb();
  const bookingRef = db.collection("bookings").doc(bookingId);
  const now = new Date().toISOString();

  await db.runTransaction(async (transaction) => {
    const bookingSnapshot = await transaction.get(bookingRef);
    if (!bookingSnapshot.exists) {
      throw new Error("Prijava nije pronadjena.");
    }

    const booking = mapDoc<Booking>(bookingSnapshot.id, bookingSnapshot.data() ?? {});
    const wasAssigned = isBookingAssigned(booking);

    if (wasAssigned && booking.selectedTermId) {
      const termRef = db.collection("terms").doc(booking.selectedTermId);
      const termSnapshot = await transaction.get(termRef);

      if (termSnapshot.exists) {
        const term = mapDoc<Term>(termSnapshot.id, termSnapshot.data() ?? {});
        const nextCount = Math.max((term.bookedCount ?? 0) - 1, 0);
        transaction.update(termRef, {
          bookedCount: nextCount,
          updatedBy: adminEmail,
          updatedAt: now,
        });
      }
    }

    transaction.set(
      bookingRef,
      {
        placementStatus: "queue" as BookingPlacementStatus,
        status: booking.status === "cancelled" ? "cancelled" : "pending",
        updatedBy: adminEmail,
        updatedAt: now,
      },
      { merge: true },
    );
  });

  return { ok: true };
}

async function createWorkerFromApplication(applicationId: string) {
  const db = getAdminDb();
  const applicationSnapshot = await db.collection("jobApplications").doc(applicationId).get();

  if (!applicationSnapshot.exists) {
    throw new Error("Prijava za posao nije pronadjena.");
  }

  const application = mapDoc<JobApplication>(applicationSnapshot.id, applicationSnapshot.data() ?? {});
  const existingSnapshot = await db
    .collection("workers")
    .where("sourceApplicationId", "==", applicationId)
    .limit(1)
    .get();

  const now = new Date().toISOString();

  if (!existingSnapshot.empty) {
    const existing = existingSnapshot.docs[0];
    return { worker: mapDoc<WorkerProfile>(existing.id, existing.data()) };
  }

  const rawPayload = {
    fullName: application.fullName,
    email: application.email,
    phone: application.phone,
    employmentType: application.employmentType,
    experienceSummary: application.experienceSummary,
    message: application.message,
    preferredLanguage: application.preferredLanguage,
    sourceApplicationId: application.id,
    active: true,
    notes: "",
    weeklyAvailability: [],
    availabilitySource: "other" as const,
    createdAt: now,
    updatedAt: now,
  };

  // Firestore rejects `undefined` values — strip them before write
  const payload = Object.fromEntries(
    Object.entries(rawPayload).filter(([, v]) => v !== undefined),
  ) as unknown as Omit<WorkerProfile, "id">;

  const workerRef = await db.collection("workers").add(payload);
  return { worker: { id: workerRef.id, ...payload } };
}

async function saveWorkerProfile(
  workerId: string,
  input: {
    fullName?: string;
    email?: string;
    phone?: string;
    employmentType?: EmploymentType;
    experienceSummary?: string;
    active?: boolean;
    notes?: string;
    weeklyAvailability?: WorkerProfile["weeklyAvailability"];
    availabilitySource?: WorkerProfile["availabilitySource"];
    availabilityConfirmedAt?: string;
  },
) {
  const db = getAdminDb();
  const now = new Date().toISOString();

  const normalizedInput = Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined),
  );

  await db.collection("workers").doc(workerId).set(
    {
      ...normalizedInput,
      ...(input.email ? { email: input.email.toLowerCase().trim() } : {}),
      updatedAt: now,
    },
    { merge: true },
  );

  const snapshot = await db.collection("workers").doc(workerId).get();
  if (!snapshot.exists) {
    throw new Error("Predavac nije pronadjen.");
  }

  return { worker: mapDoc<WorkerProfile>(snapshot.id, snapshot.data() ?? {}) };
}

async function assignWorkerToTerm(workerId: string, termId: string, adminEmail: string) {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const [workerSnapshot, termSnapshot] = await Promise.all([
    db.collection("workers").doc(workerId).get(),
    db.collection("terms").doc(termId).get(),
  ]);

  if (!workerSnapshot.exists) {
    throw new Error("Predavac nije pronadjen.");
  }

  if (!termSnapshot.exists) {
    throw new Error("Termin nije pronadjen.");
  }

  const worker = mapDoc<WorkerProfile>(workerSnapshot.id, workerSnapshot.data() ?? {});
  if (!worker.active) {
    throw new Error("Predavac nije aktivan.");
  }

  const term = mapDoc<Term>(termSnapshot.id, termSnapshot.data() ?? {});
  if (!isWorkerCompatibleWithTerm(worker, term)) {
    throw new Error("Predavac nije dostupan u terminu koji pokusavate da dodelite.");
  }

  const classSnapshot = await db.collection("classes").doc(term.classId).get();
  if (!classSnapshot.exists) {
    throw new Error("Grupa za ovaj termin nije pronadjena.");
  }

  const schoolClass = mapDoc<SchoolClass>(classSnapshot.id, classSnapshot.data() ?? {});

  await db.collection("terms").doc(term.id).set(
    {
      assignedWorkerId: worker.id,
      assignedWorkerName: worker.fullName,
      assignedWorkerEmail: worker.email,
      assignedWorkerEmploymentType: worker.employmentType,
      updatedBy: adminEmail,
      updatedAt: now,
    },
    { merge: true },
  );

  let emailQueued = false;
  let emailError: string | undefined;

  try {
    const result = await sendTeacherAssignmentEmail({
      worker,
      schoolClass,
      term,
    });

    emailQueued = true;

    await writeEmailLog({
      type: "teacher-assignment",
      parentEmail: worker.email,
      parentName: worker.fullName,
      subject: `Kutak za srpski | Dodeljen termin ${term.title_sr}`,
      status: "sent",
      provider: "resend",
      providerMessageId: result.id,
      triggeredBy: "admin",
      triggeredByEmail: adminEmail,
    });
  } catch (error) {
    emailError = error instanceof Error ? error.message : "Slanje emaila predavacu nije uspelo.";

    await writeEmailLog({
      type: "teacher-assignment",
      parentEmail: worker.email,
      parentName: worker.fullName,
      subject: `Kutak za srpski | Dodeljen termin ${term.title_sr}`,
      status: "failed",
      provider: "resend",
      errorMessage: emailError,
      triggeredBy: "admin",
      triggeredByEmail: adminEmail,
    });
  }

  return {
    ok: true,
    emailQueued,
    emailError,
  };
}

async function assignWorkerToClass(workerId: string, classId: string, adminEmail: string) {
  const db = getAdminDb();
  const [workerSnapshot, classSnapshot, termsSnapshot] = await Promise.all([
    db.collection("workers").doc(workerId).get(),
    db.collection("classes").doc(classId).get(),
    db.collection("terms").where("classId", "==", classId).where("active", "==", true).get(),
  ]);

  if (!workerSnapshot.exists) {
    throw new Error("Predavac nije pronadjen.");
  }

  if (!classSnapshot.exists) {
    throw new Error("Grupa nije pronadjena.");
  }

  const worker = mapDoc<WorkerProfile>(workerSnapshot.id, workerSnapshot.data() ?? {});
  const terms = termsSnapshot.docs.map((docRef) => mapDoc<Term>(docRef.id, docRef.data()));

  const compatibleTerms = terms.filter((term) => isWorkerCompatibleWithTerm(worker, term));
  const skippedTerms = terms.filter((term) => !isWorkerCompatibleWithTerm(worker, term));

  let assigned = 0;
  let emailFailed = 0;

  for (const term of compatibleTerms) {
    const result = await assignWorkerToTerm(worker.id, term.id, adminEmail);
    assigned += 1;
    if (!result.emailQueued) {
      emailFailed += 1;
    }
  }

  return {
    ok: true,
    assigned,
    skipped: skippedTerms.length,
    emailFailed,
    assignedTermIds: compatibleTerms.map((term) => term.id),
    skippedTermIds: skippedTerms.map((term) => term.id),
  };
}

async function saveBlogPost(payload: Partial<BlogPost> & Pick<BlogPost, "slug" | "title_sr" | "title_en">) {
  const db = getAdminDb();
  const now = new Date().toISOString();
  let shouldSendNewsletter = false;
  let postId = payload.id;

  if (payload.id) {
    const { id, ...rest } = payload;
    const existingSnapshot = await db.collection("blogPosts").doc(id).get();
    const existing = existingSnapshot.exists ? (existingSnapshot.data() as Partial<BlogPost>) : null;
    const becomesPublished = Boolean(rest.published) && !Boolean(existing?.published);

    await db.collection("blogPosts").doc(id).set({ ...rest, updatedAt: now }, { merge: true });
    shouldSendNewsletter = becomesPublished;
    postId = id;
  } else {
    const docRef = await db.collection("blogPosts").add({
      ...payload,
      published: payload.published ?? false,
      createdAt: now,
      updatedAt: now,
    });
    postId = docRef.id;
    shouldSendNewsletter = Boolean(payload.published);
  }

  if (shouldSendNewsletter && postId) {
    const publishedSnapshot = await db.collection("blogPosts").doc(postId).get();
    const subscribersSnapshot = await db.collection("newsletterSubscribers").orderBy("createdAt", "desc").get();
    const publishedPost = publishedSnapshot.exists
      ? mapDoc<BlogPost>(publishedSnapshot.id, publishedSnapshot.data() ?? {})
      : null;
    const subscribers = subscribersSnapshot.docs.map((docRef) =>
      mapDoc<NewsletterSubscriber>(docRef.id, docRef.data()),
    );

    if (publishedPost && subscribers.length) {
      await sendBlogNewsletter({ post: publishedPost, subscribers });
    }
  }

  return postId;
}

export async function POST(request: NextRequest) {
  try {
    const adminEmail = await verifyAdmin(request);
    const { action, payload } = (await request.json()) as {
      action: AdminAction;
      payload?: Record<string, unknown>;
    };

    switch (action) {
      case "getDashboardData":
        return NextResponse.json(await getDashboardData());
      case "getInvoices":
        return NextResponse.json(await getInvoices());
      case "getInvoiceById":
        return NextResponse.json(await getInvoiceById(String(payload?.invoiceId ?? "")));
      case "generateInvoiceNumber":
        return NextResponse.json({ invoiceNumber: await generateInvoiceNumber(String(payload?.issueDate ?? "")) });
      case "createInvoice":
        return NextResponse.json(await createInvoice(payload as unknown as CreateInvoiceInput, adminEmail));
      case "sendInvoiceEmail":
        return NextResponse.json(await sendInvoiceEmail(String(payload?.invoiceId ?? ""), adminEmail));
      case "sendInvoiceReminder":
        return NextResponse.json(await sendInvoiceReminder(String(payload?.invoiceId ?? ""), adminEmail));
      case "sendScheduledInvoiceReminders":
        return NextResponse.json(await sendScheduledInvoiceReminders(adminEmail));
      case "updateInvoiceStatus":
        return NextResponse.json(
          await updateInvoiceStatus(
            String(payload?.invoiceId ?? ""),
            payload?.status as InvoiceStatus,
            payload?.paymentMethod as ReceivedPaymentMethod | undefined,
          ),
        );
      case "saveClass":
        return NextResponse.json({ id: await saveClass(payload as Partial<SchoolClass> & Pick<SchoolClass, "title_sr" | "title_en">) });
      case "deleteClass":
        await getAdminDb().collection("classes").doc(String(payload?.id ?? "")).delete();
        return NextResponse.json({ ok: true });
      case "saveTerm":
        return NextResponse.json({ id: await saveTerm(payload as Partial<Term> & Pick<Term, "classId" | "title_sr" | "title_en">) });
      case "deleteTerm":
        await getAdminDb().collection("terms").doc(String(payload?.id ?? "")).delete();
        return NextResponse.json({ ok: true });
      case "updateTermCapacityPolicy":
        await updateTermCapacityPolicy(String(payload?.termId ?? ""), payload?.policy as TermCapacityPolicy, adminEmail);
        return NextResponse.json({ ok: true });
      case "updateBookingWorkflow":
        await updateBookingWorkflow(
          String(payload?.bookingId ?? ""),
          payload?.input as {
            waiverSigned: boolean;
            paymentStatus: PaymentStatus;
            paymentMethod?: ReceivedPaymentMethod;
            status?: BookingStatus;
          },
          adminEmail,
        );
        return NextResponse.json({ ok: true });
      case "assignBookingToTerm":
        return NextResponse.json(
          await assignBookingToTerm(
            String(payload?.bookingId ?? ""),
            String(payload?.targetTermId ?? ""),
            adminEmail,
          ),
        );
      case "sendBookingToQueue":
        return NextResponse.json(await sendBookingToQueue(String(payload?.bookingId ?? ""), adminEmail));
      case "createWorkerFromApplication":
        return NextResponse.json(await createWorkerFromApplication(String(payload?.applicationId ?? "")));
      case "saveWorkerProfile":
        return NextResponse.json(
          await saveWorkerProfile(String(payload?.workerId ?? ""), {
            fullName: payload?.fullName as string | undefined,
            email: payload?.email as string | undefined,
            phone: payload?.phone as string | undefined,
            employmentType: payload?.employmentType as EmploymentType | undefined,
            experienceSummary: payload?.experienceSummary as string | undefined,
            active: payload?.active as boolean | undefined,
            notes: payload?.notes as string | undefined,
            weeklyAvailability: payload?.weeklyAvailability as WorkerProfile["weeklyAvailability"],
            availabilitySource: payload?.availabilitySource as WorkerProfile["availabilitySource"],
            availabilityConfirmedAt: payload?.availabilityConfirmedAt as string | undefined,
          }),
        );
      case "assignWorkerToTerm":
        return NextResponse.json(
          await assignWorkerToTerm(
            String(payload?.workerId ?? ""),
            String(payload?.termId ?? ""),
            adminEmail,
          ),
        );
      case "assignWorkerToClass":
        return NextResponse.json(
          await assignWorkerToClass(
            String(payload?.workerId ?? ""),
            String(payload?.classId ?? ""),
            adminEmail,
          ),
        );
      case "saveBlogPost":
        return NextResponse.json({ id: await saveBlogPost(payload as Partial<BlogPost> & Pick<BlogPost, "slug" | "title_sr" | "title_en">) });
      case "deleteBlogPost":
        await getAdminDb().collection("blogPosts").doc(String(payload?.id ?? "")).delete();
        return NextResponse.json({ ok: true });
      default:
        return NextResponse.json({ message: "Nepoznata admin akcija." }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Admin akcija nije uspela.";
    const isAuthError =
      /nedostaje admin token|nemate dozvolu|auth|permission|unauthorized|forbidden|id token/i.test(
        message.toLowerCase(),
      );

    return NextResponse.json({ message }, { status: isAuthError ? 403 : 500 });
  }
}
