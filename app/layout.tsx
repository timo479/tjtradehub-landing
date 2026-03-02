import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TJ TradeHub – Structured Trading Requires Structured Tracking",
  description:
    "The advanced trading journal for system-based traders. Track discipline, measure execution, and improve your edge with TJ TradeHub.",
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
      <body>{children}</body>
    </html>
  );
}
