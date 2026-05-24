import { NextResponse } from "next/server";
import { writeEmailLog } from "@/lib/emailLogs";
import {
  BookingEmailPayload,
  sendAdminBookingNotification,
  sendBookingConfirmation,
} from "@/services/emailService";

interface EmailRequestBody {
  type: "confirmation" | "admin-notification";
  payload: BookingEmailPayload;
}

export async function POST(request: Request) {
  let body: EmailRequestBody | null = null;
  try {
    body = (await request.json()) as EmailRequestBody;

    if (!body?.payload || !body?.type) {
      return NextResponse.json(
        {
          message: "Neispravan email zahtev.",
        },
        { status: 400 },
      );
    }

    const result =
      body.type === "confirmation"
        ? await sendBookingConfirmation(body.payload)
        : await sendAdminBookingNotification(body.payload);

    const subject =
      body.type === "confirmation"
        ? "Kutak za srpski | Hvala na prijavi"
        : "Kutak za srpski | Nova rezervacija";

    await writeEmailLog({
      type: body.type === "confirmation" ? "booking-submitted" : "admin-notification",
      bookingId: body.payload.booking.id,
      parentEmail: body.payload.booking.parentEmail,
      parentName: body.payload.booking.parentName,
      subject,
      status: "sent",
      provider: "resend",
      providerMessageId: result.id,
      triggeredBy: "system",
    });

    return NextResponse.json(result);
  } catch (error) {
    if (body?.payload?.booking?.id) {
      const subject =
        body.type === "confirmation"
          ? "Kutak za srpski | Hvala na prijavi"
          : "Kutak za srpski | Nova rezervacija";

      await writeEmailLog({
        type: body.type === "confirmation" ? "booking-submitted" : "admin-notification",
        bookingId: body.payload.booking.id,
        parentEmail: body.payload.booking.parentEmail,
        parentName: body.payload.booking.parentName,
        subject,
        status: "failed",
        provider: "resend",
        errorMessage: error instanceof Error ? error.message : "Email send failed",
        triggeredBy: "system",
      });
    }

    const message = error instanceof Error ? error.message : "Slanje emaila nije uspelo.";
    return NextResponse.json(
      {
        message,
      },
      { status: 500 },
    );
  }
}
