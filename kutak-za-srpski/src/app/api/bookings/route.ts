import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { writeEmailLog } from "@/lib/emailLogs";
import {
  Booking,
  BookingInput,
  BookingStatus,
  PaymentStatus,
  SchoolClass,
  Term,
} from "@/types/models";
import { sendAdminBookingNotification, sendBookingConfirmation } from "@/services/emailService";

export const runtime = "nodejs";

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function mapDoc<T extends { id: string }>(id: string, data: Omit<T, "id"> | Record<string, unknown>): T {
  return { id, ...(data as Omit<T, "id">) } as T;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Partial<BookingInput>;

    const parentName = normalizeString(body.parentName);
    const parentEmail = normalizeString(body.parentEmail).toLowerCase();
    const parentPhone = normalizeString(body.parentPhone);
    const childName = normalizeString(body.childName);
    const childAge = normalizeString(body.childAge);
    const selectedClassId = normalizeString(body.selectedClassId);
    const selectedTermId = normalizeString(body.selectedTermId);
    const message = normalizeString(body.message);
    const bookingType = body.bookingType;
    const preferredLanguage = body.preferredLanguage === "en" ? "en" : "sr";

    if (!parentName || !parentEmail || !parentPhone || !childName || !childAge || !selectedClassId || !selectedTermId) {
      return NextResponse.json({ message: "Nedostaju obavezna polja." }, { status: 400 });
    }

    if (bookingType !== "single" && bookingType !== "semester") {
      return NextResponse.json({ message: "Nevažeći tip prijave." }, { status: 400 });
    }

    const db = getAdminDb();
    const termRef = db.collection("terms").doc(selectedTermId);
    const now = new Date().toISOString();

    await db.runTransaction(async (transaction) => {
      const termSnapshot = await transaction.get(termRef);
      if (!termSnapshot.exists) {
        throw new Error("Izabrani termin ne postoji.");
      }

      const term = mapDoc<Term>(termSnapshot.id, termSnapshot.data() ?? {});
      const maxAllowed = term.capacity + (term.overbookLimit ?? 0);
      if ((term.bookedCount ?? 0) >= maxAllowed) {
        throw new Error("Izabrani termin je popunjen.");
      }

      transaction.update(termRef, { bookedCount: (term.bookedCount ?? 0) + 1 });
    });

    const bookingPayload: Omit<Booking, "id"> = {
      parentName,
      parentEmail,
      parentPhone,
      childName,
      childAge,
      selectedClassId,
      selectedTermId,
      bookingType,
      preferredLanguage,
      ...(message ? { message } : {}),
      waiverSigned: false,
      status: "pending" as BookingStatus,
      paymentStatus: "pending" as PaymentStatus,
      createdAt: now,
    };

    const bookingRef = await db.collection("bookings").add(bookingPayload);
    const bookingSnapshot = await bookingRef.get();
    const booking = mapDoc<Booking>(bookingSnapshot.id, bookingSnapshot.data() ?? bookingPayload);

    const [classesSnap, termSnap] = await Promise.all([
      db.collection("classes").doc(selectedClassId).get(),
      db.collection("terms").doc(selectedTermId).get(),
    ]);

    const selectedClass = classesSnap.exists ? mapDoc<SchoolClass>(classesSnap.id, classesSnap.data() ?? {}) : undefined;
    const selectedTerm = termSnap.exists ? mapDoc<Term>(termSnap.id, termSnap.data() ?? {}) : undefined;
    const classTermsSnap = await db.collection("terms").where("classId", "==", selectedClassId).get();
    const allTerms = classTermsSnap.docs.map((docRef) => mapDoc<Term>(docRef.id, docRef.data()));

    const confirmationResult = await sendBookingConfirmation({
      booking,
      selectedClass,
      selectedTerm,
      allTerms,
    });

    await writeEmailLog({
      type: "booking-submitted",
      bookingId: booking.id,
      parentEmail: booking.parentEmail,
      parentName: booking.parentName,
      subject: "Kutak za srpski | Hvala na prijavi",
      status: "sent",
      provider: "resend",
      providerMessageId: confirmationResult.id,
      triggeredBy: "system",
    });

    const adminEmail = process.env.EMAIL_ADMIN_TO;
    if (adminEmail) {
      try {
        const adminResult = await sendAdminBookingNotification({
          booking,
          selectedClass,
          selectedTerm,
          allTerms,
        });

        await writeEmailLog({
          type: "admin-notification",
          bookingId: booking.id,
          parentEmail: booking.parentEmail,
          parentName: booking.parentName,
          subject: "Kutak za srpski | Nova rezervacija",
          status: "sent",
          provider: "resend",
          providerMessageId: adminResult.id,
          triggeredBy: "system",
        });
      } catch (error) {
        await writeEmailLog({
          type: "admin-notification",
          bookingId: booking.id,
          parentEmail: booking.parentEmail,
          parentName: booking.parentName,
          subject: "Kutak za srpski | Nova rezervacija",
          status: "failed",
          provider: "resend",
          errorMessage: error instanceof Error ? error.message : "Admin notification failed",
          triggeredBy: "system",
        });
      }
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error("Booking submit failed", error);
    const message = error instanceof Error ? error.message : "Prijava trenutno nije uspela.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
