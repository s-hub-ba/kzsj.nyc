import { NextResponse } from "next/server";
import { BlogNewsletterPayload, sendBlogNewsletter } from "@/services/emailService";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BlogNewsletterPayload;

    if (!body?.post || !body?.subscribers) {
      return NextResponse.json(
        {
          message: "Neispravan newsletter zahtev.",
        },
        { status: 400 },
      );
    }

    const result = await sendBlogNewsletter(body);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Slanje newslettera nije uspelo.";
    return NextResponse.json(
      {
        message,
      },
      { status: 500 },
    );
  }
}
