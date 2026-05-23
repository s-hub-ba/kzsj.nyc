import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-8 shadow-[var(--shadow)] md:p-14">
      <div className="animate-rise relative z-10 max-w-3xl">
        <span className="mb-5 inline-flex rounded-full border border-line bg-[var(--surface-2)] px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-2)]">
          {t("eyebrow")}
        </span>
        <h1 className="text-5xl leading-[0.94] text-[var(--brand-2)] md:text-7xl">{t("title")}</h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--muted)] md:text-xl">{t("subtitle")}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/booking"
            className="animate-pulse-glow rounded-full bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-2)]"
          >
            {t("primaryCta")}
          </Link>
          <Link
            href="/programs"
            className="rounded-full border border-line bg-white px-6 py-3 text-sm font-semibold text-[var(--brand-2)] transition hover:bg-[var(--surface-2)]"
          >
            {t("secondaryCta")}
          </Link>
        </div>
      </div>

      <div className="pointer-events-none absolute right-10 top-8 z-0 hidden h-36 w-36 rounded-[2rem] border border-white/40 bg-[linear-gradient(135deg,var(--accent-sun),var(--accent-berry))] opacity-85 shadow-2xl md:block" />
      <div className="animate-float-slow pointer-events-none absolute bottom-8 right-56 z-0 hidden h-20 w-20 rounded-full border-8 border-[var(--accent-teal)]/80 bg-white md:block" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[color-mix(in_oklab,var(--accent-leaf)_35%,transparent)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-[color-mix(in_oklab,var(--accent-teal)_28%,transparent)] blur-3xl" />
    </section>
  );
}
