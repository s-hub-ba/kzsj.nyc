import { NextResponse } from "next/server";
import { getAdminStorageBucket } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

const MAX_CV_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ message: "CV fajl nije prosleđen." }, { status: 400 });
    }

    if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
      return NextResponse.json({ message: "Dozvoljeni su samo PDF, DOC i DOCX fajlovi." }, { status: 400 });
    }

    if (file.size > MAX_CV_SIZE_BYTES) {
      return NextResponse.json({ message: "CV fajl je prevelik." }, { status: 400 });
    }

    const bucket = getAdminStorageBucket();
    const safeName = sanitizeFileName(file.name || "cv");
    const storagePath = `career-cvs/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const bucketFile = bucket.file(storagePath);

    await bucketFile.save(buffer, {
      resumable: false,
      metadata: {
        contentType: file.type || "application/octet-stream",
        cacheControl: "private, max-age=0, no-cache, no-store",
      },
    });

    const [fileUrl] = await bucketFile.getSignedUrl({
      action: "read",
      expires: "03-01-2500",
    });

    return NextResponse.json({
      fileName: file.name,
      fileUrl,
      storagePath,
      contentType: file.type || "application/octet-stream",
      fileSize: file.size,
    });
  } catch (error) {
    console.error("CV upload failed", error);
    const message = error instanceof Error ? error.message : "Slanje CV fajla nije uspelo.";
    return NextResponse.json({ message }, { status: 500 });
  }
}