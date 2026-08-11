// Shared age-group utilities used by BookingForm and program pages.
// Actual program content (title, description) is managed in the admin panel under "Časovi".

export function parseAgeRange(value: string): { min: number; max: number } | null {
  const matches = value.match(/\d+/g);
  if (!matches || matches.length === 0) return null;
  const min = Number(matches[0]);
  const max = Number(matches[matches.length > 1 ? 1 : 0]);
  if (Number.isNaN(min) || Number.isNaN(max)) return null;
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

export function toCanonicalAgeGroup(value: string): string {
  const parsed = parseAgeRange(value);
  if (!parsed) return value.replace(/\s+/g, "").replace(/[–—]/g, "-").toLowerCase();
  return `${parsed.min}-${parsed.max}`;
}

export function formatAgeGroupLabel(value: string, locale: "sr" | "en"): string {
  const parsed = parseAgeRange(value);
  if (!parsed) return value.trim();
  return locale === "sr"
    ? `${parsed.min}–${parsed.max} godina`
    : `${parsed.min}–${parsed.max} years`;
}

