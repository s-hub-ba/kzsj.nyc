import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  sendAdminBookingNotification,
  sendBlogNewsletter,
  sendBookingConfirmation,
} from "@/services/emailService";
import {
  BlogPost,
  Booking,
  BookingInput,
  BookingStatus,
  Locale,
  NewsletterSubscriber,
  PaymentStatus,
  SchoolClass,
  TermCapacityPolicy,
  Term,
} from "@/types/models";
import { sampleBlogPosts, sampleClasses, sampleTerms } from "@/lib/sampleData";

const isServerRuntime = typeof window === "undefined";

function requireDb() {
  if (!db) {
    throw new Error("Firestore nije konfigurisan. Dodajte NEXT_PUBLIC_FIREBASE_* promenljive.");
  }

  return db;
}

function mapDoc<T extends { id: string }>(
  id: string,
  data: Omit<T, "id"> | Record<string, unknown>,
): T {
  return { id, ...(data as Omit<T, "id">) } as T;
}

export async function getActiveClasses(): Promise<SchoolClass[]> {
  if (!db || isServerRuntime) return sampleClasses.filter((c) => c.active);

  const q = query(collection(db, "classes"), where("active", "==", true));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDoc<SchoolClass>(d.id, d.data()));
}

export async function getAllClasses(): Promise<SchoolClass[]> {
  if (!db || isServerRuntime) return sampleClasses;

  const snapshot = await getDocs(collection(db, "classes"));
  return snapshot.docs.map((d) => mapDoc<SchoolClass>(d.id, d.data()));
}

export async function getAllTerms(): Promise<Term[]> {
  if (!db || isServerRuntime) return sampleTerms;

  const snapshot = await getDocs(collection(db, "terms"));
  return snapshot.docs.map((d) => mapDoc<Term>(d.id, d.data()));
}

export async function getActiveTerms(classId?: string): Promise<Term[]> {
  if (!db || isServerRuntime) {
    return sampleTerms.filter((term) => term.active && (!classId || term.classId === classId));
  }

  const constraints = [where("active", "==", true)] as Parameters<typeof query>[1][];
  if (classId) constraints.push(where("classId", "==", classId));

  const q = query(collection(db, "terms"), ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDoc<Term>(d.id, d.data()));
}

export async function createBooking(input: BookingInput): Promise<Booking> {
  const firestore = requireDb();

  const termRef = doc(firestore, "terms", input.selectedTermId);

  await runTransaction(firestore, async (transaction) => {
    const termSnap = await transaction.get(termRef);
    if (!termSnap.exists()) {
      throw new Error("Izabrani termin ne postoji.");
    }

    const termData = termSnap.data() as Term;
    const maxAllowed = termData.capacity + (termData.overbookLimit ?? 0);
    if ((termData.bookedCount ?? 0) >= maxAllowed) {
      throw new Error("Izabrani termin je popunjen.");
    }

    transaction.update(termRef, { bookedCount: increment(1) });
  });

  const bookingPayload = {
    ...input,
    waiverSigned: false,
    status: "pending" as BookingStatus,
    paymentStatus: "pending" as PaymentStatus,
    createdAt: serverTimestamp(),
  };

  const bookingRef = await addDoc(collection(firestore, "bookings"), bookingPayload);
  const bookingSnapshot = await getDoc(bookingRef);
  const booking = mapDoc<Booking>(bookingSnapshot.id, bookingSnapshot.data() ?? bookingPayload);

  const [classes, allTerms] = await Promise.all([
    getActiveClasses(),
    getActiveTerms(),
  ]);

  const selectedClass = classes.find((item) => item.id === input.selectedClassId);
  const selectedTerm = allTerms.find((item) => item.id === input.selectedTermId);
  
  // Check if this is the first booking for this parent
  const existingBookingsQuery = query(
    collection(firestore, "bookings"),
    where("parentEmail", "==", input.parentEmail),
    where("status", "in", ["confirmed", "pending"])
  );
  const existingBookings = await getDocs(existingBookingsQuery);
  const isFirstBooking = existingBookings.size <= 1; // <= 1 because we just added one
  
  // Filter all terms for this class for semester schedule
  const classTerms = allTerms.filter(t => t.classId === input.selectedClassId);

  await Promise.all([
    sendBookingConfirmation({ 
      booking, 
      selectedClass, 
      selectedTerm,
      isFirstBooking,
      allTerms: classTerms
    }),
    sendAdminBookingNotification({ 
      booking, 
      selectedClass, 
      selectedTerm,
      isFirstBooking,
      allTerms: classTerms
    }),
  ]);

  return booking;
}

export async function getPublishedBlogPosts(): Promise<BlogPost[]> {
  if (!db || isServerRuntime) return sampleBlogPosts.filter((post) => post.published);

  const q = query(
    collection(db, "blogPosts"),
    where("published", "==", true),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDoc<BlogPost>(d.id, d.data()));
}

export async function getPublishedBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!db || isServerRuntime) {
    return sampleBlogPosts.find((post) => post.slug === slug && post.published) ?? null;
  }

  const q = query(
    collection(db, "blogPosts"),
    where("slug", "==", slug),
    where("published", "==", true),
  );

  const snapshot = await getDocs(q);
  const first = snapshot.docs[0];
  return first ? mapDoc<BlogPost>(first.id, first.data()) : null;
}

export async function subscribeToNewsletter(email: string, preferredLanguage: Locale) {
  const firestore = requireDb();
  const payload = {
    email,
    preferredLanguage,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(firestore, "newsletterSubscribers"), payload);
  return mapDoc<NewsletterSubscriber>(docRef.id, payload);
}

export async function getBookings() {
  if (!db) return [] as Booking[];

  const q = query(collection(db, "bookings"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDoc<Booking>(d.id, d.data()));
}

export async function updateBookingStatuses(
  bookingId: string,
  status: BookingStatus,
  paymentStatus: PaymentStatus,
) {
  const firestore = requireDb();
  await updateDoc(doc(firestore, "bookings", bookingId), {
    status,
    paymentStatus,
  });
}

export async function saveClass(payload: Partial<SchoolClass> & Pick<SchoolClass, "title_sr" | "title_en">) {
  const firestore = requireDb();
  if (payload.id) {
    const { id, ...rest } = payload;
    await updateDoc(doc(firestore, "classes", id), rest);
    return id;
  }

  const docRef = await addDoc(collection(firestore, "classes"), {
    ...payload,
    active: payload.active ?? true,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteClass(id: string) {
  const firestore = requireDb();
  await deleteDoc(doc(firestore, "classes", id));
}

export async function saveTerm(payload: Partial<Term> & Pick<Term, "classId" | "title_sr" | "title_en">) {
  const firestore = requireDb();
  if (payload.id) {
    const { id, ...rest } = payload;
    await updateDoc(doc(firestore, "terms", id), rest);
    return id;
  }

  const docRef = await addDoc(collection(firestore, "terms"), {
    ...payload,
    active: payload.active ?? true,
    bookedCount: payload.bookedCount ?? 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deleteTerm(id: string) {
  const firestore = requireDb();
  await deleteDoc(doc(firestore, "terms", id));
}

export async function updateTermCapacityPolicy(
  termId: string,
  policy: TermCapacityPolicy,
  adminEmail: string,
) {
  const firestore = requireDb();
  const now = new Date().toISOString();

  if (policy === "strict-10") {
    await updateDoc(doc(firestore, "terms", termId), {
      capacity: 10,
      overbookLimit: 0,
      updatedBy: adminEmail,
      updatedAt: now,
    });
    return;
  }

  if (policy === "direct-12") {
    await updateDoc(doc(firestore, "terms", termId), {
      capacity: 12,
      overbookLimit: 0,
      updatedBy: adminEmail,
      updatedAt: now,
    });
    return;
  }

  await updateDoc(doc(firestore, "terms", termId), {
    capacity: 10,
    overbookLimit: 2,
    updatedBy: adminEmail,
    updatedAt: now,
  });
}

export async function updateBookingWorkflow(
  bookingId: string,
  input: {
    waiverSigned: boolean;
    paymentStatus: PaymentStatus;
    status?: BookingStatus;
  },
  adminEmail: string,
) {
  const firestore = requireDb();
  const isValidBooking = input.waiverSigned && input.paymentStatus === "paid";
  const now = new Date().toISOString();

  await updateDoc(doc(firestore, "bookings", bookingId), {
    waiverSigned: input.waiverSigned,
    waiverSignedAt: input.waiverSigned ? now : null,
    paymentStatus: input.paymentStatus,
    status: input.status ?? (isValidBooking ? "confirmed" : "pending"),
    updatedBy: adminEmail,
    updatedAt: now,
  });
}

export async function saveBlogPost(payload: Partial<BlogPost> & Pick<BlogPost, "slug" | "title_sr" | "title_en">) {
  const firestore = requireDb();
  let shouldSendNewsletter = false;
  let postId = payload.id;

  if (payload.id) {
    const { id, ...rest } = payload;

    const existingSnapshot = await getDoc(doc(firestore, "blogPosts", id));
    const existing = existingSnapshot.exists() ? (existingSnapshot.data() as Partial<BlogPost>) : null;
    const becomesPublished = Boolean(rest.published) && !Boolean(existing?.published);

    await updateDoc(doc(firestore, "blogPosts", id), {
      ...rest,
      updatedAt: serverTimestamp(),
    });

    shouldSendNewsletter = becomesPublished;
    postId = id;
  } else {
    const docRef = await addDoc(collection(firestore, "blogPosts"), {
      ...payload,
      published: payload.published ?? false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    postId = docRef.id;
    shouldSendNewsletter = Boolean(payload.published);
  }

  if (shouldSendNewsletter && postId) {
    try {
      const publishedPost = await getPublishedBlogPostBySlug(payload.slug);
      const subscribers = await getNewsletterSubscribers();

      if (publishedPost && subscribers.length) {
        await sendBlogNewsletter({
          post: publishedPost,
          subscribers,
        });
      }
    } catch (error) {
      console.error("[newsletter] slanje nije uspelo", error);
    }
  }

  return postId;
}

export async function deleteBlogPost(id: string) {
  const firestore = requireDb();
  await deleteDoc(doc(firestore, "blogPosts", id));
}

export async function getNewsletterSubscribers() {
  if (!db) return [] as NewsletterSubscriber[];

  const q = query(collection(db, "newsletterSubscribers"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDoc<NewsletterSubscriber>(d.id, d.data()));
}
