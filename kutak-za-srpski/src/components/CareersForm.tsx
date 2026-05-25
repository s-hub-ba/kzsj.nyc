"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitJobApplication } from "@/lib/firestore";
import { EmploymentType, Locale } from "@/types/models";

export function CareersForm() {
  const t = useTranslations("careers.form");
  const locale = useLocale() as Locale;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    employmentType: "part-time" as EmploymentType,
    experienceSummary: "",
    message: "",
  });

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!form.fullName || !form.email || !form.phone || !form.experienceSummary) {
      setError(t("required"));
      return;
    }

    try {
      setLoading(true);
      await submitJobApplication({
        ...form,
        preferredLanguage: locale,
      });
      setSuccess(t("success"));
      setForm({
        fullName: "",
        email: "",
        phone: "",
        employmentType: "part-time",
        experienceSummary: "",
        message: "",
      });
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-7">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-[var(--muted)] md:col-span-2">
          {t("fullName")}
          <input
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-line bg-[var(--surface-2)] px-3 py-2 outline-none transition focus:border-[var(--brand)] focus:bg-white"
          />
        </label>

        <label className="text-sm text-[var(--muted)]">
          {t("email")}
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-line bg-[var(--surface-2)] px-3 py-2 outline-none transition focus:border-[var(--brand)] focus:bg-white"
          />
        </label>

        <label className="text-sm text-[var(--muted)]">
          {t("phone")}
          <input
            value={form.phone}
            onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-line bg-[var(--surface-2)] px-3 py-2 outline-none transition focus:border-[var(--brand)] focus:bg-white"
          />
        </label>

        <label className="text-sm text-[var(--muted)] md:col-span-2">
          {t("employmentType")}
          <select
            value={form.employmentType}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, employmentType: event.target.value as EmploymentType }))
            }
            className="mt-1 w-full rounded-xl border border-line bg-[var(--surface-2)] px-3 py-2 outline-none transition focus:border-[var(--brand)] focus:bg-white"
          >
            <option value="full-time">{t("fullTime")}</option>
            <option value="part-time">{t("partTime")}</option>
            <option value="both">{t("both")}</option>
          </select>
        </label>

        <label className="text-sm text-[var(--muted)] md:col-span-2">
          {t("experienceSummary")}
          <textarea
            rows={4}
            value={form.experienceSummary}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, experienceSummary: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-line bg-[var(--surface-2)] px-3 py-2 outline-none transition focus:border-[var(--brand)] focus:bg-white"
          />
        </label>

        <p className="rounded-xl border border-line bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--muted)] md:col-span-2">
          {t("cvLaterNotice")}
        </p>

        <label className="text-sm text-[var(--muted)] md:col-span-2">
          {t("message")}
          <textarea
            rows={4}
            value={form.message}
            onChange={(event) => setForm((prev) => ({ ...prev, message: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-line bg-[var(--surface-2)] px-3 py-2 outline-none transition focus:border-[var(--brand)] focus:bg-white"
          />
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-[var(--accent-berry)]">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-[color-mix(in_oklab,var(--accent-leaf)_58%,#1f6f2f)]">{success}</p> : null}

      <button type="submit" disabled={loading} className="btn-primary mt-6 w-full sm:w-auto disabled:opacity-70">
        {loading ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
