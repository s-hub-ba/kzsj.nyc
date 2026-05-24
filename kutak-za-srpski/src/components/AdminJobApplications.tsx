"use client";

import { JobApplication } from "@/types/models";

interface AdminJobApplicationsProps {
  applications: JobApplication[];
}

function formatEmploymentType(value: JobApplication["employmentType"]) {
  switch (value) {
    case "full-time":
      return "Stalno";
    case "part-time":
      return "Povremeno";
    case "both":
      return "Obe opcije";
    default:
      return value;
  }
}

export function AdminJobApplications({ applications }: AdminJobApplicationsProps) {
  return (
    <section className="rounded-3xl border border-line bg-surface p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Prijave za posao</h2>
          <p className="mt-1 text-sm text-muted">Kompletan pregled kandidata, vremena prijave i priloženog CV-ja.</p>
        </div>
        <div className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
          Ukupno kandidata: <span className="font-semibold text-foreground">{applications.length}</span>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="px-2 py-3">Kandidat</th>
              <th className="px-2 py-3">Kontakt</th>
              <th className="px-2 py-3">Angažman</th>
              <th className="px-2 py-3">Iskustvo</th>
              <th className="px-2 py-3">Poruka</th>
              <th className="px-2 py-3">CV</th>
              <th className="px-2 py-3">Prijavljeno</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((application) => (
              <tr key={application.id} className="border-b border-line/60 align-top hover:bg-surface-2">
                <td className="px-2 py-3 font-medium">{application.fullName}</td>
                <td className="px-2 py-3 text-muted">
                  <div>{application.email}</div>
                  <div>{application.phone}</div>
                </td>
                <td className="px-2 py-3">{formatEmploymentType(application.employmentType)}</td>
                <td className="max-w-xs px-2 py-3 text-muted">{application.experienceSummary}</td>
                <td className="max-w-xs px-2 py-3 text-muted">{application.message || "-"}</td>
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
                <td className="whitespace-nowrap px-2 py-3 text-muted">
                  {application.createdAt ? new Date(application.createdAt).toLocaleString("sr-RS") : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {applications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
            Još nema prijava za posao.
          </div>
        ) : null}
      </div>
    </section>
  );
}