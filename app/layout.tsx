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
  metadataBase: new URL("https://www.tjtradehub.com"),
  title: {
    default: "Best Trading Journal for Forex & Futures Traders | TJ TradeHub",
    template: "%s | TJ TradeHub",
  },
  description:
    "TJ TradeHub is an advanced trading journal for system-based traders. Track performance, analyze execution quality, and improve discipline — built for Forex & Futures traders.",
  keywords: [
    "trading journal",
    "forex trading journal",
    "futures trading journal",
    "best trading journal",
    "trading journal software",
    "mt5 trading journal",
    "trading performance tracker",
    "trader journal",
    "forex performance tracker",
    "trading analytics journal",
  ],
  openGraph: {
    title: "Best Trading Journal for Forex & Futures Traders | TJ TradeHub",
    description:
      "Advanced trading journal for system-based Forex & Futures traders. Track performance, analyze execution quality, and improve discipline.",
    url: "https://www.tjtradehub.com",
    siteName: "TJ TradeHub",
    images: [
      {
        url: "/logo-3d.png",
        width: 512,
        height: 512,
        alt: "TJ TradeHub – Trading Journal for Forex & Futures Traders",
      },
    ],
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Best Trading Journal for Forex & Futures Traders | TJ TradeHub",
    description:
      "Advanced trading journal for system-based Forex & Futures traders. Track performance, analyze execution quality, improve discipline.",
    images: ["/logo-3d.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.tjtradehub.com",
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
