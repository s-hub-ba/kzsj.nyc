"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminNav, AdminTab } from "@/components/AdminNav";
import { AdminOverview } from "@/components/AdminOverview";
import { AdminBookings } from "@/components/AdminBookings";
import { AdminJobApplications } from "@/components/AdminJobApplications";
import { AdminClasses } from "@/components/AdminClasses";
import { AdminPayments } from "@/components/AdminPayments";
import { AdminInvoices } from "@/components/AdminInvoices";
import { AdminBlog } from "@/components/AdminBlog";
import { AdminEmailLog } from "@/components/AdminEmailLog";
import { adminSignOut, onAdminAuthStateChanged } from "@/lib/auth";
import { getAdminDashboardData } from "@/lib/firestore";
import { Booking, BlogPost, EmailLog, JobApplication, NewsletterSubscriber, SchoolClass, Term, WorkerProfile } from "@/types/models";

export default function AdminDashboardPage() {
  const [currentTab, setCurrentTab] = useState<AdminTab>("overview");
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [pendingInvoiceBookingId, setPendingInvoiceBookingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Subscribe to admin auth
  useEffect(() => {
    const unsubscribe = onAdminAuthStateChanged((user) => {
      setCurrentAdmin(user);
    });
    return () => unsubscribe();
  }, []);

  // Load all data
  useEffect(() => {
    if (!currentAdmin?.email) {
      return;
    }

    const loadData = async () => {
      try {
        const data = await getAdminDashboardData();

        setBookings(data.bookings);
        setClasses(data.classes);
        setTerms(data.terms);
        setJobApplications(data.jobApplications);
        setWorkers(data.workers ?? []);
        setPosts(data.posts);
        setEmailLogs(data.emailLogs);
        setNewsletterSubscribers(data.newsletterSubscribers);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [currentAdmin?.email]);

  const handleBookingUpdate = (bookingId: string, updates: Partial<Booking>) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, ...updates } : b)),
    );
  };

  const handleTermUpdate = (termId: string, updates: Partial<Term>) => {
    setTerms((prev) =>
      prev.map((t) => (t.id === termId ? { ...t, ...updates } : t)),
    );
  };

  const handlePostsUpdate = (updatedPosts: BlogPost[]) => {
    setPosts(updatedPosts);
  };

  const handleCreateInvoiceFromBooking = (bookingId: string) => {
    setPendingInvoiceBookingId(bookingId);
    setCurrentTab("invoices");
  };

  const publishedPostsCount = posts.filter((p) => p.published).length;

  return (
    <ProtectedRoute>
      <div className="flex h-screen flex-col bg-bg">
        {/* Header */}
        <header className="border-b border-line bg-surface px-4 py-4 md:px-8">
          <div className="flex max-w-6xl items-center justify-between mx-auto">
            <div>
              <h1 className="text-3xl font-bold">🎓 Kutak za srpski</h1>
              <p className="text-sm text-muted">Admin kontrolni centar</p>
            </div>
            <button
              onClick={() => void adminSignOut()}
              className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium transition hover:bg-surface-2"
            >
              Odjavi se
            </button>
          </div>
        </header>

        {/* Tab Navigation */}
        <AdminNav currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-muted">Učitavanje...</p>
              </div>
            ) : currentAdmin?.email ? (
              <>
                {currentTab === "overview" && (
                  <AdminOverview
                    bookings={bookings}
                    classes={classes}
                    terms={terms}
                    publishedPostsCount={publishedPostsCount}
                    newsletterSubscribers={newsletterSubscribers}
                    jobApplications={jobApplications}
                  />
                )}

                {currentTab === "bookings" && (
                  <AdminBookings
                    bookings={bookings}
                    classes={classes}
                    terms={terms}
                    currentAdminEmail={currentAdmin.email}
                    onBookingUpdate={handleBookingUpdate}
                    onTermsUpdate={setTerms}
                    onCreateInvoice={handleCreateInvoiceFromBooking}
                  />
                )}

                {currentTab === "applications" && (
                  <AdminJobApplications
                    applications={jobApplications}
                    workers={workers}
                    classes={classes}
                    terms={terms}
                    currentAdminEmail={currentAdmin.email}
                    onWorkersUpdate={setWorkers}
                    onTermsUpdate={setTerms}
                  />
                )}

                {currentTab === "classes" && (
                  <AdminClasses
                    classes={classes}
                    terms={terms}
                    currentAdminEmail={currentAdmin.email}
                    onClassesUpdate={setClasses}
                    onTermsUpdate={setTerms}
                  />
                )}

                {currentTab === "payments" && (
                  <AdminPayments
                    bookings={bookings}
                    classes={classes}
                    terms={terms}
                    currentAdminEmail={currentAdmin.email}
                    onBookingUpdate={handleBookingUpdate}
                  />
                )}

                {currentTab === "invoices" && (
                  <AdminInvoices
                    bookings={bookings}
                    classes={classes}
                    initialBookingId={pendingInvoiceBookingId}
                    onInitialBookingHandled={() => setPendingInvoiceBookingId(null)}
                  />
                )}

                {currentTab === "blog" && (
                  <AdminBlog posts={posts} onPostUpdate={handlePostsUpdate} />
                )}

                {currentTab === "emails" && <AdminEmailLog logs={emailLogs} />}
              </>
            ) : null}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
