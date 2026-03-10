import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import CursorTrail from "@/components/CursorTrail";
import CookieBanner from "@/components/CookieBanner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});


export const metadata: Metadata = {
  title: "Trading Journal für Forex & Futures Trader | TJ TradeHub",
  description:
    "TJ TradeHub ist ein Trading Journal für systematische Trader. Analysiere deine Trades, tracke deine Performance und verbessere deine Trading-Disziplin.",
  openGraph: {
    title: "TJ TradeHub",
    description: "Stop tracking outcomes. Start tracking discipline.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        <CursorTrail />
        <CookieBanner />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
