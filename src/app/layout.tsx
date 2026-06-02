import type { Metadata } from "next";
// Satoshi (the spec's first display choice) isn't on Google Fonts, so we use
// DM Sans — the spec's named alternative — for display, Inter for body, DM Mono
// for labels. All three are loaded via next/font for zero layout shift.
import { Inter, DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
  display: "swap",
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkillSwap — Le tutorat entre étudiants DSP F2I",
  description:
    "La plateforme de tutorat peer-to-peer du campus DSP F2I. Trouve un tuteur, partage tes compétences, progresse et fais certifier ton niveau — entre étudiants.",
  openGraph: {
    title: "SkillSwap — Le tutorat entre étudiants DSP F2I",
    description:
      "Trouve un tuteur, partage tes compétences et progresse, entre étudiants du campus DSP F2I.",
    type: "website",
    locale: "fr_FR",
    siteName: "SkillSwap",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${dmSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
