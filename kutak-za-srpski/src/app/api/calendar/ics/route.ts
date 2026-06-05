import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { getActiveTerms } from '@/lib/firestoreServer';
import { generateICS, generateSemesterICS, generateTermICS, getCalendarFileName } from '@/services/calendarService';
import { Booking, SchoolClass, Term } from '@/types/models';

/**
 * GET /api/calendar/ics?bookingId=...&type=individual
 * GET /api/calendar/ics?classId=...&type=semester
 * GET /api/calendar/ics?termId=...&type=term
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const bookingId = searchParams.get('bookingId');
    const classId = searchParams.get('classId');
    const termId = searchParams.get('termId');

    if (!type || !['individual', 'semester', 'term'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    if (type === 'individual') {
      if (!bookingId) {
        return NextResponse.json(
          { error: 'bookingId is required for individual type' },
          { status: 400 }
        );
      }

      // Fetch booking + class + term using server SDK
      const bookingDoc = await db.collection('bookings').doc(bookingId).get();

      if (!bookingDoc.exists) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }

      const booking = bookingDoc.data() as Booking;
      if (!booking) {
        return NextResponse.json(
          { error: 'Invalid booking data' },
          { status: 404 }
        );
      }

      const classDoc = await db.collection('classes').doc(booking.selectedClassId).get();
      const termDoc = await db.collection('terms').doc(booking.selectedTermId).get();

      if (!classDoc.exists || !termDoc.exists) {
        return NextResponse.json(
          { error: 'Class or term not found' },
          { status: 404 }
        );
      }

      const schoolClass = classDoc.data() as SchoolClass;
      const term = termDoc.data() as Term;
      const locale = (booking.preferredLanguage || 'sr') as 'sr' | 'en';
      const icsContent = generateICS(booking, schoolClass, term, locale);
      const fileName = getCalendarFileName(schoolClass, term, false);

      return new NextResponse(icsContent, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    if (type === 'semester') {
      if (!classId) {
        return NextResponse.json(
          { error: 'classId is required for semester type' },
          { status: 400 }
        );
      }

      // Fetch class + all its terms using server SDK
      const classDoc = await db.collection('classes').doc(classId).get();

      if (!classDoc.exists) {
        return NextResponse.json(
          { error: 'Class not found' },
          { status: 404 }
        );
      }

      const schoolClass = classDoc.data() as SchoolClass;
      const allTerms = await getActiveTerms();
      const classTerms = allTerms.filter(t => t.classId === classId);

      if (classTerms.length === 0) {
        return NextResponse.json(
          { error: 'No terms found for this class' },
          { status: 404 }
        );
      }

      const locale = 'sr'; // Default to Serbian for semester schedule
      const icsContent = generateSemesterICS([], schoolClass, classTerms, locale);
      const fileName = getCalendarFileName(schoolClass, undefined, true);

      return new NextResponse(icsContent, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    if (type === 'term') {
      if (!termId) {
        return NextResponse.json(
          { error: 'termId is required for term type' },
          { status: 400 }
        );
      }

      const termDoc = await db.collection('terms').doc(termId).get();
      if (!termDoc.exists) {
        return NextResponse.json(
          { error: 'Term not found' },
          { status: 404 }
        );
      }

      const term = termDoc.data() as Term;
      const classDoc = await db.collection('classes').doc(term.classId).get();

      if (!classDoc.exists) {
        return NextResponse.json(
          { error: 'Class not found' },
          { status: 404 }
        );
      }

      const schoolClass = classDoc.data() as SchoolClass;
      const locale = 'sr';
      const icsContent = generateTermICS(schoolClass, term, locale);
      const fileName = getCalendarFileName(schoolClass, term, false);

      return new NextResponse(icsContent, {
        headers: {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }
  } catch (error) {
    console.error('Calendar API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate calendar' },
      { status: 500 }
    );
  }
}
