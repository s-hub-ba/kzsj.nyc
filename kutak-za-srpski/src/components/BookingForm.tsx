"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createBooking, getActiveClasses, getActiveTerms, subscribeToNewsletter } from "@/lib/firestore";
import { FloatingInput } from "@/components/FloatingInput";
import { ClassType, Locale, SchoolClass, Term } from "@/types/models";

const GROUP_TERM_PATTERN = /\b(grupa|group)\b/i;

function isGroupTerm(term: Term) {
  return GROUP_TERM_PATTERN.test(term.title_sr) || GROUP_TERM_PATTERN.test(term.title_en);
}

function sortTermsBySchedule(items: Term[]) {
  return [...items].sort((a, b) => {
    const dateCompare = (a.date || "").localeCompare(b.date || "");
    if (dateCompare !== 0) return dateCompare;
    return (a.startTime || "").localeCompare(b.startTime || "");
  });
}

function selectTermsForType(classTerms: Term[], bookingType: ClassType) {
  const sorted = sortTermsBySchedule(classTerms);

  if (bookingType === "semester") {
    const groupTerms = sorted.filter(isGroupTerm);
    return groupTerms.length > 0 ? groupTerms : sorted;
  }

  const singleTerms = sorted.filter((term) => !isGroupTerm(term));
  return singleTerms.length > 0 ? singleTerms : sorted;
}

function parseAgeRange(value: string) {
  const matches = value.match(/\d+/g);
  if (!matches || matches.length === 0) return null;

  const min = Number(matches[0]);
  const max = Number(matches[matches.length > 1 ? 1 : 0]);

  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

function parseChildAge(value: string) {
  const match = value.trim().match(/\d+(?:[.,]\d+)?/);
  if (!match) return null;
  const normalized = match[0].replace(",", ".");
  const parsed = Number(normalized);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeAgeGroup(value: string) {
  return value.replace(/\s+/g, "").replace(/[–—]/g, "-").toLowerCase();
}

function toCanonicalAgeGroup(value: string) {
  const parsed = parseAgeRange(value);
  if (!parsed) return normalizeAgeGroup(value);
  return `${parsed.min}-${parsed.max}`;
}

function formatAgeGroupLabel(value: string, locale: Locale) {
  const parsed = parseAgeRange(value);
  if (!parsed) return value.trim();
  return locale === "sr" ? `${parsed.min}-${parsed.max} godina` : `${parsed.min}-${parsed.max} years`;
}

function getDistanceToAgeRange(age: number, range: { min: number; max: number }) {
  if (age < range.min) return range.min - age;
  if (age > range.max) return age - range.max;
  return 0;
}

export function BookingForm() {
  const t = useTranslations("booking.form");
  const locale = useLocale() as Locale;

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [showClosestPrograms, setShowClosestPrograms] = useState(false);

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
    newsletterOptIn: false,
  });

  useEffect(() => {
    const loadData = async () => {
      const [fetchedClasses, fetchedTerms] = await Promise.all([
        getActiveClasses(),
        getActiveTerms(),
      ]);
      setClasses(fetchedClasses);
      setTerms(fetchedTerms);
    };

    void loadData();
  }, []);

  const filteredTerms = useMemo(() => {
    const classTerms = terms.filter((term) => term.classId === form.selectedClassId);
    return selectTermsForType(classTerms, form.bookingType);
  }, [terms, form.selectedClassId, form.bookingType]);

  const parsedChildAge = useMemo(() => parseChildAge(form.childAge), [form.childAge]);

  const inferredAgeGroups = useMemo(() => {
    if (parsedChildAge === null) {
      return [] as { value: string; label: string }[];
    }

    const grouped = new Map<string, string>();

    classes.forEach((item) => {
      if (!item.ageGroup) return;
      const range = parseAgeRange(item.ageGroup);
      if (!range) return;
      if (parsedChildAge < range.min || parsedChildAge > range.max) return;

      const key = toCanonicalAgeGroup(item.ageGroup);
      if (!grouped.has(key)) {
        grouped.set(key, item.ageGroup);
      }
    });

    return Array.from(grouped.entries()).map(([value, rawValue]) => ({
      value,
      label: formatAgeGroupLabel(rawValue, locale),
    }));
  }, [classes, locale, parsedChildAge]);

  const classesForAgeGroup = useMemo(() => {
    if (parsedChildAge === null) return [];

    const inferredKeys = new Set(inferredAgeGroups.map((group) => group.value));
    return classes.filter((item) => inferredKeys.has(toCanonicalAgeGroup(item.ageGroup)));
  }, [classes, inferredAgeGroups, parsedChildAge]);

  const closestClasses = useMemo(() => {
    if (parsedChildAge === null) return [] as SchoolClass[];

    return [...classes]
      .map((item) => {
        const range = parseAgeRange(item.ageGroup);
        if (!range) return null;
        return {
          item,
          distance: getDistanceToAgeRange(parsedChildAge, range),
          bookingTypeScore: item.type === form.bookingType ? 0 : 1,
        };
      })
      .filter((entry): entry is { item: SchoolClass; distance: number; bookingTypeScore: number } => entry !== null)
      .sort((a, b) => {
        if (a.distance !== b.distance) return a.distance - b.distance;
        return a.bookingTypeScore - b.bookingTypeScore;
      })
      .slice(0, 4)
      .map((entry) => entry.item);
  }, [classes, parsedChildAge, form.bookingType]);

  const classesToDisplay = useMemo(() => {
    if (classesForAgeGroup.length > 0) return classesForAgeGroup;
    if (showClosestPrograms) return closestClasses;
    return [] as SchoolClass[];
  }, [classesForAgeGroup, showClosestPrograms, closestClasses]);

  const recommendedClass = useMemo(() => {
    const childAge = parseChildAge(form.childAge);
    if (childAge === null) return null;

    const inRange = classes.filter((item) => {
      const range = parseAgeRange(item.ageGroup);
      if (!range) return false;
      return childAge >= range.min && childAge <= range.max;
    });

    if (inRange.length === 0) return null;
    const byType = inRange.find((item) => item.type === form.bookingType);
    return byType ?? inRange[0];
  }, [classes, form.childAge, form.bookingType]);

  const recommendationMessage = useMemo(() => {
    const childAge = parseChildAge(form.childAge);
    if (!form.childAge.trim()) return "";
    if (childAge === null) return t("ageRecommendationInvalid");
    if (!recommendedClass) return t("ageRecommendationNone");

    const programName = locale === "sr" ? recommendedClass.title_sr : recommendedClass.title_en;
    return t("ageRecommendationFound", {
      age: childAge,
      program: programName,
    });
  }, [form.childAge, recommendedClass, t, locale]);

  useEffect(() => {
    setShowClosestPrograms(false);
  }, [form.childAge]);

  useEffect(() => {
    if (classesToDisplay.length === 0) {
      setForm((prev) => ({ ...prev, selectedClassId: "", selectedTermId: "" }));
      return;
    }

    const stillValid = classesToDisplay.some((item) => item.id === form.selectedClassId);
    if (!stillValid) {
      const nextClass = classesToDisplay[0];
      const classTerms = terms.filter((term) => term.classId === nextClass.id);
      const termsForType = selectTermsForType(classTerms, form.bookingType);
      setForm((prev) => ({
        ...prev,
        selectedClassId: nextClass.id,
        selectedTermId: termsForType[0]?.id ?? "",
      }));
    }
  }, [classesToDisplay, form.selectedClassId, terms, form.bookingType]);

  useEffect(() => {
    if (!filteredTerms.some((term) => term.id === form.selectedTermId)) {
      setForm((prev) => ({
        ...prev,
        selectedTermId: filteredTerms[0]?.id ?? "",
      }));
    }
  }, [filteredTerms, form.selectedTermId]);

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
      const { newsletterOptIn, ...bookingInput } = form;
      await createBooking({
        ...bookingInput,
        preferredLanguage: locale,
      });

      if (form.newsletterOptIn) {
        await subscribeToNewsletter(form.parentEmail, locale, "booking-opt-in");
      }

      setSuccess(t("success"));
      setForm((prev) => ({
        ...prev,
        parentName: "",
        parentEmail: "",
        parentPhone: "",
        childName: "",
        childAge: "",
        message: "",
        newsletterOptIn: false,
      }));
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : t("error");
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-line bg-white p-4 shadow-[var(--shadow)] sm:p-6 md:p-8 max-[375px]:rounded-2xl">
      <div className="grid gap-4 md:grid-cols-2">
        <FloatingInput
          label={t("parentName")}
          value={form.parentName}
          onChange={(e) => setForm((prev) => ({ ...prev, parentName: e.target.value }))}
        />

        <FloatingInput
          type="email"
          label={t("parentEmail")}
          value={form.parentEmail}
          onChange={(e) => setForm((prev) => ({ ...prev, parentEmail: e.target.value }))}
        />

        <FloatingInput
          label={t("parentPhone")}
          value={form.parentPhone}
          onChange={(e) => setForm((prev) => ({ ...prev, parentPhone: e.target.value }))}
        />

        <FloatingInput
          label={t("childName")}
          value={form.childName}
          onChange={(e) => setForm((prev) => ({ ...prev, childName: e.target.value }))}
        />

        <div>
          <FloatingInput
            label={t("childAge")}
            value={form.childAge}
            onChange={(e) => setForm((prev) => ({ ...prev, childAge: e.target.value }))}
          />
          {recommendationMessage ? (
            <div className="mt-2 rounded-xl border border-line bg-white px-3 py-2 text-xs text-[var(--muted)]">
              <p>
                <span className="font-semibold text-foreground">{t("ageRecommendationTitle")}: </span>
                {recommendationMessage}
              </p>
            </div>
          ) : null}
        </div>

        <label className="text-sm text-[var(--muted)]">
          {t("class")}
          {form.childAge.trim() && parsedChildAge !== null && inferredAgeGroups.length > 0 ? (
            <p className="mt-2 rounded-xl border border-line bg-white px-3 py-2 text-xs text-[var(--muted)]">
              {t("ageGroupAutoDetected", {
                groups: inferredAgeGroups.map((group) => group.label).join(", "),
              })}
            </p>
          ) : null}

          <p className="mt-2 text-xs text-[var(--muted)]">
            {!form.childAge.trim()
              ? t("programCardsAwaitingAge")
              : parsedChildAge === null
                ? t("ageRecommendationInvalid")
                : t("programCardsHelpAuto")}
          </p>

          <div className="mt-2 grid gap-2">
            {classesToDisplay.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  const classTerms = terms.filter((term) => term.classId === item.id);
                  const termsForType = selectTermsForType(classTerms, form.bookingType);
                  setForm((prev) => ({
                    ...prev,
                    selectedClassId: item.id,
                    selectedTermId: termsForType[0]?.id ?? "",
                  }));
                }}
                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                  form.selectedClassId === item.id
                    ? "border-[var(--brand)] bg-[var(--surface-2)]"
                    : "border-line bg-white hover:bg-[var(--surface-2)]"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">
                    {locale === "sr" ? item.title_sr : item.title_en}
                  </p>
                  <span className="text-xs text-[var(--muted)]">{item.level}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">
                  {locale === "sr" ? item.description_sr : item.description_en}
                </p>
              </button>
            ))}
          </div>

          {form.childAge.trim() && parsedChildAge !== null && classesForAgeGroup.length === 0 ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs text-[var(--muted)]">{t("noProgramsForAgeGroup")}</p>
              {!showClosestPrograms ? (
                <button
                  type="button"
                  onClick={() => setShowClosestPrograms(true)}
                  className="rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-foreground transition hover:bg-[var(--surface-2)]"
                >
                  {t("showClosestPrograms")}
                </button>
              ) : (
                <p className="text-xs text-[var(--muted)]">{t("closestProgramsShown")}</p>
              )}
            </div>
          ) : null}

        </label>

        <label className="text-sm text-[var(--muted)]">
          {t("bookingType")}
          <select
            value={form.bookingType}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bookingType: e.target.value as ClassType }))
            }
            className="mt-1 w-full rounded-xl border border-line bg-[var(--surface-2)] px-3 py-2 outline-none transition focus:border-[var(--brand)] focus:bg-white"
          >
            <option value="single">{t("single")}</option>
            <option value="semester">{t("semester")}</option>
          </select>
          <p className="mt-2 text-xs text-[var(--muted)]">
            {form.bookingType === "semester" ? t("typeHelpSemester") : t("typeHelpSingle")}
          </p>
        </label>

        <label className="text-sm text-[var(--muted)] md:col-span-2">
          {form.bookingType === "semester" ? t("group") : t("term")}
          <select
            value={form.selectedTermId}
            onChange={(e) => setForm((prev) => ({ ...prev, selectedTermId: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-line bg-[var(--surface-2)] px-3 py-2 outline-none transition focus:border-[var(--brand)] focus:bg-white"
          >
            {filteredTerms.map((term) => (
              <option key={term.id} value={term.id}>
                {form.bookingType === "semester"
                  ? locale === "sr"
                    ? term.title_sr
                    : term.title_en
                  : `${locale === "sr" ? term.title_sr : term.title_en} | ${term.date} | ${term.startTime}`}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm text-[var(--muted)] md:col-span-2">
          {t("message")}
          <textarea
            value={form.message}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            rows={4}
            className="mt-1 w-full rounded-xl border border-line bg-[var(--surface-2)] px-3 py-2 outline-none transition focus:border-[var(--brand)] focus:bg-white"
          />
        </label>

        <label className="flex items-start gap-3 rounded-2xl border border-line bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--muted)] md:col-span-2">
          <input
            type="checkbox"
            checked={form.newsletterOptIn}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                newsletterOptIn: e.target.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 rounded border-line"
          />
          <span>{t("newsletterOptIn")}</span>
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
