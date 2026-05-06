import { Booking, SchoolClass, Term } from '@/types/models';

/**
 * Generate Google Calendar URL for a single event
 * Format: https://calendar.google.com/calendar/u/0/r/eventedit?...
 */
export function getGoogleCalendarUrl(
  booking: Booking,
  schoolClass: SchoolClass,
  term: Term,
  locale: 'sr' | 'en'
): string {
  const className = locale === 'sr' ? schoolClass.title_sr : schoolClass.title_en;
  const eventTitle = `${className} - ${booking.childName}`;
  const eventTime = new Date(term.startTime);
  const endTime = new Date(term.endTime);
  
  // Format: YYYYMMDDTHHMMSSZ (UTC)
  const startTime = formatDateISO(eventTime);
  const endTimeStr = formatDateISO(endTime);
  
  const description = encodeURIComponent(
    `Program: ${className}\nChild: ${booking.childName}\nParent: ${booking.parentName}\nEmail: ${booking.parentEmail}`
  );
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    dates: `${startTime}/${endTimeStr}`,
    details: description,
    location: 'Kutak za srpski jezik',
  });
  
  return `https://calendar.google.com/calendar/u/0/r/eventedit?${params.toString()}`;
}

/**
 * Generate iCalendar (.ics) format for a single event
 */
export function generateICS(
  booking: Booking,
  schoolClass: SchoolClass,
  term: Term,
  locale: 'sr' | 'en'
): string {
  const className = locale === 'sr' ? schoolClass.title_sr : schoolClass.title_en;
  const eventTime = new Date(term.startTime);
  const endTime = new Date(term.endTime);
  
  const dtstart = formatICSDate(eventTime);
  const dtend = formatICSDate(endTime);
  
  const uid = `${booking.id}-${schoolClass.id}@kutakzasrpski.rs`;
  const title = `${className} - ${booking.childName}`;
  const description = `Program: ${className}\\nChild: ${booking.childName}\\nParent: ${booking.parentName}`;
  
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Kutak za srpski jezik//NONSGML Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Kutak za srpski jezik
X-WR-TIMEZONE:Europe/Belgrade
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${title}
DESCRIPTION:${description}
LOCATION:Kutak za srpski jezik
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
  
  return ics;
}

/**
 * Generate semester schedule in ICS format (all classes for a program)
 */
export function generateSemesterICS(
  bookings: Booking[],
  schoolClass: SchoolClass,
  terms: Term[],
  locale: 'sr' | 'en'
): string {
  const className = locale === 'sr' ? schoolClass.title_sr : schoolClass.title_en;
  const classDescription = locale === 'sr' ? schoolClass.description_sr : schoolClass.description_en;
  
  const events = terms
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .map(term => {
      const dtstart = formatICSDate(new Date(term.startTime));
      const dtend = formatICSDate(new Date(term.endTime));
      const uid = `${schoolClass.id}-${term.id}@kutakzasrpski.rs`;
      
      return `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICSDate(new Date())}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${className}
DESCRIPTION:${classDescription}
LOCATION:Kutak za srpski jezik
STATUS:CONFIRMED
END:VEVENT`;
    })
    .join('\n');
  
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Kutak za srpski jezik//NONSGML Semester Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${className} - ${locale === 'sr' ? 'Redosled' : 'Schedule'}
X-WR-TIMEZONE:Europe/Belgrade
${events}
END:VCALENDAR`;
  
  return ics;
}

/**
 * Helper: Format ISO datetime for Google Calendar
 * Input: Date object
 * Output: YYYYMMDDTHHMMSSZ
 */
function formatDateISO(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Helper: Format date for ICS (iCalendar format)
 * Input: Date object
 * Output: YYYYMMDDTHHMMSSZ
 */
function formatICSDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate filename for calendar download
 */
export function getCalendarFileName(
  schoolClass: SchoolClass,
  term?: Term,
  isSemester: boolean = false
): string {
  const sanitizedName = schoolClass.title_sr
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
  
  if (isSemester) {
    return `${sanitizedName}-semester.ics`;
  }
  
  if (term) {
    const date = new Date(term.startTime)
      .toISOString()
      .split('T')[0];
    return `${sanitizedName}-${date}.ics`;
  }
  
  return `${sanitizedName}.ics`;
}
