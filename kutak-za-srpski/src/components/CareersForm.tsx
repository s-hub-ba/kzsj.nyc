"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { submitJobApplication, uploadJobApplicationCv } from "@/lib/firestore";
import { EmploymentType, Locale } from "@/types/models";

const MAX_CV_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_CV_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function CareersForm() {
  const t = useTranslations("careers.form");
  const locale = useLocale() as Locale;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
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

    if (!cvFile) {
      setError(t("cvRequired"));
      return;
    }

    if (!ALLOWED_CV_TYPES.has(cvFile.type)) {
      setError(t("cvInvalidType"));
      return;
    }

    if (cvFile.size > MAX_CV_SIZE_BYTES) {
      setError(t("cvTooLarge"));
      return;
    }

    try {
      setLoading(true);
      const uploadedCv = await uploadJobApplicationCv(cvFile);
      await submitJobApplication({
        ...form,
        cvFileName: uploadedCv.fileName,
        cvFileUrl: uploadedCv.fileUrl,
        cvStoragePath: uploadedCv.storagePath,
        cvContentType: uploadedCv.contentType,
        cvFileSize: uploadedCv.fileSize,
        preferredLanguage: locale,
      });
      setSuccess(t("success"));
      setCvFile(null);
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

        <label className="text-sm text-[var(--muted)] md:col-span-2">
          {t("cv")}
          <input
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            onChange={(event) => setCvFile(event.target.files?.[0] ?? null)}
            className="mt-1 block w-full rounded-xl border border-line bg-[var(--surface-2)] px-3 py-2 text-sm outline-none transition file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--brand)] file:px-3 file:py-2 file:text-white focus:border-[var(--brand)] focus:bg-white"
          />
          <p className="mt-2 text-xs text-[var(--muted)]">{t("cvHint")}</p>
          {cvFile ? <p className="mt-2 text-xs text-[var(--muted)]">{cvFile.name}</p> : null}
        </label>

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
