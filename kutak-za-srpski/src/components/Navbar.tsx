"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Navbar() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("about") },
    { href: "/programs", label: t("programs") },
    { href: "/booking", label: t("booking") },
    { href: "/blog", label: t("blog") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto w-full max-w-6xl px-4 py-3 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="group inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent-berry)] transition-transform duration-300 group-hover:scale-125" />
            <span className="text-2xl font-semibold tracking-wide text-brand-2 md:text-3xl">Kutak za srpski</span>
          </Link>

          <div className="hidden items-center gap-2 text-sm md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-4 py-2 font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--brand-2)]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="rounded-full border border-line bg-white px-3 py-1 text-sm font-semibold text-[var(--brand-2)] md:hidden"
            >
              Menu
            </button>
          </div>
        </div>

        {open ? (
          <div className="glass mt-4 flex flex-col gap-2 rounded-2xl p-3 md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-[var(--brand-2)] hover:bg-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ) : null}
      </nav>
    </header>
  );
}
