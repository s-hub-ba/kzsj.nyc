import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-8 md:p-14 max-[375px]:rounded-2xl max-[375px]:p-4">
      <div className="relative z-10 grid gap-7 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="animate-rise max-w-3xl">
          <span className="mb-4 inline-flex rounded-full border border-line bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-2)] sm:mb-5 sm:px-4 sm:py-1.5 sm:text-xs">
            {t("eyebrow")}
          </span>
          <h1 className="text-[2.2rem] leading-[0.93] text-[var(--brand-2)] sm:text-5xl md:text-7xl">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-[15px] text-[var(--muted)] sm:mt-6 sm:text-lg md:text-xl">{t("subtitle")}</p>
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">
            <Link href="/booking" className="btn-primary animate-pulse-glow w-full sm:w-auto">
              {t("primaryCta")}
            </Link>
            <Link href="/programs" className="btn-secondary w-full sm:w-auto">
              {t("secondaryCta")}
            </Link>
          </div>
        </div>

        <div className="relative hidden lg:block">
          <div className="animate-float-slow relative mx-auto h-[340px] w-[340px] overflow-hidden rounded-[2.2rem] border border-line bg-white p-4 shadow-[0_24px_52px_-30px_rgba(21,50,80,0.45)]">
            <div className="relative h-full w-full overflow-hidden rounded-[1.8rem] bg-[var(--surface-2)]">
              <Image
                src="/Logo.jpeg"
                alt="Kutak za srpski logo"
                fill
                sizes="340px"
                className="object-contain p-6"
                priority
              />
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute right-10 top-8 z-0 hidden h-36 w-36 rounded-[2rem] border border-white/40 bg-[linear-gradient(135deg,var(--accent-sun),var(--accent-berry))] opacity-85 shadow-2xl md:block" />
      <div className="animate-float-slow pointer-events-none absolute bottom-8 right-56 z-0 hidden h-20 w-20 rounded-full border-8 border-[var(--accent-teal)]/80 bg-white md:block" />
      <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[color-mix(in_oklab,var(--accent-leaf)_35%,transparent)] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-[color-mix(in_oklab,var(--accent-teal)_28%,transparent)] blur-3xl" />
    </section>
  );
}
