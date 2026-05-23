"use client";

import { FormEvent, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { subscribeToNewsletter } from "@/lib/firestore";
import { Locale } from "@/types/models";

export function NewsletterForm() {
  const t = useTranslations("newsletter");
  const locale = useLocale() as Locale;
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");

    try {
      await subscribeToNewsletter(email, locale);
      setMessage(t("success"));
      setEmail("");
    } catch {
      setError(t("error"));
    }
  };

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-6 md:p-8 max-[375px]:rounded-2xl">
      <h3 className="text-2xl text-[var(--brand-2)] sm:text-3xl">{t("title")}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{t("description")}</p>
      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@email.com"
          className="w-full rounded-full border border-line bg-[var(--surface-2)] px-4 py-3 text-sm outline-none transition focus:border-[var(--brand)] focus:bg-white"
        />
        <button type="submit" className="btn-primary w-full md:w-auto">
          {t("cta")}
        </button>
      </div>
      {message ? (
        <p className="mt-3 text-sm text-[color-mix(in_oklab,var(--accent-leaf)_58%,#1f6f2f)]">{message}</p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-[var(--accent-berry)]">{error}</p> : null}
    </form>
  );
}
