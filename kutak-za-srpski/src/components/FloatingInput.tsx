"use client";

import { InputHTMLAttributes, useId } from "react";

type FloatingInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  containerClassName?: string;
};

export function FloatingInput({
  id,
  label,
  containerClassName,
  className,
  placeholder,
  ...inputProps
}: FloatingInputProps) {
  const generatedId = useId().replace(/:/g, "");
  const inputId = id ?? `floating-input-${generatedId}`;

  return (
    <label htmlFor={inputId} className={`relative block ${containerClassName ?? ""}`}>
      <input
        id={inputId}
        placeholder={placeholder ?? " "}
        className={`peer mt-0.5 w-full rounded-xl border border-line bg-[var(--surface-2)] px-3 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:bg-white ${className ?? ""}`}
        {...inputProps}
      />
      <span className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 bg-white/92 px-1 text-sm font-medium text-[var(--muted)] transition-all peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-[&:not(:placeholder-shown)]:top-0 peer-[&:not(:placeholder-shown)]:-translate-y-1/2 peer-[&:not(:placeholder-shown)]:text-xs">
        {label}
      </span>
    </label>
  );
}