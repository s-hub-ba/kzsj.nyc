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
  EmailLog,
  Invoice,
  JobApplication,
  JobApplicationInput,
  Locale,
  NewsletterSubscriber,
  PaymentStatus,
  ReceivedPaymentMethod,
  SchoolClass,
  TermCapacityPolicy,
  Term,
  WorkerProfile,
  WorkerShiftOffer,
} from "@/types/models";
import { sampleBlogPosts, sampleClasses, sampleTerms } from "@/lib/sampleData";
import { auth } from "@/lib/firebase";

const isServerRuntime = typeof window === "undefined";

type AdminDashboardData = {
  bookings: Booking[];
  classes: SchoolClass[];
  terms: Term[];
  newsletterSubscribers: NewsletterSubscriber[];
  jobApplications: JobApplication[];
  workers: WorkerProfile[];
  workerOffers: WorkerShiftOffer[];
  posts: BlogPost[];
  emailLogs: EmailLog[];
  invoices: Invoice[];
};

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  if (!isServerRuntime) {
    return callAdminApi<AdminDashboardData>("getDashboardData");
  }

  return {
    bookings: await getBookings(),
    classes: await getAllClasses(),
    terms: await getAllTerms(),
    newsletterSubscribers: await getNewsletterSubscribers(),
    jobApplications: await getJobApplications(),
    workers: await getWorkers(),
    workerOffers: [],
    posts: await getAllBlogPosts(),
    emailLogs: [],
    invoices: [],
  };
}

async function callAdminApi<T>(action: string, payload?: Record<string, unknown>): Promise<T> {
  if (isServerRuntime) {
    throw new Error("Admin API je dostupna samo iz browser-a.");
  }

  const currentUser = auth?.currentUser;
  if (!currentUser) {
    throw new Error("Admin korisnik nije prijavljen.");
  }

  const token = await currentUser.getIdToken(true);
  const response = await fetch("/api/admin", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ action, payload }),
  });

  const data = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) {
    throw new Error(data.message ?? "Admin operacija nije uspela.");
  }

  return data;
}

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
  if (!db) return sampleClasses;
  if (!isServerRuntime) {
    const data = await callAdminApi<AdminDashboardData>("getDashboardData");
    return data.classes;
  }

  const snapshot = await getDocs(collection(db, "classes"));
  return snapshot.docs.map((d) => mapDoc<SchoolClass>(d.id, d.data()));
}

export async function getAllTerms(): Promise<Term[]> {
  if (!db) return sampleTerms;
  if (!isServerRuntime) {
    const data = await callAdminApi<AdminDashboardData>("getDashboardData");
    return data.terms;
  }

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

  // Filter all terms for this class for semester schedule
  const classTerms = allTerms.filter(t => t.classId === input.selectedClassId);

  await Promise.all([
    sendBookingConfirmation({ 
      booking, 
      selectedClass, 
      selectedTerm,
      allTerms: classTerms
    }),
    sendAdminBookingNotification({ 
      booking, 
      selectedClass, 
      selectedTerm,
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

export async function subscribeToNewsletter(
  email: string,
  preferredLanguage: Locale,
  source: "newsletter-page" | "booking-opt-in" = "newsletter-page",
) {
  const firestore = requireDb();
  const normalizedEmail = email.trim().toLowerCase();

  const existingQuery = query(
    collection(firestore, "newsletterSubscribers"),
    where("email", "==", normalizedEmail),
  );
  const existingSnapshot = await getDocs(existingQuery);
  const first = existingSnapshot.docs[0];

  if (first) {
    return mapDoc<NewsletterSubscriber>(first.id, first.data());
  }

  const payload = {
    email: normalizedEmail,
    preferredLanguage,
    source,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(firestore, "newsletterSubscribers"), payload);
  return mapDoc<NewsletterSubscriber>(docRef.id, payload);
}

export async function submitJobApplication(input: JobApplicationInput): Promise<JobApplication> {
  if (!isServerRuntime) {
    const response = await fetch("/api/careers/apply", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const data = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok) {
      throw new Error(data.message ?? "Prijava trenutno nije uspela.");
    }

    if (!data.id) {
      throw new Error("Server nije vratio ID prijave.");
    }

    return {
      id: data.id,
      ...input,
      email: input.email.trim().toLowerCase(),
      createdAt: new Date().toISOString(),
    };
  }

  const firestore = requireDb();
  const payload = {
    ...input,
    email: input.email.trim().toLowerCase(),
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(firestore, "jobApplications"), payload);
  return mapDoc<JobApplication>(docRef.id, payload);
}

export async function getJobApplications() {
  if (!db) return [] as JobApplication[];
  if (!isServerRuntime) {
    const data = await callAdminApi<AdminDashboardData>("getDashboardData");
    return data.jobApplications;
  }

  const q = query(collection(db, "jobApplications"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDoc<JobApplication>(d.id, d.data()));
}

export async function getWorkers() {
  if (!db) return [] as WorkerProfile[];
  if (!isServerRuntime) {
    const data = await callAdminApi<AdminDashboardData>("getDashboardData");
    return data.workers;
  }

  const q = query(collection(db, "workers"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDoc<WorkerProfile>(d.id, d.data()));
}

export async function assignBookingToTerm(bookingId: string, targetTermId: string) {
  await callAdminApi<{ ok: true }>("assignBookingToTerm", { bookingId, targetTermId });
}

export async function sendBookingToQueue(bookingId: string) {
  await callAdminApi<{ ok: true }>("sendBookingToQueue", { bookingId });
}

export async function createWorkerFromApplication(applicationId: string) {
  const result = await callAdminApi<{ worker: WorkerProfile }>("createWorkerFromApplication", {
    applicationId,
  });
  return result.worker;
}

export async function saveWorkerProfile(
  workerId: string,
  input: {
    fullName?: string;
    email?: string;
    phone?: string;
    employmentType?: WorkerProfile["employmentType"];
    experienceSummary?: string;
    active?: boolean;
    notes?: string;
  },
) {
  const result = await callAdminApi<{ worker: WorkerProfile }>("saveWorkerProfile", {
    workerId,
    ...input,
  });
  return result.worker;
}

export async function createWorkerOffer(
  workerId: string,
  input: {
    scope: "term" | "class";
    termId?: string;
    classId?: string;
  },
) {
  return callAdminApi<{ ok: true; offer: WorkerShiftOffer; emailQueued: boolean; emailError?: string }>("createWorkerOffer", {
    workerId,
    ...input,
  });
}

export async function getBookings() {
  if (!db) return [] as Booking[];
  if (!isServerRuntime) {
    const data = await callAdminApi<AdminDashboardData>("getDashboardData");
    return data.bookings;
  }

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
  if (!isServerRuntime) {
    const result = await callAdminApi<{ id: string }>("saveClass", payload as Record<string, unknown>);
    return result.id;
  }

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
  if (!isServerRuntime) {
    await callAdminApi<{ ok: true }>("deleteClass", { id });
    return;
  }

  const firestore = requireDb();
  await deleteDoc(doc(firestore, "classes", id));
}

export async function saveTerm(payload: Partial<Term> & Pick<Term, "classId" | "title_sr" | "title_en">) {
  if (!isServerRuntime) {
    const result = await callAdminApi<{ id: string }>("saveTerm", payload as Record<string, unknown>);
    return result.id;
  }

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
  if (!isServerRuntime) {
    await callAdminApi<{ ok: true }>("deleteTerm", { id });
    return;
  }

  const firestore = requireDb();
  await deleteDoc(doc(firestore, "terms", id));
}

export async function updateTermCapacityPolicy(
  termId: string,
  policy: TermCapacityPolicy,
  adminEmail: string,
) {
  if (!isServerRuntime) {
    await callAdminApi<{ ok: true }>("updateTermCapacityPolicy", { termId, policy });
    return;
  }

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
    paymentMethod?: ReceivedPaymentMethod;
    status?: BookingStatus;
  },
  adminEmail: string,
) {
  if (!isServerRuntime) {
    await callAdminApi<{ ok: true }>("updateBookingWorkflow", { bookingId, input });
    return;
  }

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
  if (!isServerRuntime) {
    const result = await callAdminApi<{ id: string }>("saveBlogPost", payload as Record<string, unknown>);
    return result.id;
  }

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
  if (!isServerRuntime) {
    await callAdminApi<{ ok: true }>("deleteBlogPost", { id });
    return;
  }

  const firestore = requireDb();
  await deleteDoc(doc(firestore, "blogPosts", id));
}

export async function getNewsletterSubscribers() {
  if (!db) return [] as NewsletterSubscriber[];
  if (!isServerRuntime) {
    const data = await callAdminApi<AdminDashboardData>("getDashboardData");
    return data.newsletterSubscribers;
  }

  const q = query(collection(db, "newsletterSubscribers"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => mapDoc<NewsletterSubscriber>(d.id, d.data()));
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  if (!db) return sampleBlogPosts;
  if (!isServerRuntime) {
    const data = await callAdminApi<AdminDashboardData>("getDashboardData");
    return data.posts;
  }

  const snapshot = await getDocs(query(collection(db, "blogPosts"), orderBy("createdAt", "desc")));
  return snapshot.docs.map((d) => mapDoc<BlogPost>(d.id, d.data()));
}
