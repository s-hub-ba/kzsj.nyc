import { BlogPost, Booking, Invoice, NewsletterSubscriber, SchoolClass, Term, WorkerProfile } from "@/types/models";
import { getGoogleCalendarUrl, getTeacherGoogleCalendarUrl } from "@/services/calendarService";

export interface BookingEmailPayload {
  booking: Booking;
  selectedClass?: SchoolClass;
  selectedTerm?: Term;
  isFirstBooking?: boolean;
  allTerms?: Term[]; // for semester schedule
}

type EmailResult = {
  queued: boolean;
  provider: "resend";
  id?: string;
};

function parseEmailAddress(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/<([^>]+)>/);
  return (match?.[1] ?? trimmed).trim().toLowerCase();
}

async function getResendRuntime() {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const emailFrom = process.env.EMAIL_FROM?.trim();
  const replyTo = process.env.EMAIL_REPLY_TO?.trim();

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY nije konfigurisan.");
  }

  if (!emailFrom) {
    throw new Error("EMAIL_FROM nije konfigurisan.");
  }

  const fromAddress = parseEmailAddress(emailFrom);
  const allowResendDevFrom = process.env.ALLOW_RESEND_DEV_FROM === "true";

  if (process.env.NODE_ENV === "production" && fromAddress.endsWith("@resend.dev") && !allowResendDevFrom) {
    throw new Error(
      "EMAIL_FROM koristi resend.dev adresu u produkciji. Verifikuj svoj domen na Resend-u i postavi EMAIL_FROM na adresu sa sopstvenim domenom.",
    );
  }

  const { Resend } = await import("resend");
  const resend = new Resend(resendApiKey);

  return {
    resend,
    from: emailFrom,
    replyTo,
  };
}

function formatBookingSummary(payload: BookingEmailPayload) {
  const { booking, selectedClass, selectedTerm } = payload;

  const className =
    booking.preferredLanguage === "sr"
      ? selectedClass?.title_sr ?? booking.selectedClassId
      : selectedClass?.title_en ?? booking.selectedClassId;

  const termName =
    booking.preferredLanguage === "sr"
      ? selectedTerm?.title_sr ?? booking.selectedTermId
      : selectedTerm?.title_en ?? booking.selectedTermId;

  return {
    className,
    termName,
    date: selectedTerm?.date ?? "TBD",
    time: selectedTerm ? `${selectedTerm.startTime}-${selectedTerm.endTime}` : "TBD",
  };
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://kutakza-srpski.com";
}

async function sendViaResend({
  payload,
  to,
  subject,
  intro,
  includeCalendar = false,
  footerNote,
}: {
  payload: BookingEmailPayload;
  to: string;
  subject: string;
  intro: string;
  includeCalendar?: boolean;
  footerNote?: string;
}): Promise<EmailResult> {
  const { resend, from, replyTo } = await getResendRuntime();
  const summary = formatBookingSummary(payload);

  // Generate calendar links
  let googleCalendarUrl = "";
  let icsIndividualLink = "";
  let icsSemesterLink = "";
  const isSemesterBooking = payload.booking.bookingType === "semester";

  if (includeCalendar && payload.selectedClass && payload.selectedTerm) {
    const locale = payload.booking.preferredLanguage as 'sr' | 'en';
    googleCalendarUrl = getGoogleCalendarUrl(payload.booking, payload.selectedClass, payload.selectedTerm, locale);
    
    // Generate API links for calendar downloads
    const siteUrl = getSiteUrl();
    icsIndividualLink = `${siteUrl}/api/calendar/ics?bookingId=${payload.booking.id}&type=individual`;
    if (isSemesterBooking && payload.allTerms && payload.allTerms.length > 0) {
      icsSemesterLink = `${siteUrl}/api/calendar/ics?classId=${payload.selectedClass.id}&type=semester`;
    }
  }

  const calendarHtml = includeCalendar && googleCalendarUrl ? `
    <div style="background-color: #f5f1ed; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #2f2822;">📅 Dodaj u kalendar</h3>
      <p style="margin-bottom: 15px;">Izaberite kako zelite da dodate cas u vasu kalendar:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0;">
            <a href="${googleCalendarUrl}" style="display: inline-block; background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">+ Google Calendar</a>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0;">
            <a href="${icsIndividualLink}" download style="display: inline-block; background-color: #34c759; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">📥 Preuzmi (Apple/Outlook)</a>
          </td>
        </tr>
        ${icsSemesterLink ? `
        <tr>
          <td style="padding: 10px 0;">
            <a href="${icsSemesterLink}" download style="display: inline-block; background-color: #ff9500; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">📅 Preuzmi ceo raspored</a>
          </td>
        </tr>
        ` : ''}
      </table>
    </div>
  ` : '';

  const response = await resend.emails.send({
    from,
    ...(replyTo ? { replyTo } : {}),
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.55; color: #2f2822;">
        <h2 style="margin: 0 0 12px;">Kutak za srpski</h2>
        <p>${intro}</p>
        <ul>
          <li><strong>Program:</strong> ${summary.className}</li>
          <li><strong>Termin:</strong> ${summary.termName}</li>
          <li><strong>Tip prijave:</strong> ${isSemesterBooking ? "Semestar" : "Pojedinacni cas"}</li>
          <li><strong>Datum:</strong> ${summary.date}</li>
          <li><strong>Vreme:</strong> ${summary.time}</li>
          <li><strong>Dete:</strong> ${payload.booking.childName}</li>
          <li><strong>Roditelj:</strong> ${payload.booking.parentName}</li>
          <li><strong>Status prijave:</strong> ${payload.booking.status}</li>
        </ul>
        ${calendarHtml}
        ${footerNote ? `<p>${footerNote}</p>` : ""}
      </div>
    `,
  });

  return {
    queued: true,
    provider: "resend",
    id: response.data?.id,
  };
}

async function callInternalEmailApi(
  type: "confirmation" | "admin-notification",
  payload: BookingEmailPayload,
): Promise<EmailResult> {
  const response = await fetch("/api/email/booking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type, payload }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({ message: "Email servis nije dostupan." }))) as {
      message?: string;
    };
    throw new Error(body.message ?? "Slanje emaila nije uspelo.");
  }

  return (await response.json()) as EmailResult;
}

async function callInternalNewsletterApi(payload: BlogNewsletterPayload): Promise<EmailResult> {
  const response = await fetch("/api/email/newsletter", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({ message: "Newsletter servis nije dostupan." }))) as {
      message?: string;
    };
    throw new Error(body.message ?? "Slanje newsletter emaila nije uspelo.");
  }

  return (await response.json()) as EmailResult;
}

export async function sendBookingConfirmation(payload: BookingEmailPayload): Promise<EmailResult> {
  if (typeof window !== "undefined") {
    return callInternalEmailApi("confirmation", payload);
  }

  return sendViaResend({
    payload,
    to: payload.booking.parentEmail,
    subject: "Kutak za srpski | Hvala na prijavi",
    intro:
      "Hvala vam na prijavi za Kutak za srpski jezik. U narednim koracima finalizujemo registraciju, saljemo waiver dokumentaciju i instrukcije za uplatu. Po potrebi mozemo organizovati i kratke konsultacije oko odabira programa.",
    footerNote:
      "Rezervacija postaje vazeca tek nakon potpisanog waiver dokumenta i evidentirane uplate. Online placanje preko sajta trenutno nije ukljuceno.",
  });
}

export async function sendPaymentReceivedConfirmation(
  payload: BookingEmailPayload,
): Promise<EmailResult> {
  const isSemesterBooking = payload.booking.bookingType === "semester";

  return sendViaResend({
    payload,
    to: payload.booking.parentEmail,
    subject: "Kutak za srpski | Uplata je evidentirana",
    intro:
      "Uplata je uspesno evidentirana. Dobrodosli u toplo i podsticajno okruzenje Kutka za srpski jezik - radujemo se dolasku vaseg deteta i cele porodice.",
    includeCalendar: true,
    footerNote: isSemesterBooking
      ? "U nastavku su linkovi da raspored semestra odmah dodate u kalendar (Google, Apple ili Outlook)."
      : "U nastavku su linkovi da izabrani cas odmah dodate u kalendar (Google, Apple ili Outlook).",
  });
}

export async function sendAdminBookingNotification(payload: BookingEmailPayload): Promise<EmailResult> {
  if (typeof window !== "undefined") {
    return callInternalEmailApi("admin-notification", payload);
  }

  const adminTo = process.env.EMAIL_ADMIN_TO;
  if (!adminTo) {
    throw new Error("EMAIL_ADMIN_TO nije konfigurisan.");
  }

  return sendViaResend({
    payload,
    to: adminTo,
    subject: "Kutak za srpski | Nova rezervacija",
    intro: "Primljena je nova rezervacija sa sajta.",
  });
}

export interface BlogNewsletterPayload {
  post: BlogPost;
  subscribers: NewsletterSubscriber[];
}

export interface InvoiceEmailPayload {
  invoice: Invoice;
}

export interface InvoiceReminderEmailPayload {
  invoice: Invoice;
  daysOverdue?: number;
}

export interface TeacherAssignmentEmailPayload {
  worker: WorkerProfile;
  schoolClass: SchoolClass;
  term: Term;
}

function formatInvoiceDate(dateIso: string) {
  try {
    return new Date(dateIso).toLocaleDateString("sr-RS");
  } catch {
    return dateIso;
  }
}

function formatInvoiceAmount(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export async function sendInvoiceEmail(payload: InvoiceEmailPayload): Promise<EmailResult> {
  const { resend, from, replyTo } = await getResendRuntime();
  const issueDate = formatInvoiceDate(payload.invoice.issueDate);
  const dueDate = formatInvoiceDate(payload.invoice.dueDate);
  const amount = formatInvoiceAmount(payload.invoice.amount, payload.invoice.currency);

  const response = await resend.emails.send({
    from,
    ...(replyTo ? { replyTo } : {}),
    to: payload.invoice.parentEmail,
    subject: "Invoice for your Kutak za srpski booking",
    html: `
      <div style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#243247;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e7ecf4;box-shadow:0 10px 28px rgba(31,41,55,0.08);">
                <tr>
                  <td style="padding:28px 30px;background:linear-gradient(135deg,#ffffff,#edf5fe);border-bottom:1px solid #e7ecf4;">
                    <p style="margin:0;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#5d7087;font-weight:700;">Kutak za srpski</p>
                    <h1 style="margin:10px 0 0;font-size:28px;line-height:1.2;color:#1f2a37;">Invoice ${payload.invoice.invoiceNumber}</h1>
                    <p style="margin:10px 0 0;font-size:15px;color:#4b5c70;line-height:1.6;">Dear ${payload.invoice.parentName}, thank you for your trust. Please find your invoice details below.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:26px 30px 8px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #eff3f8;font-size:14px;color:#5b6f86;">Parent</td>
                        <td style="padding:12px 0;border-bottom:1px solid #eff3f8;font-size:14px;color:#1f2a37;font-weight:600;text-align:right;">${payload.invoice.parentName}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #eff3f8;font-size:14px;color:#5b6f86;">Child</td>
                        <td style="padding:12px 0;border-bottom:1px solid #eff3f8;font-size:14px;color:#1f2a37;font-weight:600;text-align:right;">${payload.invoice.childName}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #eff3f8;font-size:14px;color:#5b6f86;">Service</td>
                        <td style="padding:12px 0;border-bottom:1px solid #eff3f8;font-size:14px;color:#1f2a37;font-weight:600;text-align:right;">${payload.invoice.serviceDescription}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #eff3f8;font-size:14px;color:#5b6f86;">Issue date</td>
                        <td style="padding:12px 0;border-bottom:1px solid #eff3f8;font-size:14px;color:#1f2a37;font-weight:600;text-align:right;">${issueDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:12px 0;border-bottom:1px solid #eff3f8;font-size:14px;color:#5b6f86;">Due date</td>
                        <td style="padding:12px 0;border-bottom:1px solid #eff3f8;font-size:14px;color:#1f2a37;font-weight:600;text-align:right;">${dueDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:14px 0;font-size:14px;color:#5b6f86;font-weight:700;">Amount</td>
                        <td style="padding:14px 0;font-size:18px;color:#1f2a37;font-weight:800;text-align:right;">${amount}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:14px 30px 8px;">
                    <div style="background:#f5f9ff;border:1px solid #dce7f5;border-radius:12px;padding:14px 16px;">
                      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.6px;text-transform:uppercase;color:#55708c;font-weight:700;">Payment instructions</p>
                      <p style="margin:0;font-size:14px;color:#243247;line-height:1.6;white-space:pre-line;">${payload.invoice.paymentInstructions}</p>
                    </div>
                  </td>
                </tr>
                ${payload.invoice.notes?.trim() ? `
                <tr>
                  <td style="padding:8px 30px 8px;">
                    <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.6px;text-transform:uppercase;color:#55708c;font-weight:700;">Notes</p>
                    <p style="margin:0;font-size:14px;color:#243247;line-height:1.6;white-space:pre-line;">${payload.invoice.notes}</p>
                  </td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding:24px 30px 30px;">
                    <p style="margin:0;font-size:13px;color:#5f7288;line-height:1.6;">If you have any questions, simply reply to this email. We appreciate your partnership in your child's language journey.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  });

  return {
    queued: true,
    provider: "resend",
    id: response.data?.id,
  };
}

export async function sendInvoiceReminderEmail(
  payload: InvoiceReminderEmailPayload,
): Promise<EmailResult> {
  const { resend, from, replyTo } = await getResendRuntime();
  const dueDate = formatInvoiceDate(payload.invoice.dueDate);
  const amount = formatInvoiceAmount(payload.invoice.amount, payload.invoice.currency);
  const overdueLine =
    payload.daysOverdue && payload.daysOverdue > 0
      ? `<p style="margin:0 0 12px;font-size:14px;color:#8a3a3a;">This invoice is currently ${payload.daysOverdue} day(s) overdue.</p>`
      : "";

  const response = await resend.emails.send({
    from,
    ...(replyTo ? { replyTo } : {}),
    to: payload.invoice.parentEmail,
    subject: `Payment reminder: ${payload.invoice.invoiceNumber}`,
    html: `
      <div style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,sans-serif;color:#243247;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e7ecf4;box-shadow:0 10px 28px rgba(31,41,55,0.08);">
                <tr>
                  <td style="padding:24px 28px;background:linear-gradient(135deg,#ffffff,#edf5fe);border-bottom:1px solid #e7ecf4;">
                    <p style="margin:0;font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:#5d7087;font-weight:700;">Kutak za srpski</p>
                    <h2 style="margin:10px 0 0;font-size:24px;line-height:1.2;color:#1f2a37;">Payment Reminder</h2>
                    <p style="margin:10px 0 0;font-size:14px;color:#4b5c70;line-height:1.6;">Dear ${payload.invoice.parentName}, this is a friendly reminder regarding your invoice ${payload.invoice.invoiceNumber}.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:20px 28px;">
                    ${overdueLine}
                    <p style="margin:0 0 8px;font-size:14px;"><strong>Child:</strong> ${payload.invoice.childName}</p>
                    <p style="margin:0 0 8px;font-size:14px;"><strong>Service:</strong> ${payload.invoice.serviceDescription}</p>
                    <p style="margin:0 0 8px;font-size:14px;"><strong>Due date:</strong> ${dueDate}</p>
                    <p style="margin:0 0 16px;font-size:16px;"><strong>Amount due:</strong> ${amount}</p>
                    <div style="background:#f5f9ff;border:1px solid #dce7f5;border-radius:12px;padding:14px 16px;">
                      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.6px;text-transform:uppercase;color:#55708c;font-weight:700;">Payment instructions</p>
                      <p style="margin:0;font-size:14px;color:#243247;line-height:1.6;white-space:pre-line;">${payload.invoice.paymentInstructions}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    `,
  });

  return {
    queued: true,
    provider: "resend",
    id: response.data?.id,
  };
}

export async function sendTeacherAssignmentEmail(
  payload: TeacherAssignmentEmailPayload,
): Promise<EmailResult> {
  const { resend, from, replyTo } = await getResendRuntime();
  const locale = payload.worker.preferredLanguage || "sr";
  const siteUrl = getSiteUrl();
  const googleCalendarUrl = getTeacherGoogleCalendarUrl(payload.schoolClass, payload.term, locale);
  const icsTermLink = `${siteUrl}/api/calendar/ics?termId=${payload.term.id}&type=term`;
  const icsSemesterLink = `${siteUrl}/api/calendar/ics?classId=${payload.schoolClass.id}&type=semester`;
  const className = locale === "en" ? payload.schoolClass.title_en : payload.schoolClass.title_sr;

  const response = await resend.emails.send({
    from,
    ...(replyTo ? { replyTo } : {}),
    to: payload.worker.email,
    subject: `Kutak za srpski | Novi dodeljeni termin: ${payload.term.title_sr}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.55; color: #2f2822;">
        <h2 style="margin: 0 0 12px;">Kutak za srpski</h2>
        <p>Zdravo ${payload.worker.fullName}, dodeljen vam je novi termin nastave.</p>
        <ul>
          <li><strong>Grupa:</strong> ${className}</li>
          <li><strong>Termin:</strong> ${payload.term.title_sr}</li>
          <li><strong>Datum:</strong> ${payload.term.date}</li>
          <li><strong>Vreme:</strong> ${payload.term.startTime} - ${payload.term.endTime}</li>
          <li><strong>Lokacija:</strong> ${payload.term.location}</li>
          <li><strong>Tip angazmana:</strong> ${payload.worker.employmentType}</li>
        </ul>

        <div style="background-color: #f5f1ed; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #2f2822;">Dodaj u kalendar</h3>
          <p style="margin-bottom: 15px;">Izaberite opciju za kalendar:</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0;">
                <a href="${googleCalendarUrl}" style="display: inline-block; background-color: #4285F4; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">+ Google Calendar</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <a href="${icsTermLink}" download style="display: inline-block; background-color: #34c759; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Preuzmi ovaj termin (ICS)</a>
              </td>
            </tr>
            <tr>
              <td style="padding: 10px 0;">
                <a href="${icsSemesterLink}" download style="display: inline-block; background-color: #ff9500; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">Preuzmi raspored grupe (ICS)</a>
              </td>
            </tr>
          </table>
        </div>
      </div>
    `,
  });

  return {
    queued: true,
    provider: "resend",
    id: response.data?.id,
  };
}

export async function sendBlogNewsletter(payload: BlogNewsletterPayload): Promise<EmailResult> {
  if (!payload.subscribers.length) {
    return {
      queued: true,
      provider: "resend",
    };
  }

  if (typeof window !== "undefined") {
    return callInternalNewsletterApi(payload);
  }

  const { resend, from, replyTo } = await getResendRuntime();

  const sends = payload.subscribers.map((subscriber) => {
    const title = subscriber.preferredLanguage === "sr" ? payload.post.title_sr : payload.post.title_en;
    const excerpt =
      subscriber.preferredLanguage === "sr" ? payload.post.excerpt_sr : payload.post.excerpt_en;
    const ctaLabel = subscriber.preferredLanguage === "sr" ? "Procitaj blog" : "Read the post";
    const localeSegment = subscriber.preferredLanguage === "sr" ? "sr" : "en";
    const blogUrl = `${getSiteUrl()}/${localeSegment}/blog/${payload.post.slug}`;

    return resend.emails.send({
      from,
      ...(replyTo ? { replyTo } : {}),
      to: subscriber.email,
      subject: `Kutak za srpski | ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.55; color: #2f2822;">
          <h2 style="margin: 0 0 12px;">${title}</h2>
          <p>${excerpt}</p>
          <p>
            <a href="${blogUrl}">${ctaLabel}</a>
          </p>
        </div>
      `,
    });
  });

  await Promise.all(sends);

  return {
    queued: true,
    provider: "resend",
  };
}
