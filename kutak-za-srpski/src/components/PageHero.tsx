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
  }
> = {
  about: {
    eyebrowSr: "O nama",
    eyebrowEn: "About us",
    orbA: "bg-[color-mix(in_oklab,var(--accent-leaf)_40%,transparent)]",
    orbB: "bg-[color-mix(in_oklab,var(--accent-teal)_28%,transparent)]",
  },
  programs: {
    eyebrowSr: "Programi",
    eyebrowEn: "Programs",
    orbA: "bg-[color-mix(in_oklab,var(--accent-sun)_32%,transparent)]",
    orbB: "bg-[color-mix(in_oklab,var(--brand)_26%,transparent)]",
  },
  booking: {
    eyebrowSr: "Prijava",
    eyebrowEn: "Enrollment",
    orbA: "bg-[color-mix(in_oklab,var(--accent-berry)_26%,transparent)]",
    orbB: "bg-[color-mix(in_oklab,var(--accent-sun)_26%,transparent)]",
  },
  contact: {
    eyebrowSr: "Kontakt",
    eyebrowEn: "Contact",
    orbA: "bg-[color-mix(in_oklab,var(--brand)_22%,transparent)]",
    orbB: "bg-[color-mix(in_oklab,var(--accent-teal)_28%,transparent)]",
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

      <div className={`pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full blur-3xl ${style.orbA}`} />
      <div className={`pointer-events-none absolute -bottom-16 left-12 h-44 w-44 rounded-full blur-3xl ${style.orbB}`} />
    </section>
  );
}
