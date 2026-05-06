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
    <div className={`flex flex-col gap-3 ${alignClass}`}>
      {eyebrow ? (
        <span className="text-xs uppercase tracking-[0.2em] text-brand-2">{eyebrow}</span>
      ) : null}
      <h2 className="text-4xl leading-tight text-text md:text-5xl">{title}</h2>
      {description ? <p className="max-w-2xl text-muted md:text-lg">{description}</p> : null}
    </div>
  );
}
