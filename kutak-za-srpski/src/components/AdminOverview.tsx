"use client";

import { Booking, JobApplication, NewsletterSubscriber, SchoolClass, Term } from "@/types/models";
import { AdminStatCard } from "./AdminStatCard";

interface AdminOverviewProps {
  bookings: Booking[];
  classes: SchoolClass[];
  terms: Term[];
  publishedPostsCount: number;
  newsletterSubscribers: NewsletterSubscriber[];
  jobApplications: JobApplication[];
}

export function AdminOverview({
  bookings,
  classes,
  terms,
  publishedPostsCount,
  newsletterSubscribers,
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

  const classNameById = new Map(classes.map((item) => [item.id, item.title_sr]));
  const assignedTerms = terms
    .filter((term) => term.assignedWorkerId)
    .sort((left, right) => {
      const leftKey = `${left.date} ${left.startTime}`;
      const rightKey = `${right.date} ${right.startTime}`;
      return leftKey.localeCompare(rightKey);
    });

  const assignmentGroups = classes
    .map((cls) => {
      const classTerms = terms
        .filter((term) => term.classId === cls.id && term.assignedWorkerId)
        .sort((left, right) => {
          const leftKey = `${left.date} ${left.startTime}`;
          const rightKey = `${right.date} ${right.startTime}`;
          return leftKey.localeCompare(rightKey);
        });

      if (classTerms.length === 0) {
        return null;
      }

      const workers = Array.from(
        new Map(
          classTerms
            .filter((term) => term.assignedWorkerId)
            .map((term) => [term.assignedWorkerId!, term.assignedWorkerName ?? "Nepoznat predavac"]),
        ).values(),
      );

      return {
        classId: cls.id,
        classTitle: cls.title_sr,
        classType: cls.type === "semester" ? "Semestar" : "Jedan čas",
        assignedCount: classTerms.length,
        totalCount: terms.filter((term) => term.classId === cls.id).length,
        workers,
        nextTerm: classTerms[0],
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  const assignmentTeachers = Array.from(
    new Map(
      assignedTerms.map((term) => [term.assignedWorkerId!, term.assignedWorkerName ?? "Nepoznat predavac"]),
    ).entries(),
  ).map(([workerId, workerName]) => ({
    workerId,
    workerName,
    assignedCount: assignedTerms.filter((term) => term.assignedWorkerId === workerId).length,
  }));

  const newsletterCount = newsletterSubscribers.length;

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
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Dodeljeni poslovi i grupe</h2>
            <p className="mt-1 text-sm text-muted">
              Brz pregled svih termina koji su već dodeljeni predavačima, po grupama i po ljudima.
            </p>
          </div>
          <div className="rounded-full bg-surface-2 px-3 py-1 text-xs text-muted">
            {assignedTerms.length} termina · {assignmentGroups.length} grupa · {assignmentTeachers.length} predavaca
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-4">
            <h3 className="text-base font-semibold text-foreground">Po grupama</h3>
            <div className="mt-3 grid max-h-[460px] gap-3 overflow-auto pr-1">
              {assignmentGroups.length > 0 ? (
                assignmentGroups.map((group) => (
                  <div key={group.classId} className="rounded-xl border border-line bg-surface p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-semibold text-foreground">{group.classTitle}</h4>
                        <p className="mt-1 text-xs text-muted">
                          {group.classType} · {group.assignedCount}/{group.totalCount} termina dodeljeno
                        </p>
                      </div>
                      <span className="rounded-full bg-surface-2 px-2 py-1 text-[11px] font-medium text-muted">
                        {group.workers.length} predavaca
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.workers.map((workerName) => (
                        <span key={`${group.classId}-${workerName}`} className="rounded-full bg-brand/10 px-2 py-1 text-xs font-medium text-brand">
                          {workerName}
                        </span>
                      ))}
                    </div>

                    {group.nextTerm ? (
                      <div className="mt-2 rounded-xl bg-surface-2 px-3 py-2 text-xs text-foreground">
                        {group.nextTerm.title_sr} · {group.nextTerm.date} {group.nextTerm.startTime}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted">Još nema dodeljenih termina.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-white p-4">
            <h3 className="text-base font-semibold text-foreground">Po predavačima</h3>
            <div className="mt-3 max-h-[460px] overflow-auto pr-1">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-muted">
                    <th className="px-2 py-2">Predavač</th>
                    <th className="px-2 py-2">Broj dodela</th>
                    <th className="px-2 py-2">Poslednja grupa</th>
                    <th className="px-2 py-2">Poslednji termin</th>
                  </tr>
                </thead>
                <tbody>
                  {assignmentTeachers.map((teacher) => {
                    const teacherTerms = assignedTerms.filter((term) => term.assignedWorkerId === teacher.workerId);
                    const lastTerm = teacherTerms[0];

                    return (
                      <tr key={teacher.workerId} className="border-b border-line/60 hover:bg-surface-2">
                        <td className="px-2 py-2 font-medium text-foreground">{teacher.workerName}</td>
                        <td className="px-2 py-2 text-muted">{teacher.assignedCount}</td>
                        <td className="px-2 py-2 text-muted">{lastTerm ? classNameById.get(lastTerm.classId) ?? "Nepoznata grupa" : "-"}</td>
                        <td className="px-2 py-2 text-muted">
                          {lastTerm ? `${lastTerm.title_sr} · ${lastTerm.date} ${lastTerm.startTime}` : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {assignmentTeachers.length === 0 ? (
                <p className="py-4 text-sm text-muted">Nema još nijedne aktivne dodele.</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-line bg-surface p-6">
        <h2 className="text-2xl font-semibold">Najnovije prijave za posao</h2>
        <p className="mt-1 text-sm text-muted">Ko se prijavio i kada.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-2 py-3">Kandidat</th>
                <th className="px-2 py-3">Kontakt</th>
                <th className="px-2 py-3">Angažman</th>
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
        <p className="mt-1 text-sm text-muted">Kompaktan pregled po terminima</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {groupFills.length > 0 ? (
            groupFills.map((group) => (
              <div key={group.termId} className="rounded-xl border border-line bg-white p-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="truncate pr-3 font-medium text-foreground">{group.title}</span>
                  <span className="shrink-0 text-muted">
                    {group.booked} / {group.maxCapacity}
                    {group.isOverbooked ? " ⚠" : ""}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
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
            <p className="text-sm text-muted md:col-span-2">Nema aktivnih termina.</p>
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
                  <td className="py-3 px-2 text-sm text-muted">
                    {classNameById.get(booking.selectedClassId) ?? "Nepoznat program"}
                  </td>
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
