"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import UserMenu from "@/components/UserMenu";
import HelpButton from "@/components/HelpButton";

type ActivePage = "dashboard" | "journal" | "calendar" | "charts" | "calculator" | "checklist" | "lottery" | "feed" | "admin-feed" | "admin-newsletter" | "admin-panel";

interface Props {
  activePage: ActivePage;
  name?: string | null;
  email?: string | null;
  subscriptionStatus?: string;
  isAdmin?: boolean;
  extraButtons?: React.ReactNode;
  headerStyle?: React.CSSProperties;
}

const NAV_LINKS: { href: string; label: string; key: ActivePage; soon?: boolean }[] = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/dashboard/journal", label: "Journal", key: "journal" },
  { href: "/dashboard/calendar", label: "Calendar", key: "calendar" },
  { href: "/dashboard/charts", label: "Charts", key: "charts" },
  { href: "/dashboard/calculator", label: "Calculator", key: "calculator" },
  { href: "/dashboard/checklist", label: "Checklist", key: "checklist" },
  { href: "/dashboard/lottery", label: "Lottery", key: "lottery" },
  { href: "/dashboard/feed", label: "AI Market Insights", key: "feed", soon: true },
];

const checklistEnabled = process.env.NEXT_PUBLIC_CHECKLIST_ENABLED === "true";

function SoonBadge() {
  return (
    <span
      style={{
        fontSize: 9,
        background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
        color: "#fff",
        borderRadius: 5,
        padding: "1px 6px",
        fontWeight: 800,
        letterSpacing: "0.05em",
        boxShadow: "0 0 12px rgba(139,92,246,0.5)",
        animation: "soonPulse 2.4s ease-in-out infinite",
      }}
    >
      SOON
    </span>
  );
}

const ADMIN_LINKS: { href: string; label: string; key: ActivePage }[] = [
  { href: "/admin", label: "Admin Panel", key: "admin-panel" },
  { href: "/dashboard/admin/feed", label: "KI Feed", key: "admin-feed" },
  { href: "/dashboard/admin/newsletter", label: "Newsletter", key: "admin-newsletter" },
];

export default function DashboardHeader({
  activePage,
  name,
  email,
  subscriptionStatus,
  isAdmin,
  extraButtons,
  headerStyle,
}: Props) {
  const [open, setOpen] = useState(false);

  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });

  const activeIdx = NAV_LINKS.findIndex((l) => l.key === activePage);

  const updateIndicator = useCallback(() => {
    const idx = hoverIdx ?? activeIdx;
    const el = itemRefs.current[idx];
    if (el) {
      setIndicator({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 });
    } else {
      setIndicator((i) => ({ ...i, opacity: 0 }));
    }
  }, [hoverIdx, activeIdx]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [updateIndicator]);

  const defaultStyle: React.CSSProperties = {
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    background: "linear-gradient(180deg, rgba(10,8,18,0.85) 0%, rgba(0,0,0,0.7) 100%)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  };

  return (
    <header style={headerStyle ?? defaultStyle} className="px-6 py-4">

      {/* Main row */}
      <div className="mx-auto flex items-center justify-between" style={{ maxWidth: "1200px" }}>
        {/* Logo + Desktop Nav */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <Link href="/" className="logo-link" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
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
            <span style={{ color: "#F9FAFB", fontWeight: 600, fontSize: "16px", fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.01em" }}>
              TJ TradeHub
            </span>
          </Link>

          {/* Desktop nav – hidden on mobile */}
          <nav
            ref={navRef}
            className="hidden md:flex"
            style={{ gap: "2px", position: "relative" }}
            onMouseLeave={() => setHoverIdx(null)}
          >
            {/* Sliding magic indicator pill */}
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: "50%",
                left: indicator.left,
                width: indicator.width,
                height: 34,
                transform: "translateY(-50%)",
                borderRadius: 10,
                background: "rgba(139,92,246,0.14)",
                border: "1px solid rgba(139,92,246,0.3)",
                boxShadow: "0 0 18px rgba(139,92,246,0.18), inset 0 0 12px rgba(139,92,246,0.08)",
                opacity: indicator.opacity,
                transition: "left 0.32s cubic-bezier(0.4,0,0.2,1), width 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease",
                pointerEvents: "none",
                zIndex: 0,
              }}
            />

            {NAV_LINKS.map(({ href, label, key, soon }, i) => {
              const isActive = activePage === key;
              return (
                <Link
                  key={key}
                  href={href}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  onMouseEnter={() => setHoverIdx(i)}
                  style={{
                    position: "relative",
                    zIndex: 1,
                    color: isActive ? "#C4B5FD" : "#9CA3AF",
                    fontSize: "13.5px",
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    padding: "8px 13px",
                    borderRadius: 10,
                    whiteSpace: "nowrap",
                    transition: "color 0.2s ease",
                  }}
                  onMouseOver={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#F9FAFB"; }}
                  onMouseOut={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}
                >
                  {label}
                  {key === "checklist" && !checklistEnabled && <SoonBadge />}
                  {soon && <SoonBadge />}
                </Link>
              );
            })}

            {/* Admin links */}
            {isAdmin && (
              <>
                <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 4px", alignSelf: "center" }} />
                {ADMIN_LINKS.map(({ href, label, key }) => {
                  const isActive = activePage === key;
                  return (
                    <Link
                      key={key}
                      href={href}
                      style={{
                        position: "relative",
                        zIndex: 1,
                        color: isActive ? "#F59E0B" : "#78716C",
                        fontSize: "13.5px",
                        fontWeight: isActive ? 600 : 500,
                        textDecoration: "none",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "8px 13px",
                        borderRadius: 10,
                        whiteSpace: "nowrap",
                        transition: "color 0.2s ease",
                        background: isActive ? "rgba(245,158,11,0.1)" : "transparent",
                      }}
                      onMouseOver={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#F59E0B"; }}
                      onMouseOut={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "#78716C"; }}
                    >
                      ⚙ {label}
                    </Link>
                  );
                })}
              </>
            )}
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
          {NAV_LINKS.map(({ href, label, key, soon }) => {
            const isActive = activePage === key;
            return (
              <Link
                key={key}
                href={href}
                onClick={() => setOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "12px 12px",
                  margin: "2px 0",
                  borderRadius: 10,
                  color: isActive ? "#C4B5FD" : "#9CA3AF",
                  background: isActive ? "rgba(139,92,246,0.12)" : "transparent",
                  border: isActive ? "1px solid rgba(139,92,246,0.25)" : "1px solid transparent",
                  fontSize: "15px",
                  fontWeight: isActive ? 600 : 500,
                  textDecoration: "none",
                }}
              >
                {label}
                {key === "checklist" && !checklistEnabled && <SoonBadge />}
                {soon && <SoonBadge />}
              </Link>
            );
          })}
          {isAdmin && (
            <>
              <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "8px 0" }} />
              {ADMIN_LINKS.map(({ href, label, key }) => {
                const isActive = activePage === key;
                return (
                  <Link
                    key={key}
                    href={href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "12px 12px",
                      margin: "2px 0",
                      borderRadius: 10,
                      color: isActive ? "#F59E0B" : "#78716C",
                      background: isActive ? "rgba(245,158,11,0.1)" : "transparent",
                      border: isActive ? "1px solid rgba(245,158,11,0.25)" : "1px solid transparent",
                      fontSize: "15px",
                      fontWeight: isActive ? 600 : 500,
                      textDecoration: "none",
                    }}
                  >
                    ⚙ {label}
                  </Link>
                );
              })}
            </>
          )}
        </div>
      )}

      <style>{`
        @keyframes soonPulse {
          0%, 100% { box-shadow: 0 0 10px rgba(139,92,246,0.4); }
          50% { box-shadow: 0 0 18px rgba(139,92,246,0.75); }
        }
        .logo-link span { transition: text-shadow 0.3s ease; }
        .logo-link:hover span { text-shadow: 0 0 18px rgba(139,92,246,0.6); }
      `}</style>
    </header>
  );
}
