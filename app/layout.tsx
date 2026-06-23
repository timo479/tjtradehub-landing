import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { Analytics } from "@vercel/analytics/react";
import CursorTrail from "@/components/CursorTrail";
import CookieBanner from "@/components/CookieBanner";
import FounderLaunchBanner from "@/components/FounderLaunchBanner";
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
        <script dangerouslySetInnerHTML={{ __html: `!function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};ttq.load('${process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID ?? 'D70P9FBC77UDENRHHFKG'}');ttq.holdConsent();ttq.page();}(window, document, 'ttq');` }} />
        <script dangerouslySetInnerHTML={{ __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');var c=null;try{c=localStorage.getItem('cookie-consent')}catch(e){}if(c!=='accepted'){fbq('consent','revoke')}fbq('init','${process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '986930244134969'}');if(c==='accepted'){fbq('track','PageView')}` }} />
        <noscript dangerouslySetInnerHTML={{ __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '986930244134969'}&ev=PageView&noscript=1"/>` }} />
      </head>
      <body>
        <FounderLaunchBanner />
        <CursorTrail />
        <CookieBanner />
        <SessionProvider>{children}</SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
