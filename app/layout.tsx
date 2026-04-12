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
    default: "Trading Journal for Forex & Futures Traders | TJ TradeHub",
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
    title: "Trading Journal for Forex & Futures Traders | TJ TradeHub",
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
    title: "Trading Journal for Forex & Futures Traders | TJ TradeHub",
    description:
      "Advanced trading journal for system-based Forex & Futures traders. Track performance, analyze execution quality, improve discipline.",
    images: ["/logo-3d.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
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
      <head>
        <script dangerouslySetInnerHTML={{ __html: `!function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? 'D70P9FBC77UDENRHHFKG'}');ttq.page();}(window, document, 'ttq');` }} />
      </head>
      <body>
        <CursorTrail />
        <CookieBanner />
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
