"use client";

import Image from "next/image";
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
    {
      href: "/programs",
      label: t("programs"),
      children: [
        { href: "/programs/1-3", label: t("programAges.1-3") },
        { href: "/programs/3-5", label: t("programAges.3-5") },
        { href: "/programs/5-7", label: t("programAges.5-7") },
      ],
    },
    { href: "/booking", label: t("booking") },
    { href: "/careers", label: t("careers") },
    { href: "/blog", label: t("blog") },
    { href: "/newsletter", label: t("newsletter") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto w-full max-w-6xl px-4 py-3 md:px-8 max-[375px]:px-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="group inline-flex items-center gap-3">
            <div className="relative h-9 w-9 overflow-hidden rounded-full border border-line bg-white shadow-sm md:h-12 md:w-12">
              <Image
                src="/Logo.jpeg"
                alt="Kutak za srpski logo"
                fill
                sizes="48px"
                className="object-cover"
                priority
              />
            </div>
            <div className="leading-none">
              <span className="block text-lg font-semibold tracking-wide text-brand-2 transition group-hover:text-[var(--brand)] md:text-2xl">
                Kutak za srpski
              </span>
              <span className="hidden text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--muted)] md:block">
                Bilingual learning studio
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-1 text-sm md:flex">
            {links.map((link) => (
              <div key={link.href} className="relative group">
                <Link
                  href={link.href}
                  className="whitespace-nowrap rounded-full px-3 py-2 text-[15px] font-semibold leading-none text-[var(--muted)] transition hover:bg-[var(--surface-2)] hover:text-[var(--brand-2)]"
                >
                  {link.label}
                </Link>

                {link.children ? (
                  <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 min-w-44 rounded-2xl border border-line bg-white p-2 opacity-0 shadow-[var(--shadow)] transition group-hover:pointer-events-auto group-hover:opacity-100">
                    {link.children.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block rounded-xl px-3 py-2 text-sm font-semibold text-[var(--brand-2)] transition hover:bg-[var(--surface-2)]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold text-[var(--brand-2)] md:hidden"
            >
              Menu
            </button>
          </div>
        </div>

        {open ? (
          <div className="glass mt-4 flex flex-col gap-2 rounded-2xl p-3 md:hidden">
            {links.map((link) => (
              <div key={link.href} className="space-y-1">
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm font-semibold text-[var(--brand-2)] hover:bg-white"
                >
                  {link.label}
                </Link>
                {link.children ? (
                  <div className="ml-4 space-y-1 border-l border-line pl-3">
                    {link.children.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className="block rounded-lg px-2 py-1.5 text-xs font-semibold text-[var(--muted)] hover:bg-white"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </nav>
    </header>
  );
}
