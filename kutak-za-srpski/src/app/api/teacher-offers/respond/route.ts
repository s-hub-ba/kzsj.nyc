import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { writeEmailLog } from "@/lib/emailLogs";
import { Term, WorkerShiftOffer } from "@/types/models";

export const runtime = "nodejs";

function renderHtml(title: string, message: string) {
  return `<!doctype html>
<html lang="sr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; background: #f4f7fb; margin: 0; padding: 20px; color: #1f2a37; }
      .card { max-width: 640px; margin: 40px auto; background: #fff; border: 1px solid #e7ecf4; border-radius: 16px; padding: 24px; box-shadow: 0 10px 26px rgba(31,42,55,0.08); }
      h1 { margin: 0 0 12px; font-size: 24px; }
      p { margin: 0; line-height: 1.6; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>${title}</h1>
      <p>${message}</p>
    </div>
  </body>
</html>`;
}

function mapDoc<T extends { id: string }>(id: string, data: Omit<T, "id"> | Record<string, unknown>) {
  return { id, ...(data as Omit<T, "id">) } as T;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")?.trim();
    const decision = request.nextUrl.searchParams.get("decision");

    if (!token || (decision !== "accept" && decision !== "decline")) {
      return new NextResponse(renderHtml("Neispravan link", "Link nije validan."), {
        status: 400,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const db = getAdminDb();
    const offerSnap = await db
      .collection("workerOffers")
      .where("responseToken", "==", token)
      .limit(1)
      .get();

    if (offerSnap.empty) {
      return new NextResponse(renderHtml("Ponuda nije pronadjena", "Ovaj link vise nije aktivan."), {
        status: 404,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const offerDoc = offerSnap.docs[0];
    const offer = mapDoc<WorkerShiftOffer>(offerDoc.id, offerDoc.data());
    if (offer.status !== "pending") {
      return new NextResponse(
        renderHtml("Odgovor je vec evidentiran", `Status ove ponude je: ${offer.status}.`),
        { headers: { "Content-Type": "text/html; charset=utf-8" } },
      );
    }

    const now = new Date().toISOString();

    if (decision === "decline") {
      await offerDoc.ref.set(
        {
          status: "declined",
          respondedAt: now,
          responseMessage: "Teacher declined offer.",
        },
        { merge: true },
      );

      await writeEmailLog({
        type: "teacher-offer-response",
        parentEmail: offer.workerEmail,
        parentName: offer.workerName,
        subject: "Kutak za srpski | Ponuda odbijena",
        status: "sent",
        provider: "resend",
        triggeredBy: "system",
      });

      return new NextResponse(renderHtml("Ponuda odbijena", "Hvala. Odbijanje je uspesno evidentirano."), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    if (offer.scope === "term") {
      if (!offer.termId) {
        await offerDoc.ref.set(
          {
            status: "expired",
            respondedAt: now,
            responseMessage: "Term missing on offer.",
          },
          { merge: true },
        );

        return new NextResponse(renderHtml("Ponuda je istekla", "Termin vise nije dostupan."), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      const termId = offer.termId;

      await db.runTransaction(async (transaction) => {
        const termRef = db.collection("terms").doc(termId);
        const termSnapshot = await transaction.get(termRef);

        if (!termSnapshot.exists) {
          transaction.set(
            offerDoc.ref,
            {
              status: "expired",
              respondedAt: now,
              responseMessage: "Term no longer exists.",
            },
            { merge: true },
          );
          return;
        }

        const term = mapDoc<Term>(termSnapshot.id, termSnapshot.data() ?? {});
        const isTakenByAnother = Boolean(term.assignedWorkerId && term.assignedWorkerId !== offer.workerId);

        if (isTakenByAnother) {
          transaction.set(
            offerDoc.ref,
            {
              status: "expired",
              respondedAt: now,
              responseMessage: "Term already covered by another teacher.",
            },
            { merge: true },
          );
          return;
        }

        transaction.set(
          termRef,
          {
            assignedWorkerId: offer.workerId,
            assignedWorkerName: offer.workerName,
            assignedWorkerEmail: offer.workerEmail,
            assignedWorkerEmploymentType: offer.workerEmploymentType,
            updatedBy: offer.workerEmail,
            updatedAt: now,
          },
          { merge: true },
        );

        transaction.set(
          offerDoc.ref,
          {
            status: "accepted",
            respondedAt: now,
              acceptedTermIds: [termId],
            declinedTermIds: [],
            responseMessage: "Teacher accepted term offer.",
          },
          { merge: true },
        );
      });
    } else {
      const termsSnapshot = await db
        .collection("terms")
        .where("classId", "==", offer.classId)
        .where("active", "==", true)
        .get();

      const acceptedTermIds: string[] = [];
      const declinedTermIds: string[] = [];
      const batch = db.batch();

      for (const termDoc of termsSnapshot.docs) {
        const term = mapDoc<Term>(termDoc.id, termDoc.data());
        const isTakenByAnother = Boolean(term.assignedWorkerId && term.assignedWorkerId !== offer.workerId);

        if (isTakenByAnother) {
          declinedTermIds.push(term.id);
          continue;
        }

        acceptedTermIds.push(term.id);
        batch.set(
          termDoc.ref,
          {
            assignedWorkerId: offer.workerId,
            assignedWorkerName: offer.workerName,
            assignedWorkerEmail: offer.workerEmail,
            assignedWorkerEmploymentType: offer.workerEmploymentType,
            updatedBy: offer.workerEmail,
            updatedAt: now,
          },
          { merge: true },
        );
      }

      batch.set(
        offerDoc.ref,
        {
          status: acceptedTermIds.length ? "accepted" : "expired",
          respondedAt: now,
          acceptedTermIds,
          declinedTermIds,
          responseMessage: acceptedTermIds.length
            ? "Teacher accepted class offer."
            : "No available terms left to assign.",
        },
        { merge: true },
      );

      await batch.commit();
    }

    await writeEmailLog({
      type: "teacher-offer-response",
      parentEmail: offer.workerEmail,
      parentName: offer.workerName,
      subject: "Kutak za srpski | Ponuda prihvacena",
      status: "sent",
      provider: "resend",
      triggeredBy: "system",
    });

    return new NextResponse(renderHtml("Ponuda prihvacena", "Hvala. Dodela je uspesno evidentirana."), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Obrada odgovora nije uspela.";
    return new NextResponse(renderHtml("Greska", message), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}
