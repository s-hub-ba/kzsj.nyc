"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createBooking, getActiveClasses, getActiveTerms } from "@/lib/firestore";
import { ClassType, Locale, SchoolClass, Term } from "@/types/models";

export function BookingForm() {
  const t = useTranslations("booking.form");
  const locale = useLocale() as Locale;

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");

  const [form, setForm] = useState({
    parentName: "",
    parentEmail: "",
    parentPhone: "",
    childName: "",
    childAge: "",
    selectedClassId: "",
    selectedTermId: "",
    bookingType: "single" as ClassType,
    message: "",
  });

  useEffect(() => {
    const loadData = async () => {
      const [fetchedClasses, fetchedTerms] = await Promise.all([
        getActiveClasses(),
        getActiveTerms(),
      ]);
      setClasses(fetchedClasses);
      setTerms(fetchedTerms);
      if (fetchedClasses[0]) {
        const firstClassId = fetchedClasses[0].id;
        const firstTerm = fetchedTerms.find((term) => term.classId === firstClassId);

        setForm((prev) => ({
          ...prev,
          selectedClassId: prev.selectedClassId || firstClassId,
          selectedTermId: prev.selectedTermId || firstTerm?.id || "",
        }));
      }
    };

    void loadData();
  }, []);

  const filteredTerms = useMemo(
    () => terms.filter((term) => term.classId === form.selectedClassId),
    [terms, form.selectedClassId],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (
      !form.parentName ||
      !form.parentEmail ||
      !form.parentPhone ||
      !form.childName ||
      !form.childAge ||
      !form.selectedClassId ||
      !form.selectedTermId
    ) {
      setError(t("required"));
      return;
    }

    try {
      setLoading(true);
      await createBooking({
        ...form,
        preferredLanguage: locale,
      });

      setSuccess(t("success"));
      setForm((prev) => ({
        ...prev,
        parentName: "",
        parentEmail: "",
        parentPhone: "",
        childName: "",
        childAge: "",
        message: "",
      }));
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : t("error");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow)] md:p-8">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm text-muted">
          {t("parentName")}
          <input
            value={form.parentName}
            onChange={(e) => setForm((prev) => ({ ...prev, parentName: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-brand"
          />
        </label>

        <label className="text-sm text-muted">
          {t("parentEmail")}
          <input
            type="email"
            value={form.parentEmail}
            onChange={(e) => setForm((prev) => ({ ...prev, parentEmail: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-brand"
          />
        </label>

        <label className="text-sm text-muted">
          {t("parentPhone")}
          <input
            value={form.parentPhone}
            onChange={(e) => setForm((prev) => ({ ...prev, parentPhone: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-brand"
          />
        </label>

        <label className="text-sm text-muted">
          {t("childName")}
          <input
            value={form.childName}
            onChange={(e) => setForm((prev) => ({ ...prev, childName: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-brand"
          />
        </label>

        <label className="text-sm text-muted">
          {t("childAge")}
          <input
            value={form.childAge}
            onChange={(e) => setForm((prev) => ({ ...prev, childAge: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-brand"
          />
        </label>

        <label className="text-sm text-muted">
          {t("class")}
          <select
            value={form.selectedClassId}
            onChange={(e) => {
              const selectedClassId = e.target.value;
              const firstTermForClass = terms.find((term) => term.classId === selectedClassId);
              setForm((prev) => ({
                ...prev,
                selectedClassId,
                selectedTermId: firstTermForClass?.id ?? "",
              }));
            }}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-brand"
          >
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {locale === "sr" ? item.title_sr : item.title_en}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-muted">
          {t("bookingType")}
          <select
            value={form.bookingType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bookingType: e.target.value as ClassType }))
            }
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-brand"
          >
            <option value="single">{t("single")}</option>
            <option value="semester">{t("semester")}</option>
          </select>
        </label>

        <label className="text-sm text-muted md:col-span-2">
          {t("term")}
          <select
            value={form.selectedTermId}
            onChange={(e) => setForm((prev) => ({ ...prev, selectedTermId: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-brand"
          >
            {filteredTerms.map((term) => (
              <option key={term.id} value={term.id}>
                {locale === "sr" ? term.title_sr : term.title_en} | {term.date} | {term.startTime}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-muted md:col-span-2">
          {t("message")}
          <textarea
            value={form.message}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            rows={4}
            className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-brand"
          />
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {success ? <p className="mt-4 text-sm text-green-700">{success}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-2 disabled:opacity-70"
      >
        {loading ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
