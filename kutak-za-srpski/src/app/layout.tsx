import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const bodyFont = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://kutakzasrpski.org"),
  title: {
    default: "Kutak za srpski | Škola srpskog zavičajnog jezika u Njujorku",
    template: "%s | Kutak za srpski",
  },
  description:
    "Kutak za srpski je škola srpskog zavičajnog jezika u Njujorku za decu i porodice. Programi za uzrast 1-7 godina, prijava i saveti za roditelje.",
  keywords: [
    "škola srpskog zavičajnog jezika",
    "srpski jezik za decu",
    "serbian heritage language school new york",
    "heritage language children serbian",
    "programi srpskog jezika",
    "kutak za srpski",
  ],
  alternates: {
    canonical: "/sr",
    languages: {
      sr: "/sr",
      en: "/en",
      "x-default": "/sr",
    },
  },
  openGraph: {
    type: "website",
    locale: "sr_RS",
    siteName: "Kutak za srpski",
    title: "Kutak za srpski | Škola srpskog zavičajnog jezika u Njujorku",
    description:
      "Programi srpskog zavičajnog jezika za decu i porodice u Njujorku: uzrast 1-7 godina, semestar i podrška porodicama.",
    url: "https://kutakzasrpski.org/sr",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kutak za srpski | Škola srpskog zavičajnog jezika u Njujorku",
    description:
      "Serbian heritage language school in New York for families and children ages 1-7.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/images/logo/kzjs_logo_notext.png",
    shortcut: "/images/logo/kzjs_logo_notext.png",
    apple: "/images/logo/kzjs_logo_notext.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr" className={bodyFont.variable}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
