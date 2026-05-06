"use client";

import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminNav, AdminTab } from "@/components/AdminNav";
import { AdminOverview } from "@/components/AdminOverview";
import { AdminBookings } from "@/components/AdminBookings";
import { AdminClasses } from "@/components/AdminClasses";
import { AdminPayments } from "@/components/AdminPayments";
import { AdminBlog } from "@/components/AdminBlog";
import { adminSignOut, onAdminAuthStateChanged } from "@/lib/auth";
import {
  getAllClasses,
  getAllTerms,
  getBookings,
  getNewsletterSubscribers,
  getPublishedBlogPosts,
} from "@/lib/firestore";
import { Booking, BlogPost, SchoolClass, Term } from "@/types/models";

export default function AdminDashboardPage() {
  const [currentTab, setCurrentTab] = useState<AdminTab>("overview");
  const [currentAdmin, setCurrentAdmin] = useState<User | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [newsletterCount, setNewsletterCount] = useState(0);
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
    const loadData = async () => {
      try {
        const [allBookings, allClasses, allTerms, subscribers, blogPosts] = await Promise.all([
          getBookings(),
          getAllClasses(),
          getAllTerms(),
          getNewsletterSubscribers(),
          getPublishedBlogPosts(),
        ]);

        setBookings(allBookings);
        setClasses(allClasses);
        setTerms(allTerms);
        setPosts(blogPosts);
        setNewsletterCount(subscribers.length);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

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
                    terms={terms}
                    publishedPostsCount={publishedPostsCount}
                    newsletterCount={newsletterCount}
                  />
                )}

                {currentTab === "bookings" && (
                  <AdminBookings
                    bookings={bookings}
                    currentAdminEmail={currentAdmin.email}
                    onBookingUpdate={handleBookingUpdate}
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
                    currentAdminEmail={currentAdmin.email}
                    onBookingUpdate={handleBookingUpdate}
                  />
                )}

                {currentTab === "blog" && (
                  <AdminBlog posts={posts} onPostUpdate={handlePostsUpdate} />
                )}
              </>
            ) : null}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
