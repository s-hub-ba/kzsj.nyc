import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";

const bodyFont = Nunito({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kutak za srpski",
  description: "Dvojezicni sajt skole srpskog jezika.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sr" className={bodyFont.variable}>
      <body>{children}</body>
    </html>
  );
}
