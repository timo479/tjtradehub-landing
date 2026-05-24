"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 80], ["rgba(0,0,0,1)", "rgba(0,0,0,0.55)"]);
  const headerBorder = useTransform(scrollY, [0, 80], ["#1F2937", "rgba(255,255,255,0.08)"]);
  const headerBlur = useTransform(scrollY, [0, 80], ["blur(0px)", "blur(18px)"]);

  return (
    <motion.header
      style={{
        backgroundColor: headerBg,
        borderBottom: "1px solid",
        borderColor: headerBorder,
        backdropFilter: headerBlur,
        WebkitBackdropFilter: headerBlur,
      }}
      className="fixed top-0 left-0 right-0 z-50 h-20"
    >
      <div
        className="mx-auto flex items-center justify-between h-full px-6"
        style={{ maxWidth: "1200px" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-tj-transparent.png"
            alt="TJ TradeHub Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span
            className="font-semibold text-lg tracking-tight"
            style={{ color: "#F9FAFB" }}
          >
            TJ TradeHub
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {["Features", "Pricing", "About"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="header-nav-link text-sm font-medium"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="header-nav-link text-sm font-medium"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="header-cta inline-flex items-center px-5 py-2.5 text-sm font-semibold"
            style={{
              backgroundColor: "#8B5CF6",
              color: "#F9FAFB",
              borderRadius: "14px",
            }}
          >
            Start Free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span
            className="block w-5 h-0.5 transition-all duration-200"
            style={{ backgroundColor: "#F9FAFB" }}
          />
          <span
            className="block w-5 h-0.5 transition-all duration-200"
            style={{ backgroundColor: "#F9FAFB" }}
          />
          <span
            className="block w-5 h-0.5 transition-all duration-200"
            style={{ backgroundColor: "#F9FAFB" }}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 pb-4 flex flex-col gap-4"
          style={{
            backgroundColor: "#000000",
            borderTop: "1px solid #1F2937",
          }}
        >
          {["Features", "Pricing", "About"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium py-2"
              style={{ color: "#9CA3AF" }}
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <Link
            href="/login"
            className="text-sm font-medium py-2"
            style={{ color: "#9CA3AF" }}
            onClick={() => setMenuOpen(false)}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold"
            style={{
              backgroundColor: "#8B5CF6",
              color: "#F9FAFB",
              borderRadius: "14px",
            }}
            onClick={() => setMenuOpen(false)}
          >
            Start Free
          </Link>
        </div>
      )}
    </motion.header>
  );
}
