"use client";

import Link from "next/link";

export default function FooterV2() {
  return (
    <footer className="border-t border-white/[0.06] bg-black">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center text-white font-bold text-sm shadow-lg shadow-violet-500/30">
              TJ
            </div>
            <div>
              <div className="font-semibold tracking-tight">TJ TradeHub</div>
              <div className="text-xs text-zinc-500">Trade like a business.</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500">
            <Link href="/" className="hover:text-white transition-colors">Live site</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/impressum" className="hover:text-white transition-colors">Legal</Link>
            <a href="mailto:support@tjtradehub.com" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/[0.04] flex flex-col md:flex-row justify-between gap-2 text-xs text-zinc-600">
          <span>© 2026 TJ TradeHub. All rights reserved.</span>
          <span>Trading involves substantial risk. Past performance does not guarantee future results.</span>
        </div>
      </div>
    </footer>
  );
}
