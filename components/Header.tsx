"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

const PRODUCTS = [
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
    title: "Trading Journal",
    desc: "Log & review every trade with custom templates",
    href: "/#journal",
    soon: false,
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <line x1="2" y1="20" x2="22" y2="20"/>
      </svg>
    ),
    title: "Statistics & Analytics",
    desc: "Win rate, P&L, drawdown — at a glance",
    href: "/#journal",
    soon: false,
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    title: "MT4/MT5 Auto-Sync",
    desc: "Import trades automatically from your broker",
    href: "/#features",
    soon: false,
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
    title: "Charts",
    desc: "65+ symbols, real-time prices & market heatmap",
    href: "/#charts",
    soon: false,
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
    title: "Risk Calculator",
    desc: "Position sizing, lot size & R:R in seconds",
    href: "/#calculator",
    soon: false,
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    title: "Market Calendar",
    desc: "Economic events & forex holidays that move markets",
    href: "/#features",
    soon: false,
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
      </svg>
    ),
    title: "Trade Checklist",
    desc: "Pre & post-trade routines to stay disciplined",
    href: "/#features",
    soon: false,
  },
  {
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    title: "AI Market Insights",
    desc: "News decoded into if/then trading scenarios",
    href: "/#ai-insights",
    soon: true,
  },
];

function ProductDropdown({ onClose }: { onClose: () => void }) {
  const left = PRODUCTS.slice(0, 4);
  const right = PRODUCTS.slice(4, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      style={{
        position: "absolute",
        top: "calc(100% + 12px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: "580px",
        background: "rgba(5,3,12,0.98)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "20px",
        backdropFilter: "blur(32px)",
        WebkitBackdropFilter: "blur(32px)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.75), 0 0 0 0.5px rgba(139,92,246,0.08) inset",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      {/* Top arrow */}
      <div style={{
        position: "absolute", top: "-5px", left: "50%", transform: "translateX(-50%)",
        width: "10px", height: "10px",
        background: "rgba(5,3,12,0.98)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderBottom: "none", borderRight: "none",
        rotate: "45deg",
      }} />

      {/* Header bar */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#374151" }}>
          All Features
        </span>
        <span style={{
          fontSize: "10px", fontWeight: 600, padding: "2px 8px", borderRadius: "999px",
          background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.2)",
          color: "#7C6FCD",
        }}>8 tools</span>
      </div>

      {/* 2-column grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "10px" }}>
        {[left, right].map((col, ci) => (
          <div key={ci} style={{ display: "flex", flexDirection: "column" }}>
            {col.map((p) => (
              <a
                key={p.title}
                href={p.href}
                onClick={onClose}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div className="pd-item" style={{
                  display: "flex", alignItems: "flex-start", gap: "11px",
                  padding: "10px 12px", borderRadius: "12px", cursor: "pointer",
                  transition: "background .14s ease",
                }}>
                  <div className="pd-icon" style={{
                    width: "34px", height: "34px", borderRadius: "9px", flexShrink: 0,
                    background: "rgba(139,92,246,0.1)",
                    border: "1px solid rgba(139,92,246,0.16)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#9B87F5",
                    transition: "background .14s ease, border-color .14s ease",
                  }}>
                    {p.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, paddingTop: "1px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: "#E5E7EB", lineHeight: 1.3 }}>
                        {p.title}
                      </span>
                      {p.soon && (
                        <span style={{
                          fontSize: "8px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em",
                          padding: "1.5px 5px", borderRadius: "4px",
                          background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.28)",
                          color: "#A78BFA", flexShrink: 0,
                        }}>Soon</span>
                      )}
                    </div>
                    <p style={{ fontSize: "11px", color: "#6B7280", margin: 0, lineHeight: 1.4 }}>{p.desc}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ))}
      </div>

      {/* Footer bar */}
      <div style={{
        padding: "10px 16px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: "11px", color: "#4B5563" }}>
          More features shipping in Q3 2026
        </span>
        <Link
          href="/register"
          onClick={onClose}
          style={{
            display: "inline-flex", alignItems: "center", gap: "5px",
            fontSize: "11.5px", fontWeight: 700,
            color: "#A78BFA", textDecoration: "none",
            transition: "color .15s ease",
          }}
        >
          Start free
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>

      <style>{`
        .pd-item:hover { background: rgba(139,92,246,0.06) !important; }
        .pd-item:hover .pd-icon {
          background: rgba(139,92,246,0.18) !important;
          border-color: rgba(139,92,246,0.32) !important;
        }
      `}</style>
    </motion.div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const [mobileProductOpen, setMobileProductOpen] = useState(false);
  const productRef = useRef<HTMLDivElement>(null);

  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 80], ["rgba(0,0,0,1)", "rgba(0,0,0,0.55)"]);
  const headerBorder = useTransform(scrollY, [0, 80], ["#1F2937", "rgba(255,255,255,0.08)"]);
  const headerBlur = useTransform(scrollY, [0, 80], ["blur(0px)", "blur(18px)"]);

  useEffect(() => {
    if (!productOpen) return;
    function handler(e: MouseEvent) {
      if (productRef.current && !productRef.current.contains(e.target as Node)) {
        setProductOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [productOpen]);

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
      <div className="mx-auto flex items-center justify-between h-full px-6" style={{ maxWidth: "1200px" }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image src="/logo-tj-transparent.png" alt="TJ TradeHub Logo" width={40} height={40} className="object-contain" />
          <span className="font-semibold text-lg tracking-tight" style={{ color: "#F9FAFB" }}>TJ TradeHub</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <div ref={productRef} style={{ position: "relative" }}>
            <button
              onClick={() => setProductOpen(o => !o)}
              style={{
                display: "flex", alignItems: "center", gap: "4px",
                background: "none", border: "none", cursor: "pointer", padding: 0,
                fontSize: "14px", fontWeight: 500,
                color: productOpen ? "#F9FAFB" : "#9CA3AF",
                transition: "color .15s ease",
              }}
            >
              Product
              <svg
                width="12" height="12" viewBox="0 0 12 12" fill="none"
                style={{ transition: "transform .2s ease", transform: productOpen ? "rotate(180deg)" : "rotate(0deg)", marginTop: "1px" }}
              >
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <AnimatePresence>
              {productOpen && <ProductDropdown onClose={() => setProductOpen(false)} />}
            </AnimatePresence>
          </div>

          {["Pricing", "About"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="header-nav-link text-sm font-medium">{item}</a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="header-nav-link text-sm font-medium">Sign In</Link>
          <Link
            href="/register"
            className="header-cta inline-flex items-center px-5 py-2.5 text-sm font-semibold"
            style={{ backgroundColor: "#8B5CF6", color: "#F9FAFB", borderRadius: "14px" }}
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
          {[0,1,2].map(i => (
            <span key={i} className="block w-5 h-0.5 transition-all duration-200" style={{ backgroundColor: "#F9FAFB" }} />
          ))}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden px-6 pb-5 flex flex-col gap-1" style={{ backgroundColor: "#000", borderTop: "1px solid #1F2937" }}>

          {/* Product accordion */}
          <button
            onClick={() => setMobileProductOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "none", border: "none", cursor: "pointer", padding: "10px 0",
              width: "100%", fontSize: "14px", fontWeight: 500, color: "#9CA3AF",
            }}
          >
            Product
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              style={{ transition: "transform .2s ease", transform: mobileProductOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
              <path d="M2 4l4 4 4-4" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {mobileProductOpen && (
            <div style={{ paddingLeft: "6px", paddingBottom: "4px", display: "flex", flexDirection: "column", gap: "1px" }}>
              {PRODUCTS.map((p) => (
                <a
                  key={p.title}
                  href={p.href}
                  onClick={() => setMenuOpen(false)}
                  style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "10px" }}
                >
                  <div style={{
                    width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
                    background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.16)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#9B87F5",
                  }}>
                    {p.icon}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#D1D5DB" }}>{p.title}</span>
                    {p.soon && (
                      <span style={{
                        fontSize: "8px", fontWeight: 800, textTransform: "uppercase",
                        padding: "1px 5px", borderRadius: "4px",
                        background: "rgba(139,92,246,0.18)", color: "#A78BFA",
                      }}>Soon</span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}

          {["Pricing", "About"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`}
              style={{ fontSize: "14px", fontWeight: 500, color: "#9CA3AF", padding: "10px 0", display: "block" }}
              onClick={() => setMenuOpen(false)}>
              {item}
            </a>
          ))}

          <div style={{ height: "1px", background: "#1F2937", margin: "4px 0" }} />

          <Link href="/login" onClick={() => setMenuOpen(false)}
            style={{ fontSize: "14px", fontWeight: 500, color: "#9CA3AF", padding: "10px 0", display: "block" }}>
            Sign In
          </Link>
          <Link href="/register" onClick={() => setMenuOpen(false)}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold mt-1"
            style={{ backgroundColor: "#8B5CF6", color: "#F9FAFB", borderRadius: "14px" }}>
            Start Free
          </Link>
        </div>
      )}
    </motion.header>
  );
}
