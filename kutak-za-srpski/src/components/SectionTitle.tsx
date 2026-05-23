interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  locale?: "sr" | "en";
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
  locale,
}: SectionTitleProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";
  const titleWidthClass = locale === "sr" ? "max-w-[15ch]" : locale === "en" ? "max-w-[18ch]" : "max-w-[17ch]";
  const descriptionWidthClass =
    locale === "sr" ? "max-w-[50ch]" : locale === "en" ? "max-w-[58ch]" : "max-w-2xl";

  return (
    <div className={`flex flex-col gap-4 ${alignClass}`}>
      {eyebrow ? (
        <span className="inline-flex rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-2)]">
          {eyebrow}
        </span>
      ) : null}
      <h2 className={`text-4xl leading-[0.98] text-[var(--brand-2)] max-[375px]:text-3xl md:text-6xl ${titleWidthClass}`}>
        {title}
      </h2>
      {description ? (
        <p className={`text-[var(--muted)] max-[375px]:text-[15px] md:text-lg ${descriptionWidthClass}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
