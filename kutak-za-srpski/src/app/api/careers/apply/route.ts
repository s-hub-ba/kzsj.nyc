import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { EmploymentType, Locale } from "@/types/models";

export const runtime = "nodejs";

type ApplyPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  employmentType?: EmploymentType;
  experienceSummary?: string;
  message?: string;
  preferredLanguage?: Locale;
};

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as ApplyPayload;

    const fullName = normalizeString(body.fullName);
    const email = normalizeString(body.email).toLowerCase();
    const phone = normalizeString(body.phone);
    const experienceSummary = normalizeString(body.experienceSummary);
    const message = normalizeString(body.message);
    const employmentType = body.employmentType;
    const preferredLanguage = body.preferredLanguage === "en" ? "en" : "sr";

    if (!fullName || !email || !phone || !experienceSummary) {
      return NextResponse.json({ message: "Nedostaju obavezna polja." }, { status: 400 });
    }

    if (!["full-time", "part-time", "both"].includes(employmentType ?? "")) {
      return NextResponse.json({ message: "Nevažeći tip angažmana." }, { status: 400 });
    }

    const db = getAdminDb();
    const payload = {
      fullName,
      email,
      phone,
      employmentType,
      experienceSummary,
      ...(message ? { message } : {}),
      preferredLanguage,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("jobApplications").add(payload);

    return NextResponse.json({ id: docRef.id }, { status: 201 });
  } catch (error) {
    console.error("Career application submit failed", error);
    const message = error instanceof Error ? error.message : "Prijava trenutno nije uspela.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
