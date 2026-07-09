"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import UserMenu from "@/components/UserMenu";
import HelpButton from "@/components/HelpButton";

type ActivePage = "dashboard" | "journal" | "statistics" | "calendar" | "charts" | "calculator" | "checklist" | "lottery" | "feed" | "admin-feed" | "admin-newsletter" | "admin-feedback" | "admin-panel";

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
  { href: "/dashboard/journal?view=stats", label: "Statistics", key: "statistics" },
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

type AdminIconProps = { size?: number };

const ADMIN_LINKS: { href: string; label: string; key: ActivePage; Icon: (p: AdminIconProps) => React.ReactElement }[] = [
  {
    href: "/admin",
    label: "Admin Panel",
    key: "admin-panel",
    Icon: ({ size = 16 }: AdminIconProps) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" />
        <rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: "/dashboard/admin/feed",
    label: "KI Feed",
    key: "admin-feed",
    Icon: ({ size = 16 }: AdminIconProps) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .962 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.962 0z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/admin/newsletter",
    label: "Newsletter",
    key: "admin-newsletter",
    Icon: ({ size = 16 }: AdminIconProps) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
  {
    href: "/dashboard/admin/feedback",
    label: "Feedback",
    key: "admin-feedback",
    Icon: ({ size = 16 }: AdminIconProps) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      </svg>
    ),
  },
];

function FeedbackCountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      style={{
        fontSize: 10,
        background: "#8B5CF6",
        color: "#fff",
        borderRadius: 20,
        minWidth: 16,
        height: 16,
        padding: "0 5px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 800,
        lineHeight: 1,
        boxShadow: "0 0 10px rgba(139,92,246,0.5)",
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

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
  const [adminOpen, setAdminOpen] = useState(false);
  const [newFeedback, setNewFeedback] = useState(0);
  const adminRef = useRef<HTMLDivElement>(null);

  // Close the admin dropdown on outside-click / Escape.
  useEffect(() => {
    if (!adminOpen) return;
    const onDown = (e: MouseEvent) => {
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) setAdminOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAdminOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [adminOpen]);

  // Load the "new" feedback count for the admin nav badge.
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    fetch("/api/admin/feedback/count")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setNewFeedback(d.new ?? 0); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [isAdmin]);

  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [indicator, setIndicator] = useState({ left: 0, width: 0, opacity: 0 });

  const pathname = usePathname();
  const searchParams = useSearchParams();
  // On the shared /dashboard/journal route, split the highlight between
  // "Journal" (list/trades) and "Statistics" (?view=stats) via the URL.
  const effectiveActivePage: ActivePage =
    pathname === "/dashboard/journal"
      ? (searchParams.get("view") === "stats" ? "statistics" : "journal")
      : activePage;

  const activeIdx = NAV_LINKS.findIndex((l) => l.key === effectiveActivePage);

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
              const isActive = effectiveActivePage === key;
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

            {/* Admin dropdown */}
            {isAdmin && (() => {
              const adminActive = ADMIN_LINKS.some((l) => l.key === activePage);
              const hot = adminActive || adminOpen;
              return (
                <div ref={adminRef} style={{ position: "relative", display: "flex", alignItems: "center", zIndex: 3 }}>
                  <span style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)", margin: "0 8px", alignSelf: "center" }} />
                  <button
                    type="button"
                    onClick={() => setAdminOpen((o) => !o)}
                    aria-haspopup="menu"
                    aria-expanded={adminOpen}
                    style={{
                      position: "relative",
                      zIndex: 1,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      color: hot ? "#F59E0B" : "#A8A29E",
                      fontSize: "13.5px",
                      fontWeight: adminActive ? 600 : 500,
                      cursor: "pointer",
                      padding: "8px 12px",
                      borderRadius: 10,
                      whiteSpace: "nowrap",
                      background: hot ? "rgba(245,158,11,0.1)" : "transparent",
                      border: `1px solid ${hot ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
                      transition: "color 0.2s ease, background 0.2s ease, border-color 0.2s ease",
                    }}
                    onMouseOver={(e) => { if (!hot) (e.currentTarget as HTMLElement).style.color = "#F59E0B"; }}
                    onMouseOut={(e) => { if (!hot) (e.currentTarget as HTMLElement).style.color = "#A8A29E"; }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                    </svg>
                    Admin
                    {newFeedback > 0 && !adminActive && <FeedbackCountBadge count={newFeedback} />}
                    <svg
                      width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ transition: "transform 0.22s ease", transform: adminOpen ? "rotate(180deg)" : "none", opacity: 0.75 }}
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {adminOpen && (
                    <div
                      role="menu"
                      className="admin-menu"
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        right: 0,
                        minWidth: 224,
                        padding: 6,
                        borderRadius: 14,
                        background: "rgba(18,15,26,0.96)",
                        WebkitBackdropFilter: "blur(20px)",
                        backdropFilter: "blur(20px)",
                        border: "1px solid rgba(245,158,11,0.16)",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.6), 0 0 30px rgba(245,158,11,0.08)",
                        zIndex: 200,
                      }}
                    >
                      <div style={{ padding: "4px 10px 8px", fontSize: 10, fontWeight: 800, letterSpacing: "0.09em", color: "#78716C", textTransform: "uppercase" }}>
                        Admin Tools
                      </div>
                      {ADMIN_LINKS.map(({ href, label, key, Icon }) => {
                        const isActive = effectiveActivePage === key;
                        return (
                          <Link
                            key={key}
                            href={href}
                            role="menuitem"
                            onClick={() => setAdminOpen(false)}
                            className="admin-menu-item"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              padding: "9px 10px",
                              borderRadius: 9,
                              textDecoration: "none",
                              color: isActive ? "#F59E0B" : "#D6D3D1",
                              background: isActive ? "rgba(245,158,11,0.12)" : "transparent",
                              fontSize: "13.5px",
                              fontWeight: isActive ? 600 : 500,
                            }}
                          >
                            <span
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                width: 28,
                                height: 28,
                                borderRadius: 8,
                                flexShrink: 0,
                                color: isActive ? "#F59E0B" : "#A8A29E",
                                background: isActive ? "rgba(245,158,11,0.14)" : "rgba(255,255,255,0.05)",
                                border: `1px solid ${isActive ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.06)"}`,
                              }}
                            >
                              <Icon size={15} />
                            </span>
                            <span style={{ flex: 1 }}>{label}</span>
                            {key === "admin-feedback" && <FeedbackCountBadge count={newFeedback} />}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
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
              <div style={{ padding: "4px 12px 6px", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.09em", color: "#78716C", textTransform: "uppercase" }}>
                Admin Tools
              </div>
              {ADMIN_LINKS.map(({ href, label, key, Icon }) => {
                const isActive = effectiveActivePage === key;
                return (
                  <Link
                    key={key}
                    href={href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "12px 12px",
                      margin: "2px 0",
                      borderRadius: 10,
                      color: isActive ? "#F59E0B" : "#A8A29E",
                      background: isActive ? "rgba(245,158,11,0.1)" : "transparent",
                      border: isActive ? "1px solid rgba(245,158,11,0.25)" : "1px solid transparent",
                      fontSize: "15px",
                      fontWeight: isActive ? 600 : 500,
                      textDecoration: "none",
                    }}
                  >
                    <span
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        flexShrink: 0,
                        color: isActive ? "#F59E0B" : "#A8A29E",
                        background: isActive ? "rgba(245,158,11,0.14)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${isActive ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      <Icon size={15} />
                    </span>
                    <span style={{ flex: 1 }}>{label}</span>
                    {key === "admin-feedback" && <FeedbackCountBadge count={newFeedback} />}
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
        @keyframes adminMenuIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .admin-menu { transform-origin: top right; animation: adminMenuIn 0.18s cubic-bezier(.22,1,.36,1) both; }
        .admin-menu-item { transition: background 0.15s ease, color 0.15s ease; }
        .admin-menu-item:hover { background: rgba(255,255,255,0.06) !important; color: #F5F5F4 !important; }
      `}</style>
    </header>
  );
}
