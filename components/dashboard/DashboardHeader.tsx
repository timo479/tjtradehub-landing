"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import UserMenu from "@/components/UserMenu";
import HelpButton from "@/components/HelpButton";

type ActivePage = "dashboard" | "journal" | "calendar" | "charts" | "calculator";

interface Props {
  activePage: ActivePage;
  name?: string | null;
  email?: string | null;
  subscriptionStatus?: string;
  extraButtons?: React.ReactNode;
  headerStyle?: React.CSSProperties;
}

const NAV_LINKS: { href: string; label: string; key: ActivePage }[] = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/dashboard/journal", label: "Journal", key: "journal" },
  { href: "/dashboard/calendar", label: "Calendar", key: "calendar" },
  { href: "/dashboard/charts", label: "Charts", key: "charts" },
  { href: "/dashboard/calculator", label: "Calculator", key: "calculator" },
];

export default function DashboardHeader({
  activePage,
  name,
  email,
  subscriptionStatus,
  extraButtons,
  headerStyle,
}: Props) {
  const [open, setOpen] = useState(false);

  const defaultStyle: React.CSSProperties = {
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    backgroundColor: "rgba(0,0,0,0.7)",
    backdropFilter: "blur(12px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  };

  return (
    <header style={headerStyle ?? defaultStyle} className="px-6 py-5">
      {/* Main row */}
      <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "1200px" }}>
        {/* Logo + Desktop Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "32px" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <div className="logo-rotate" style={{ width: 36, height: 36, position: "relative" }}>
              {Array.from({ length: 16 }).map((_, i) => (
                <Image
                  key={i}
                  src="/logo-tj-transparent.png"
                  alt={i === 0 ? "TJ TradeHub" : ""}
                  width={36}
                  height={36}
                  className="logo-layer object-contain"
                  style={{ transform: `translateZ(${i * 0.5}px)`, opacity: i === 15 ? 1 : 0.6 }}
                />
              ))}
            </div>
            <span style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "16px", fontFamily: "'Space Grotesk', sans-serif" }}>
              TJ TradeHub
            </span>
          </Link>

          {/* Desktop nav – hidden on mobile */}
          <nav className="hidden md:flex" style={{ gap: "24px" }}>
            {NAV_LINKS.map(({ href, label, key }) => (
              <Link
                key={key}
                href={href}
                style={{
                  color: activePage === key ? "#8B5CF6" : "#9CA3AF",
                  fontSize: "14px",
                  fontWeight: activePage === key ? 600 : 400,
                  textDecoration: "none",
                }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {extraButtons}
          <HelpButton />
          <UserMenu name={name ?? null} email={email ?? null} subscriptionStatus={subscriptionStatus} />

          {/* Hamburger button – visible only on mobile */}
          <button
            className="flex md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            style={{
              padding: "8px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#9CA3AF",
              cursor: "pointer",
              lineHeight: 1,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {open ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown nav */}
      {open && (
        <div className="md:hidden" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "16px", paddingTop: "8px" }}>
          {NAV_LINKS.map(({ href, label, key }) => (
            <Link
              key={key}
              href={href}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                padding: "12px 4px",
                color: activePage === key ? "#8B5CF6" : "#9CA3AF",
                fontSize: "15px",
                fontWeight: activePage === key ? 600 : 400,
                textDecoration: "none",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}
