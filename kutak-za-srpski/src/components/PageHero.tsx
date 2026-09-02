import { Locale } from "@/types/models";

type HeroVariant = "about" | "programs" | "booking" | "contact" | "faq" | "careers";

interface PageHeroProps {
  locale: Locale;
  title: string;
  description: string;
  variant: HeroVariant;
  eyebrowOverride?: string;
  titleWidthOverride?: string;
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
  careers: {
    eyebrowSr: "Posao",
    eyebrowEn: "Careers",
    orbA: "bg-[color-mix(in_oklab,var(--brand)_20%,transparent)]",
    orbB: "bg-[color-mix(in_oklab,var(--accent-sun)_24%,transparent)]",
    iconPath: "M4 7.5h16v9H4zM7 7.5V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.5M4 12h16",
    iconStroke: "text-[var(--brand-2)]",
    iconBg: "bg-[color-mix(in_oklab,var(--brand)_12%,white)]",
  },
  faq: {
    eyebrowSr: "",
    eyebrowEn: "",
    orbA: "bg-[color-mix(in_oklab,var(--brand)_22%,transparent)]",
    orbB: "bg-[color-mix(in_oklab,var(--accent-teal)_28%,transparent)]",
    iconPath: "M12 18h.01M9.09 9a3 3 0 1 1 5.83 1c0 2-3 2.5-3 4.5",
    iconStroke: "text-[var(--brand-2)]",
    iconBg: "bg-[color-mix(in_oklab,var(--brand)_12%,white)]",
  },
};

export function PageHero({ locale, title, description, variant, eyebrowOverride, titleWidthOverride }: PageHeroProps) {
  const style = variantStyles[variant];
  const eyebrow = locale === "sr" ? style.eyebrowSr : style.eyebrowEn;
  const eyebrowText = eyebrowOverride ?? eyebrow;
  const isCareers = variant === "careers";
  const titleWidthClass =
    titleWidthOverride ??
    isCareers
      ? locale === "sr"
        ? "max-w-[28ch] sm:max-w-[24ch] md:max-w-none"
        : "max-w-[30ch] sm:max-w-[26ch] md:max-w-none"
      : locale === "sr"
        ? "max-w-[15ch]"
        : "max-w-[17ch]";
  const descWidthClass = isCareers ? (locale === "sr" ? "max-w-[44ch]" : "max-w-[50ch]") : locale === "sr" ? "max-w-[75ch]" : "max-w-[85ch]";
  const contentOffsetClass = variant === "about" ? "pt-2 sm:pt-3" : "";
  const descriptionSpacingClass = variant === "about" ? "mt-1 sm:mt-2" : "";
  const heroPaddingClass = isCareers
    ? "px-5 py-6 sm:px-8 sm:py-8 md:px-10"
    : "px-5 py-8 sm:px-8 sm:py-10 md:px-10";
  const contentGapClass = isCareers ? "gap-3" : "gap-4";
  const titleClass = isCareers
    ? "text-[2rem] leading-[0.98] text-[var(--brand-2)] sm:text-[3.2rem] md:text-[4rem]"
    : "text-[2.2rem] leading-[0.96] text-[var(--brand-2)] sm:text-5xl md:text-6xl";
  const descClass = isCareers
    ? "text-[14px] leading-relaxed text-[var(--muted)] sm:text-[16px]"
    : "text-[15px] leading-relaxed text-[var(--muted)] sm:text-lg";
  const iconSizeClass = isCareers
    ? "right-3 top-3 h-9 w-9 rounded-xl sm:right-4 sm:top-4 sm:h-10 sm:w-10 sm:rounded-xl"
    : "right-3 top-3 h-10 w-10 rounded-xl sm:right-4 sm:top-4 sm:h-12 sm:w-12 sm:rounded-2xl";
  const iconSvgClass = isCareers ? "h-4.5 w-4.5 sm:h-5 sm:w-5" : "h-5 w-5 sm:h-6 sm:w-6";
  const orbAClass = isCareers ? "-right-20 -top-20 h-44 w-44 opacity-55" : "-right-16 -top-16 h-52 w-52";
  const orbBClass = isCareers ? "-bottom-20 left-10 h-36 w-36 opacity-50" : "-bottom-16 left-12 h-44 w-44";

  return (
    <section className={`relative overflow-hidden rounded-3xl border border-line bg-white shadow-[var(--shadow)] ${heroPaddingClass} max-[375px]:rounded-2xl max-[375px]:px-4 max-[375px]:py-6`}>
      <div className={`relative z-10 flex flex-col ${contentGapClass} ${contentOffsetClass}`}>
        {eyebrowText ? (
          <span className="inline-flex w-fit rounded-full border border-line bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--brand-2)]">
            {eyebrowText}
          </span>
        ) : null}
        <h1 className={`${titleClass} ${titleWidthClass}`}>
          {title}
        </h1>
        <p className={`${descClass} ${descWidthClass} ${descriptionSpacingClass}`}>
          {description}
        </p>
      </div>

      <div className={`pointer-events-none absolute flex items-center justify-center border border-line/80 shadow-sm ${iconSizeClass} ${style.iconBg}`}>
        <svg viewBox="0 0 24 24" fill="none" className={`${iconSvgClass} ${style.iconStroke}`}>
          <path d={style.iconPath} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className={`pointer-events-none absolute rounded-full blur-3xl ${style.orbA} ${orbAClass}`} />
      <div className={`pointer-events-none absolute rounded-full blur-3xl ${style.orbB} ${orbBClass}`} />
    </section>
  );
}
