import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

function htmlResponse(title: string, message: string) {
  return new NextResponse(
    `<!doctype html>
<html lang="sr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="font-family: Arial, sans-serif; background: #f5f5f5; color: #1f2937; margin: 0;">
    <main style="max-width: 560px; margin: 40px auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
      <h1 style="font-size: 24px; margin: 0 0 12px;">${title}</h1>
      <p style="margin: 0; line-height: 1.6;">${message}</p>
    </main>
  </body>
</html>`,
    {
      headers: {
        "content-type": "text/html; charset=utf-8",
      },
    },
  );
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const rawEmail = (url.searchParams.get("email") ?? "").trim().toLowerCase();

    if (!rawEmail) {
      return htmlResponse("Odjava nije uspela", "Email adresa nedostaje u linku za odjavu.");
    }

    const db = getAdminDb();
    const subscribersRef = db.collection("newsletterSubscribers");
    const snapshot = await subscribersRef.where("email", "==", rawEmail).get();

    if (snapshot.empty) {
      return htmlResponse("Već ste odjavljeni", "Ova email adresa nije pronađena na newsletter listi.");
    }

    const batch = db.batch();
    snapshot.docs.forEach((docRef) => batch.delete(docRef.ref));
    await batch.commit();

    return htmlResponse("Uspešno odjavljeno", "Vaša email adresa je uklonjena sa newsletter liste.");
  } catch {
    return htmlResponse("Greška", "Trenutno nismo mogli da obradimo odjavu. Pokušajte ponovo kasnije.");
  }
}
