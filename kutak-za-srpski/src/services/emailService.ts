import { BlogPost, Booking, NewsletterSubscriber, SchoolClass, Term } from "@/types/models";
import { getGoogleCalendarUrl, generateICS, generateSemesterICS, getCalendarFileName } from "@/services/calendarService";

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
}: {
  payload: BookingEmailPayload;
  to: string;
  subject: string;
  intro: string;
}): Promise<EmailResult> {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY nije konfigurisan.");
  }

  if (!emailFrom) {
    throw new Error("EMAIL_FROM nije konfigurisan.");
  }

  const { Resend } = await import("resend");
  const resend = new Resend(resendApiKey);
  const summary = formatBookingSummary(payload);

  // Generate calendar links
  let googleCalendarUrl = "";
  let icsIndividualLink = "";
  let icsSemesterLink = "";
  let semesterIcsContent = "";
  
  if (payload.selectedClass && payload.selectedTerm) {
    const locale = payload.booking.preferredLanguage as 'sr' | 'en';
    googleCalendarUrl = getGoogleCalendarUrl(payload.booking, payload.selectedClass, payload.selectedTerm, locale);
    
    // Generate API links for calendar downloads
    const siteUrl = getSiteUrl();
    icsIndividualLink = `${siteUrl}/api/calendar/ics?bookingId=${payload.booking.id}&type=individual`;
    if (payload.allTerms && payload.allTerms.length > 0) {
      icsSemesterLink = `${siteUrl}/api/calendar/ics?classId=${payload.selectedClass.id}&type=semester`;
      semesterIcsContent = generateSemesterICS([], payload.selectedClass, payload.allTerms, locale);
    }
  }

  const calendarHtml = googleCalendarUrl ? `
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
    from: emailFrom,
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.55; color: #2f2822;">
        <h2 style="margin: 0 0 12px;">Kutak za srpski</h2>
        <p>${intro}</p>
        <ul>
          <li><strong>Program:</strong> ${summary.className}</li>
          <li><strong>Termin:</strong> ${summary.termName}</li>
          <li><strong>Datum:</strong> ${summary.date}</li>
          <li><strong>Vreme:</strong> ${summary.time}</li>
          <li><strong>Dete:</strong> ${payload.booking.childName}</li>
          <li><strong>Roditelj:</strong> ${payload.booking.parentName}</li>
          <li><strong>Status rezervacije:</strong> ${payload.booking.status}</li>
        </ul>
        ${calendarHtml}
        <p><strong>Vazno:</strong> Rezervacija postaje vazeca tek nakon potpisanog waiver dokumenta i evidentirane uplate.</p>
        <p><strong>Napomena:</strong> Online placanje trenutno nije aktivno.</p>
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
    subject: "Kutak za srpski | Potvrda rezervacije",
    intro: "Hvala na rezervaciji. U nastavku su osnovni podaci.",
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

  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM;

  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY nije konfigurisan.");
  }

  if (!emailFrom) {
    throw new Error("EMAIL_FROM nije konfigurisan.");
  }

  const { Resend } = await import("resend");
  const resend = new Resend(resendApiKey);

  const sends = payload.subscribers.map((subscriber) => {
    const title = subscriber.preferredLanguage === "sr" ? payload.post.title_sr : payload.post.title_en;
    const excerpt =
      subscriber.preferredLanguage === "sr" ? payload.post.excerpt_sr : payload.post.excerpt_en;
    const ctaLabel = subscriber.preferredLanguage === "sr" ? "Procitaj blog" : "Read the post";
    const localeSegment = subscriber.preferredLanguage === "sr" ? "sr" : "en";
    const blogUrl = `${getSiteUrl()}/${localeSegment}/blog/${payload.post.slug}`;

    return resend.emails.send({
      from: emailFrom,
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
