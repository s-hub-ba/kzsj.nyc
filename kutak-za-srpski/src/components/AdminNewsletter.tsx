"use client";

import { NewsletterSubscriber } from "@/types/models";

interface AdminNewsletterProps {
  subscribers: NewsletterSubscriber[];
}

export function AdminNewsletter({ subscribers }: AdminNewsletterProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-line bg-surface p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold">Newsletter pretplatnici</h2>
            <p className="mt-1 text-sm text-muted">
              Pregled prijavljenih emailova. Korisnici mogu sami da se odjave preko linka u svakom newsletter emailu.
            </p>
          </div>
          <span className="rounded-full bg-surface-2 px-3 py-1 text-xs text-muted">
            Ukupno: {subscribers.length}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="px-2 py-2">Email</th>
                <th className="px-2 py-2">Jezik</th>
                <th className="px-2 py-2">Izvor</th>
                <th className="px-2 py-2">Prijavljen</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="border-b border-line/60 hover:bg-surface-2">
                  <td className="px-2 py-2 font-medium text-foreground">{subscriber.email}</td>
                  <td className="px-2 py-2 text-muted">{subscriber.preferredLanguage.toUpperCase()}</td>
                  <td className="px-2 py-2 text-muted">{subscriber.source ?? "newsletter-page"}</td>
                  <td className="px-2 py-2 text-muted">
                    {subscriber.createdAt ? new Date(subscriber.createdAt).toLocaleString("sr-RS") : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {subscribers.length === 0 ? (
            <p className="py-4 text-sm text-muted">Još nema prijavljenih emailova na newsletter.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
