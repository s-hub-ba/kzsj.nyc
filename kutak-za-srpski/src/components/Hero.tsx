import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-line bg-surface p-8 shadow-[var(--shadow)] md:p-14">
      <div className="animate-rise relative z-10 max-w-3xl">
        <span className="mb-4 inline-flex rounded-full bg-surface-2 px-4 py-1 text-xs uppercase tracking-[0.2em] text-brand-2">
          {t("eyebrow")}
        </span>
        <h1 className="text-5xl leading-tight text-text md:text-7xl">{t("title")}</h1>
        <p className="mt-6 max-w-2xl text-lg text-muted md:text-xl">{t("subtitle")}</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/booking"
            className="animate-pulse-glow rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-2"
          >
            {t("primaryCta")}
          </Link>
          <Link
            href="/programs"
            className="rounded-full border border-line bg-surface px-6 py-3 text-sm font-semibold text-text transition hover:bg-surface-2"
          >
            {t("secondaryCta")}
          </Link>
        </div>
      </div>
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#f6ddc2] blur-2xl" />
      <div className="pointer-events-none absolute -bottom-16 left-24 h-48 w-48 rounded-full bg-[#f1cda8] blur-2xl" />
    </section>
  );
}
