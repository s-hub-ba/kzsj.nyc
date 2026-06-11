interface AdminStatCardProps {
  title: string;
  value: string | number;
  hint?: string;
  highlight?: "accent" | "success" | "warning" | "danger" | "info";
}

export function AdminStatCard({ title, value, hint, highlight }: AdminStatCardProps) {
  const highlightClasses: Record<string, string> = {
    accent: "border-accent/50 bg-accent/5",
    success: "border-success/50 bg-success/5",
    warning: "border-warning/50 bg-warning/5",
    danger: "border-danger/50 bg-danger/5",
    info: "border-info/50 bg-info/5",
  };

  const borderClass = highlight ? highlightClasses[highlight] : "";
  const baseClass = highlight
    ? `rounded-2xl border shadow-[var(--shadow)] p-4 ${borderClass}`
    : "rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)]";

  return (
    <article className={baseClass}>
      <p className="text-xs uppercase tracking-[0.15em] text-brand-2">{title}</p>
      <p className={`mt-1 text-3xl ${highlight ? `text-${highlight}` : "text-text"}`}>
        {value}
      </p>
      {hint ? <p className="mt-2 text-sm text-muted">{hint}</p> : null}
    </article>
  );
}
