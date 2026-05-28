import "server-only";

import { getAdminDb } from "@/lib/firebaseAdmin";
import { EmailLog, EmailLogType } from "@/types/models";

interface WriteEmailLogInput {
  type: EmailLogType;
  bookingId?: string;
  parentEmail?: string;
  parentName?: string;
  subject: string;
  status: "sent" | "failed";
  provider: "resend";
  providerMessageId?: string;
  errorMessage?: string;
  triggeredBy: "system" | "admin";
  triggeredByEmail?: string;
}

export async function writeEmailLog(input: WriteEmailLogInput): Promise<string> {
  const db = getAdminDb();
  const payload: Omit<EmailLog, "id"> = {
    type: input.type,
    subject: input.subject,
    status: input.status,
    provider: input.provider,
    triggeredBy: input.triggeredBy,
    ...(input.bookingId !== undefined ? { bookingId: input.bookingId } : {}),
    ...(input.parentEmail !== undefined ? { parentEmail: input.parentEmail } : {}),
    ...(input.parentName !== undefined ? { parentName: input.parentName } : {}),
    ...(input.providerMessageId !== undefined ? { providerMessageId: input.providerMessageId } : {}),
    ...(input.errorMessage !== undefined ? { errorMessage: input.errorMessage } : {}),
    ...(input.triggeredByEmail !== undefined ? { triggeredByEmail: input.triggeredByEmail } : {}),
    createdAt: new Date().toISOString(),
  };

  const ref = await db.collection("emailLogs").add(payload);
  return ref.id;
}
