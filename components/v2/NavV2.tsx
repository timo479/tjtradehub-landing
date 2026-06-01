"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

export default function NavV2() {
  const { scrollY } = useScroll();
  const bg = useTransform(scrollY, [0, 80], ["rgba(0,0,0,0)", "rgba(0,0,0,0.6)"]);
  const border = useTransform(scrollY, [0, 80], ["rgba(255,255,255,0)", "rgba(255,255,255,0.08)"]);
  const blur = useTransform(scrollY, [0, 80], ["blur(0px)", "blur(18px)"]);

  return (
    <motion.header
      style={{ backgroundColor: bg, borderColor: border, backdropFilter: blur, WebkitBackdropFilter: blur }}
      className="fixed top-0 left-0 right-0 z-50 border-b"
    >
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <Link href="/v2" className="flex items-center gap-2 group">
          <div className="relative w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center text-white font-bold text-sm shadow-lg shadow-violet-500/30">
            TJ
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-400 to-fuchsia-500 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
          </div>
          <span className="font-semibold tracking-tight">TradeHub</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how" className="hover:text-white transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/login" className="hidden sm:inline text-sm text-zinc-400 hover:text-white transition-colors">
            Log in
          </Link>
          <Link
            href="/register"
            className="relative inline-flex items-center gap-2 rounded-full bg-white text-black px-4 py-1.5 text-sm font-medium hover:bg-zinc-200 transition-colors"
          >
            Start Free
            <span aria-hidden>→</span>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
