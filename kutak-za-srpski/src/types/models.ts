export type Locale = "sr" | "en";

export type ClassType = "single" | "semester";
export type BookingStatus = "pending" | "confirmed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "cancelled";
export type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled";
export type ReceivedPaymentMethod = "cash" | "zelle" | "bank" | "venmo" | "other";
export type EmploymentType = "full-time" | "part-time" | "both";
export type EmailLogType =
  | "booking-submitted"
  | "payment-confirmed"
  | "admin-notification"
  | "invoice-sent"
  | "invoice-reminder";
export type TermCapacityPolicy = "strict-10" | "direct-12" | "plus-2-override";

export interface SchoolClass {
  id: string;
  title_sr: string;
  title_en: string;
  description_sr: string;
  description_en: string;
  ageGroup: string;
  level: string;
  price: number;
  type: ClassType;
  active: boolean;
  createdAt?: string;
}

export interface Term {
  id: string;
  classId: string;
  assignmentType?: "regular" | "vanredno";
  title_sr: string;
  title_en: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  overbookLimit?: number;
  bookedCount: number;
  location: string;
  active: boolean;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface Booking {
  id: string;
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  childName: string;
  childAge: string;
  selectedClassId: string;
  selectedTermId: string;
  bookingType: ClassType;
  preferredLanguage: Locale;
  message?: string;
  waiverSigned: boolean;
  waiverSignedAt?: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: ReceivedPaymentMethod;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title_sr: string;
  title_en: string;
  excerpt_sr: string;
  excerpt_en: string;
  content_sr: string;
  content_en: string;
  coverImage?: string;
  published: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  sendAsNewsletter?: boolean;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  preferredLanguage: Locale;
  source?: "newsletter-page" | "booking-opt-in";
  createdAt?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  bookingId: string;
  parentName: string;
  parentEmail: string;
  childName: string;
  serviceDescription: string;
  amount: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  status: InvoiceStatus;
  paymentInstructions: string;
  paymentMethod?: ReceivedPaymentMethod;
  notes?: string;
  bookingType?: ClassType;
  selectedClassId?: string;
  selectedTermId?: string;
  createdAt?: string;
  updatedAt?: string;
  reminderEnabled?: boolean;
  reminderIntervalDays?: number;
  reminderCount?: number;
  lastReminderSentAt?: string;
  nextReminderAt?: string;
  pdfUrl?: string;
}

export interface JobApplication {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  employmentType: EmploymentType;
  experienceSummary: string;
  message?: string;
  cvFileName?: string;
  cvFileUrl?: string;
  cvStoragePath?: string;
  cvContentType?: string;
  cvFileSize?: number;
  preferredLanguage: Locale;
  createdAt?: string;
}

export interface EmailLog {
  id: string;
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
  createdAt: string;
}

export interface BookingInput {
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  childName: string;
  childAge: string;
  selectedClassId: string;
  selectedTermId: string;
  bookingType: ClassType;
  preferredLanguage: Locale;
  message?: string;
}

export interface JobApplicationInput {
  fullName: string;
  email: string;
  phone: string;
  employmentType: EmploymentType;
  experienceSummary: string;
  message?: string;
  cvFileName?: string;
  cvFileUrl?: string;
  cvStoragePath?: string;
  cvContentType?: string;
  cvFileSize?: number;
  preferredLanguage: Locale;
}

export interface CreateInvoiceInput {
  bookingId: string;
  serviceDescription: string;
  amount: number;
  currency: string;
  paymentInstructions: string;
  paymentMethod?: ReceivedPaymentMethod;
  notes?: string;
}
