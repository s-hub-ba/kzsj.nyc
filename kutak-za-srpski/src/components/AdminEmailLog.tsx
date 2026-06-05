"use client";

import { useMemo, useState } from "react";
import { EmailLog } from "@/types/models";

interface AdminEmailLogProps {
  logs: EmailLog[];
}

type LogFilter =
  | "all"
  | "booking-submitted"
  | "payment-confirmed"
  | "admin-notification"
  | "invoice-sent"
  | "invoice-reminder"
  | "teacher-assignment";

export function AdminEmailLog({ logs }: AdminEmailLogProps) {
  const [filter, setFilter] = useState<LogFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return logs;
    return logs.filter((log) => log.type === filter);
  }, [logs, filter]);

  const formatDateTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("sr-RS");
    } catch {
      return iso;
    }
  };

  const typeLabel = (type: EmailLog["type"]) => {
    if (type === "booking-submitted") return "Prijava poslata";
    if (type === "payment-confirmed") return "Potvrda uplate";
    if (type === "invoice-sent") return "Invoice poslata";
    if (type === "invoice-reminder") return "Invoice podsetnik";
    if (type === "teacher-assignment") return "Dodela predavaca";
    return "Admin obavestenje";
  };

  return (
    <section className="rounded-3xl border border-line bg-surface p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Email log</h2>
          <p className="mt-1 text-sm text-muted">Istorija svih email pokusaja i slanja kroz Resend.</p>
        </div>

        <div>
          <label className="text-sm text-muted">Filter</label>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as LogFilter)}
            className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2 text-sm sm:w-56"
          >
            <option value="all">Svi emailovi</option>
            <option value="booking-submitted">Prijava poslata</option>
            <option value="payment-confirmed">Potvrda uplate</option>
            <option value="admin-notification">Admin obavestenje</option>
            <option value="invoice-sent">Invoice poslata</option>
            <option value="invoice-reminder">Invoice podsetnik</option>
            <option value="teacher-assignment">Dodela predavaca</option>
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[1200px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              <th className="py-3 px-2">Vreme</th>
              <th className="py-3 px-2">Tip</th>
              <th className="py-3 px-2">Roditelj</th>
              <th className="py-3 px-2">Email</th>
              <th className="py-3 px-2">Status</th>
              <th className="py-3 px-2">Subject</th>
              <th className="py-3 px-2">Triggered by</th>
              <th className="py-3 px-2">Resend ID</th>
              <th className="py-3 px-2">Error</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((log) => (
              <tr key={log.id} className="border-b border-line/60 hover:bg-surface-2">
                <td className="py-3 px-2 text-xs">{formatDateTime(log.createdAt)}</td>
                <td className="py-3 px-2 text-xs">{typeLabel(log.type)}</td>
                <td className="py-3 px-2 text-xs">{log.parentName ?? "-"}</td>
                <td className="py-3 px-2 text-xs">{log.parentEmail ?? "-"}</td>
                <td className="py-3 px-2 text-xs">
                  {log.status === "sent" ? (
                    <span className="rounded-full bg-success/20 px-2 py-1 font-medium text-success">sent</span>
                  ) : (
                    <span className="rounded-full bg-warning/20 px-2 py-1 font-medium text-warning">failed</span>
                  )}
                </td>
                <td className="py-3 px-2 text-xs">{log.subject}</td>
                <td className="py-3 px-2 text-xs">
                  {log.triggeredBy}
                  {log.triggeredByEmail ? ` (${log.triggeredByEmail})` : ""}
                </td>
                <td className="py-3 px-2 text-xs">{log.providerMessageId ?? "-"}</td>
                <td className="py-3 px-2 text-xs text-[var(--accent-berry)]">{log.errorMessage ?? "-"}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-4 px-2 text-center text-muted">
                  Nema email zapisa za izabrani filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
