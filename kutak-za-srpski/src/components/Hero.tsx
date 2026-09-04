import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_101827_abebfeec-f243-466b-b494-7f6814c0fbbf.mp4";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="full-bleed relative -mt-8 isolate flex min-h-[30rem] items-center overflow-hidden rounded-none border-y border-line bg-white p-5 shadow-[var(--shadow)] sm:min-h-[32rem] sm:p-8 md:min-h-[35rem] md:p-12 lg:min-h-[36rem] lg:rounded-[2rem] lg:border max-[375px]:-mt-6 max-[375px]:p-4">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden lg:rounded-[2rem]">
        <video
          src={VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
          aria-hidden="true"
        />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.88)_0%,rgba(255,255,255,0.64)_44%,rgba(255,255,255,0.32)_100%)]" />
      </div>

      <div className="relative z-10 grid min-w-0 w-full gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.75fr)] lg:items-center lg:gap-12">
        <div className="animate-rise min-w-0 max-w-3xl">
          <span className="mb-4 inline-flex rounded-full border border-line bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-2)] sm:mb-5 sm:px-4 sm:py-1.5 sm:text-xs">
            {t("eyebrow")}
          </span>
          <h1 className="max-w-3xl break-words text-[2.2rem] leading-[0.93] text-[var(--brand-2)] sm:text-5xl md:text-7xl">{t("title")}</h1>
          <p className="mt-4 max-w-2xl text-[15px] text-[var(--muted)] sm:mt-6 sm:text-lg md:text-xl">{t("subtitle")}</p>
          <div className="mt-6 flex flex-wrap gap-3 sm:mt-8 sm:gap-4">
            <Link href="/booking" className="btn-primary animate-pulse-glow w-full sm:w-auto">
              {t("primaryCta")}
            </Link>
            <Link href="/programs" className="btn-secondary w-full sm:w-auto">
              {t("secondaryCta")}
            </Link>
          </div>
        </div>

        <div className="relative hidden w-full justify-self-end lg:block">
          <div className="animate-float-slow relative ml-auto aspect-square w-full max-w-[320px] overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 p-3 shadow-[0_24px_52px_-30px_rgba(21,50,80,0.35)] backdrop-blur-sm">
            <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] bg-[var(--surface-2)]/80">
                <Image
                  src="/images/logo/kzjs_logo_notext.png"
                alt="Kutak za srpski logo"
                fill
                sizes="320px"
                className="object-contain p-5"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
