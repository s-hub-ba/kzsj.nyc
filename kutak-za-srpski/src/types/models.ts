export type Locale = "sr" | "en";

export type ClassType = "single" | "semester";
export type BookingStatus = "pending" | "confirmed" | "cancelled";
export type PaymentStatus = "pending" | "paid" | "cancelled";
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
  createdAt?: string;
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
