import { Locale } from "@/types/models";

type HeroVariant = "about" | "programs" | "booking" | "contact";

interface PageHeroProps {
  locale: Locale;
  title: string;
  description: string;
  variant: HeroVariant;
}

const variantStyles: Record<
  HeroVariant,
  {
    eyebrowSr: string;
    eyebrowEn: string;
    orbA: string;
    orbB: string;
    iconPath: string;
    iconStroke: string;
    iconBg: string;
  }
> = {
  about: {
    eyebrowSr: "O nama",
    eyebrowEn: "About us",
    orbA: "bg-[color-mix(in_oklab,var(--accent-leaf)_40%,transparent)]",
    orbB: "bg-[color-mix(in_oklab,var(--accent-teal)_28%,transparent)]",
    iconPath: "M12 4v16M4 12h16M7.2 7.2l9.6 9.6M16.8 7.2l-9.6 9.6",
    iconStroke: "text-[var(--accent-leaf)]",
    iconBg: "bg-[color-mix(in_oklab,var(--accent-leaf)_20%,white)]",
  },
  programs: {
    eyebrowSr: "Programi",
    eyebrowEn: "Programs",
    orbA: "bg-[color-mix(in_oklab,var(--accent-sun)_32%,transparent)]",
    orbB: "bg-[color-mix(in_oklab,var(--brand)_26%,transparent)]",
    iconPath: "M4 6h16M4 12h16M4 18h10",
    iconStroke: "text-[var(--accent-sun)]",
    iconBg: "bg-[color-mix(in_oklab,var(--accent-sun)_16%,white)]",
  },
  booking: {
    eyebrowSr: "Prijava",
    eyebrowEn: "Enrollment",
    orbA: "bg-[color-mix(in_oklab,var(--accent-berry)_26%,transparent)]",
    orbB: "bg-[color-mix(in_oklab,var(--accent-sun)_26%,transparent)]",
    iconPath: "M4 8h16M8 4v4M16 4v4M4 12h16M7 16l3 3 6-6",
    iconStroke: "text-[var(--accent-berry)]",
    iconBg: "bg-[color-mix(in_oklab,var(--accent-berry)_16%,white)]",
  },
  contact: {
    eyebrowSr: "Kontakt",
    eyebrowEn: "Contact",
    orbA: "bg-[color-mix(in_oklab,var(--brand)_22%,transparent)]",
    orbB: "bg-[color-mix(in_oklab,var(--accent-teal)_28%,transparent)]",
    iconPath: "M4 7.5h16v9H4zM4 8l8 6 8-6",
    iconStroke: "text-[var(--accent-teal)]",
    iconBg: "bg-[color-mix(in_oklab,var(--accent-teal)_16%,white)]",
  },
};

export function PageHero({ locale, title, description, variant }: PageHeroProps) {
  const style = variantStyles[variant];
  const eyebrow = locale === "sr" ? style.eyebrowSr : style.eyebrowEn;
  const titleWidthClass = locale === "sr" ? "max-w-[15ch]" : "max-w-[17ch]";
  const descWidthClass = locale === "sr" ? "max-w-[50ch]" : "max-w-[58ch]";

  return (
    <section className="relative overflow-hidden rounded-3xl border border-line bg-white px-5 py-8 shadow-[var(--shadow)] sm:px-8 sm:py-10 md:px-10 max-[375px]:rounded-2xl max-[375px]:px-4 max-[375px]:py-6">
      <div className="relative z-10 flex flex-col gap-4">
        <span className="inline-flex w-fit rounded-full border border-line bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-2)]">
          {eyebrow}
        </span>
        <h1 className={`text-[2.2rem] leading-[0.96] text-[var(--brand-2)] sm:text-5xl md:text-6xl ${titleWidthClass}`}>
          {title}
        </h1>
        <p className={`text-[15px] leading-relaxed text-[var(--muted)] sm:text-lg ${descWidthClass}`}>
          {description}
        </p>
      </div>

      <div className={`pointer-events-none absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-xl border border-line/80 shadow-sm sm:right-4 sm:top-4 sm:h-12 sm:w-12 sm:rounded-2xl ${style.iconBg}`}>
        <svg viewBox="0 0 24 24" fill="none" className={`h-5 w-5 sm:h-6 sm:w-6 ${style.iconStroke}`}>
          <path d={style.iconPath} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className={`pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl ${style.orbA}`} />
      <div className={`pointer-events-none absolute -bottom-16 left-12 h-44 w-44 rounded-full blur-3xl ${style.orbB}`} />
    </section>
  );
}
