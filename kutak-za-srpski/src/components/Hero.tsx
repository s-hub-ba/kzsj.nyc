import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_101827_abebfeec-f243-466b-b494-7f6814c0fbbf.mp4";

export function Hero() {
  const t = useTranslations("home.hero");

  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-line bg-white p-5 shadow-[var(--shadow)] sm:p-8 md:p-12 max-[375px]:rounded-2xl max-[375px]:p-4">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[2rem]">
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

      <div className="relative z-10 grid gap-7 lg:grid-cols-[1.1fr_0.7fr] lg:items-center">
        <div className="animate-rise max-w-3xl">
          <span className="mb-4 inline-flex rounded-full border border-line bg-[var(--surface-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-2)] sm:mb-5 sm:px-4 sm:py-1.5 sm:text-xs">
            {t("eyebrow")}
          </span>
          <h1 className="text-[2.2rem] leading-[0.93] text-[var(--brand-2)] sm:text-5xl md:text-7xl">{t("title")}</h1>
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

        <div className="relative hidden justify-self-end lg:block">
          <div className="animate-float-slow relative mx-auto h-[280px] w-[280px] overflow-hidden rounded-[2rem] border border-white/70 bg-white/70 p-3 shadow-[0_24px_52px_-30px_rgba(21,50,80,0.35)] backdrop-blur-sm xl:h-[320px] xl:w-[320px]">
            <div className="relative h-full w-full overflow-hidden rounded-[1.6rem] bg-[var(--surface-2)]/80">
              <Image
                src="/kzjs_logo.png"
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
