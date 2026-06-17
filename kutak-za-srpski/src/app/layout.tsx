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
    default: "Kutak za srpski | Skola srpskog jezika u Njujorku",
    template: "%s | Kutak za srpski",
  },
  description:
    "Kutak za srpski je skola srpskog jezika u Njujorku za dvojezicne porodice. Programi za uzrast 1-7 godina, prijava za casove i saveti za roditelje.",
  keywords: [
    "skola srpskog jezika",
    "srpski jezik za decu",
    "serbian language school new york",
    "bilingual children serbian",
    "programi srpskog jezika",
    "casovi srpskog jezika online",
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
    title: "Kutak za srpski | Skola srpskog jezika u Njujorku",
    description:
      "Programi srpskog jezika za decu i porodice u Njujorku: uzrast 1-7 godina, semestralni i pojedinacni casovi.",
    url: "https://kutakzasrpski.org/sr",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kutak za srpski | Skola srpskog jezika u Njujorku",
    description:
      "Serbian language school in New York for bilingual families and children ages 1-7.",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/kzjs_logo_notext.png",
    shortcut: "/kzjs_logo_notext.png",
    apple: "/kzjs_logo_notext.png",
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
