interface SectionTitleProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "left",
}: SectionTitleProps) {
  const alignClass = align === "center" ? "text-center items-center" : "text-left items-start";

  return (
    <div className={`flex flex-col gap-4 ${alignClass}`}>
      {eyebrow ? (
        <span className="inline-flex rounded-full border border-line bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-2)]">
          {eyebrow}
        </span>
      ) : null}
      <h2 className="text-4xl leading-[0.98] text-[var(--brand-2)] md:text-6xl">{title}</h2>
      {description ? <p className="max-w-2xl text-[var(--muted)] md:text-lg">{description}</p> : null}
    </div>
  );
}
