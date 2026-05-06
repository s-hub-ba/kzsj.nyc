import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="mt-16 border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 md:grid-cols-3 md:px-8">
        <div>
          <h3 className="text-2xl text-brand-2">Kutak za srpski</h3>
          <p className="mt-3 text-sm text-muted">{t("tagline")}</p>
        </div>

        <div>
          <h4 className="mb-3 text-lg">{t("quickLinks")}</h4>
          <ul className="space-y-2 text-sm text-muted">
            <li>
              <Link href="/about" className="hover:text-brand-2">
                {t("about")}
              </Link>
            </li>
            <li>
              <Link href="/programs" className="hover:text-brand-2">
                {t("programs")}
              </Link>
            </li>
            <li>
              <Link href="/booking" className="hover:text-brand-2">
                {t("booking")}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-lg">{t("contact")}</h4>
          <p className="text-sm text-muted">hello@kutakzasrpski.com</p>
          <p className="text-sm text-muted">+381 60 123 4567</p>
        </div>
      </div>
    </footer>
  );
}
