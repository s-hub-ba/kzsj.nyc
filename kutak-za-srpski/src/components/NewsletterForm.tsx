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
    <form onSubmit={onSubmit} className="rounded-3xl border border-line bg-surface p-6 shadow-[var(--shadow)]">
      <h3 className="text-2xl">{t("title")}</h3>
      <p className="mt-2 text-sm text-muted">{t("description")}</p>
      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="name@email.com"
          className="w-full rounded-full border border-line bg-white px-4 py-3 outline-none focus:border-brand"
        />
        <button
          type="submit"
          className="rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-2"
        >
          {t("cta")}
        </button>
      </div>
      {message ? <p className="mt-3 text-sm text-green-700">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </form>
  );
}
