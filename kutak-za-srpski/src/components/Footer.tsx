import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-18 border-t border-line bg-[linear-gradient(180deg,#ffffff_0%,#edf5fe_100%)]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-3 md:px-8">
        <div>
          <h3 className="text-3xl text-[var(--brand-2)]">Kutak za srpski</h3>
          <p className="mt-3 max-w-sm text-sm text-[var(--muted)]">{t("tagline")}</p>
        </div>

        <div>
          <h4 className="mb-3 text-lg text-[var(--brand-2)]">{t("quickLinks")}</h4>
          <ul className="space-y-2 text-sm text-[var(--muted)]">
            <li>
              <Link href="/about" className="font-semibold transition hover:text-[var(--brand-2)]">
                {t("about")}
              </Link>
            </li>
            <li>
              <Link href="/programs" className="font-semibold transition hover:text-[var(--brand-2)]">
                {t("programs")}
              </Link>
            </li>
            <li>
              <Link href="/booking" className="font-semibold transition hover:text-[var(--brand-2)]">
                {t("booking")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-lg text-[var(--brand-2)]">{t("contact")}</h4>
          <p className="text-sm font-semibold text-[var(--muted)]">hello@kutakzasrpski.com</p>
          <p className="text-sm font-semibold text-[var(--muted)]">+381 60 123 4567</p>
        </div>
      </div>
    </footer>
  );
}
