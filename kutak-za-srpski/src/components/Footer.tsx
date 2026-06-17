import { useTranslations } from "next-intl";
import Image from "next/image";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-18 border-t border-line bg-[linear-gradient(180deg,#ffffff_0%,#edf5fe_100%)]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1fr_1fr_auto] md:items-start md:px-8">
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
            <li>
              <Link href="/careers" className="font-semibold transition hover:text-[var(--brand-2)]">
                {t("careers")}
              </Link>
            </li>
            <li>
              <Link href="/newsletter" className="font-semibold transition hover:text-[var(--brand-2)]">
                {t("newsletter")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-lg text-[var(--brand-2)]">{t("contact")}</h4>
          <p className="text-sm font-semibold text-[var(--muted)]">info@kutakzasrpski.org</p>
          <p className="text-sm font-semibold text-[var(--muted)]">+1 917 394 9610</p>
        </div>

        <div className="md:-mt-10 md:justify-self-end md:text-right">
          <Image
            src="/kzjs_logo.png"
            alt="Kutak za srpski logo"
            width={520}
            height={140}
            className="h-auto w-[220px] sm:w-[280px] md:ml-auto"
          />
         
        </div>
      </div>
    </footer>
  );
}
