"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";

export default function NavR() {
  const { scrollY } = useScroll();
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 0.85]);
  const borderOpacity = useTransform(scrollY, [0, 80], [0, 0.08]);
  const blur = useTransform(scrollY, [0, 80], [0, 20]);

  return (
    <motion.header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: useTransform(bgOpacity, (v) => `rgba(0,0,0,${v})`),
        backdropFilter: useTransform(blur, (v) => `blur(${v}px)`),
        borderBottom: useTransform(borderOpacity, (v) => `1px solid rgba(255,255,255,${v})`),
      }}
    >
      <div className="mx-auto flex items-center justify-between px-6 py-4" style={{ maxWidth: 1200 }}>
        <Link href="/redesign" className="flex items-center gap-2.5" style={{ textDecoration: "none" }}>
          <Image src="/logo-3d.png" alt="TJ TradeHub" width={30} height={30} />
          <span style={{ color: "#F4F4F5", fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>
            TJ TradeHub
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {[
            { href: "#how", label: "How it works" },
            { href: "#features", label: "Features" },
            { href: "#pricing", label: "Pricing" },
            { href: "#faq", label: "FAQ" },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              style={{ color: "#A1A1AA", fontSize: 14, textDecoration: "none" }}
              className="hover:text-white transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden sm:inline text-sm transition-colors"
            style={{ color: "#A1A1AA", textDecoration: "none" }}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all"
            style={{
              backgroundColor: "#F4F4F5",
              color: "#0a0a0a",
              textDecoration: "none",
            }}
          >
            Start free
            <span aria-hidden style={{ fontSize: 12, opacity: 0.7 }}>→</span>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}
