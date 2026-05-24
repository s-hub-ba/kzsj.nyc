"use client";

import { Booking, JobApplication, Term } from "@/types/models";
import { AdminStatCard } from "./AdminStatCard";

interface AdminOverviewProps {
  bookings: Booking[];
  terms: Term[];
  publishedPostsCount: number;
  newsletterCount: number;
  jobApplications: JobApplication[];
}

export function AdminOverview({
  bookings,
  terms,
  publishedPostsCount,
  newsletterCount,
  jobApplications,
}: AdminOverviewProps) {
  const pending = bookings.filter((b) => b.status === "pending").length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const unpaidCount = bookings.filter((b) => b.paymentStatus === "pending").length;

  // Calculate group fill percentages
  const groupFills = terms.map((term) => {
    const maxCapacity = term.capacity + (term.overbookLimit ?? 0);
    const fill = ((term.bookedCount ?? 0) / maxCapacity) * 100;
    return {
      termId: term.id,
      title: term.title_sr,
      booked: term.bookedCount ?? 0,
      maxCapacity,
      fillPercentage: Math.min(fill, 100),
      isOverbooked: (term.bookedCount ?? 0) > term.capacity,
    };
  });

  const avgFill =
    groupFills.length > 0
      ? (groupFills.reduce((sum, g) => sum + g.fillPercentage, 0) / groupFills.length).toFixed(1)
      : "0";

  return (
    <div className="space-y-6">
      {/* Top Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminStatCard title="Ukupno prijava" value={bookings.length} highlight="accent" />
        <AdminStatCard title="Na čekanju" value={pending} highlight="warning" />
        <AdminStatCard title="Potvrđene" value={confirmed} highlight="success" />
        <AdminStatCard title="Neplačene" value={unpaidCount} highlight="danger" />
        <AdminStatCard title="Prosečna popunjenost" value={`${avgFill}%`} highlight="info" />
      </section>

      {/* Blog & Newsletter */}
      <section className="grid gap-4 sm:grid-cols-3">
        <AdminStatCard title="Objavljenih blog postova" value={publishedPostsCount} />
        <AdminStatCard title="Newsletter pretplatnika" value={newsletterCount} />
        <AdminStatCard title="Prijava za posao" value={jobApplications.length} />
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Najnovije prijave za posao</h2>
        <p className="mt-1 text-sm text-muted">Ko se prijavio i kada, sa direktnim pristupom CV-ju.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-2 py-3">Kandidat</th>
                <th className="px-2 py-3">Kontakt</th>
                <th className="px-2 py-3">Angažman</th>
                <th className="px-2 py-3">CV</th>
                <th className="px-2 py-3">Prijavljeno</th>
              </tr>
            </thead>
            <tbody>
              {jobApplications.slice(0, 8).map((application) => (
                <tr key={application.id} className="border-b border-line/60 hover:bg-surface-2">
                  <td className="px-2 py-3 font-medium">{application.fullName}</td>
                  <td className="px-2 py-3 text-muted">
                    <div>{application.email}</div>
                    <div>{application.phone}</div>
                  </td>
                  <td className="px-2 py-3">{application.employmentType}</td>
                  <td className="px-2 py-3">
                    {application.cvFileUrl ? (
                      <a
                        href={application.cvFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-accent hover:underline"
                      >
                        {application.cvFileName || "Otvori CV"}
                      </a>
                    ) : (
                      <span className="text-muted">Nije dodat</span>
                    )}
                  </td>
                  <td className="px-2 py-3 text-muted">
                    {application.createdAt ? new Date(application.createdAt).toLocaleString("sr-RS") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {jobApplications.length === 0 ? <p className="py-4 text-sm text-muted">Još nema prijava za posao.</p> : null}
        </div>
      </section>

      {/* Group Fill Chart */}
      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Popunjenost grupa</h2>
        <p className="mt-1 text-sm text-muted">Trenutna zastupljenost po terminima</p>
        <div className="mt-6 space-y-4">
          {groupFills.length > 0 ? (
            groupFills.map((group) => (
              <div key={group.termId}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{group.title}</span>
                  <span className="text-muted">
                    {group.booked} / {group.maxCapacity}
                    {group.isOverbooked && " ⚠️"}
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
                  <div
                    className={`h-full transition-all ${
                      group.fillPercentage >= 100 ? "bg-danger" : "bg-success"
                    }`}
                    style={{ width: `${Math.min(group.fillPercentage, 100)}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted">Nema aktivnih termina.</p>
          )}
        </div>
      </section>

      {/* Recent Bookings */}
      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Poslednje prijave</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-3 px-2">Roditelj</th>
                <th className="py-3 px-2">Dete</th>
                <th className="py-3 px-2">Program</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2">Plaćanje</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 10).map((booking) => (
                <tr key={booking.id} className="border-b border-line/60 hover:bg-surface-2">
                  <td className="py-3 px-2 font-medium">{booking.parentName}</td>
                  <td className="py-3 px-2">{booking.childName}</td>
                  <td className="py-3 px-2 text-sm text-muted">{booking.selectedClassId}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        booking.status === "confirmed"
                          ? "bg-success/20 text-success"
                          : "bg-warning/20 text-warning"
                      }`}
                    >
                      {booking.status === "confirmed" ? "✓ Potvrđena" : "⏳ Na čekanju"}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                        booking.paymentStatus === "paid"
                          ? "bg-success/20 text-success"
                          : "bg-warning/20 text-warning"
                      }`}
                    >
                      {booking.paymentStatus === "paid" ? "✓ Plaćeno" : "⏳ Na čekanju"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
