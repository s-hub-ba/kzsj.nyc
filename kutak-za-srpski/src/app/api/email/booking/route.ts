import { NextResponse } from "next/server";
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
  try {
    const body = (await request.json()) as EmailRequestBody;

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

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Slanje emaila nije uspelo.";
    return NextResponse.json(
      {
        message,
      },
      { status: 500 },
    );
  }
}
