"use client";

import React, { useEffect, useMemo, useState } from "react";
import { WORLD_PATH, MAP_W, MAP_H, MERC_R, MERC_YTOP } from "./worldPath";

/* ════════════════════════════════════════════════════════════════════════════
   MARKET PULSE — high-end live market command center for AI Market Insights.
   Neon-glow world map with live trading sessions + world clocks, 24h session
   ribbon, session countdowns and upcoming high-impact economic events.
   Layout: [ world map | AI insights feed ] on top, the rest below.
   Only external data is /api/economic-events.
   ════════════════════════════════════════════════════════════════════════════ */

// ── Session definitions ──────────────────────────────────────────────────────
interface Session {
  key: string;
  city: string;
  tz: string;
  lon: number;
  lat: number;
  open: number;   // local open hour
  close: number;  // local close hour
  color: string;
}

export const SESSIONS: Session[] = [
  { key: "syd", city: "Sydney",   tz: "Australia/Sydney",  lon: 151.2, lat: -33.9, open: 7,  close: 16, color: "#f59e0b" },
  { key: "tok", city: "Tokyo",    tz: "Asia/Tokyo",        lon: 139.7, lat: 35.7,  open: 9,  close: 18, color: "#ec4899" },
  { key: "lon", city: "London",   tz: "Europe/London",     lon: -0.1,  lat: 51.5,  open: 8,  close: 17, color: "#3b82f6" },
  { key: "ny",  city: "New York", tz: "America/New_York",  lon: -74.0, lat: 40.7,  open: 8,  close: 17, color: "#22c55e" },
];

const CLOCKS = [
  { city: "New York",  tz: "America/New_York",  session: "ny" as const },
  { city: "London",    tz: "Europe/London",     session: "lon" as const },
  { city: "Frankfurt", tz: "Europe/Berlin",     session: "lon" as const },
  { city: "Tokyo",     tz: "Asia/Tokyo",        session: "tok" as const },
  { city: "Sydney",    tz: "Australia/Sydney",  session: "syd" as const },
];

const ACCENT = "#8B5CF6";
const OPEN_GREEN = "#22c55e";

// ── Map projection (Mercator, matches worldPath.ts generation) ────────────────
const VIEW = { x: 0, y: 0, w: MAP_W, h: MAP_H };

function project(lon: number, lat: number): { x: number; y: number } {
  const clamped = Math.max(-84, Math.min(84, lat));
  const y = MERC_YTOP - MERC_R * Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360));
  return { x: ((lon + 180) / 360) * MAP_W, y };
}
// lon/lat → % of the map box (for absolutely-positioned overlays)
function mapPct(lon: number, lat: number): { x: number; y: number } {
  const p = project(lon, lat);
  return { x: (p.x / MAP_W) * 100, y: (p.y / MAP_H) * 100 };
}

// ── Time helpers ──────────────────────────────────────────────────────────────
interface LocalParts { hour: number; minute: number; second: number; weekday: number; time: string; }
const WD: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function localParts(date: Date, tz: string): LocalParts {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour12: false,
    hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find(p => p.type === t)?.value ?? "0";
  let hour = parseInt(get("hour"), 10);
  if (hour === 24) hour = 0;
  const minute = parseInt(get("minute"), 10);
  const second = parseInt(get("second"), 10);
  const weekday = WD[get("weekday")] ?? 0;
  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { hour, minute, second, weekday, time };
}

export function isOpenAt(s: Session, date: Date): boolean {
  const { hour, weekday } = localParts(date, s.tz);
  if (weekday === 0 || weekday === 6) return false;
  return hour >= s.open && hour < s.close;
}

function minutesToBoundary(s: Session, now: Date, currentlyOpen: boolean): number {
  const STEP = 5;
  for (let m = STEP; m <= 4 * 24 * 60; m += STEP) {
    const t = new Date(now.getTime() + m * 60000);
    if (isOpenAt(s, t) !== currentlyOpen) return m;
  }
  return 0;
}

function fmtCountdown(mins: number): string {
  if (mins <= 0) return "—";
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ── Economic events ───────────────────────────────────────────────────────────
interface EcoEvent {
  id: string; title: string; country: string;
  event_time: string; impact: string;
  forecast: string | null; previous: string | null;
}
const IMPACT_META: Record<string, { color: string; label: string }> = {
  high:   { color: "#ef4444", label: "High" },
  medium: { color: "#f59e0b", label: "Med" },
  low:    { color: "#6b7280", label: "Low" },
};
const FLAG: Record<string, string> = {
  USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵", CHF: "🇨🇭",
  CAD: "🇨🇦", AUD: "🇦🇺", NZD: "🇳🇿", CNY: "🇨🇳",
};

// ════════════════════════════════════════════════════════════════════════════

export default function MarketPulse({ feed }: { feed?: React.ReactNode }) {
  const [now, setNow] = useState<Date | null>(null);
  const [events, setEvents] = useState<EcoEvent[]>([]);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("/api/economic-events")
      .then(r => (r.ok ? r.json() : { items: [] }))
      .then(d => setEvents(Array.isArray(d.items) ? d.items : []))
      .catch(() => setEvents([]));
  }, []);

  const states = useMemo(() => {
    if (!now) return [];
    return SESSIONS.map(s => {
      const open = isOpenAt(s, now);
      return { s, open, boundary: minutesToBoundary(s, now, open) };
    });
  }, [now]);

  const openCount = states.filter(st => st.open).length;

  const eventList = useMemo(() => {
    if (!now) return [] as (EcoEvent & { released: boolean })[];
    const t = now.getTime();
    const withDiff = events.map(e => ({ e, diff: new Date(e.event_time).getTime() - t }));
    const future = withDiff.filter(d => d.diff >= -30 * 60000).sort((a, b) => a.diff - b.diff);
    const past = withDiff.filter(d => d.diff < -30 * 60000).sort((a, b) => b.diff - a.diff);
    return [...future, ...past].slice(0, 7).map(d => ({ ...d.e, released: d.diff < -30 * 60000 }));
  }, [events, now]);

  if (!now) return <div style={{ height: 640 }} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      {/* ═══ Row 1: [ world map + 24h session flow ]  |  AI insights feed ═══ */}
      <div className="mp-hero" style={{ display: "grid", gridTemplateColumns: "minmax(0, 0.72fr) minmax(380px, 1fr)", gap: "18px", alignItems: "stretch" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "18px", minWidth: 0 }}>
          <WorldMapPanel states={states} openCount={openCount} />
          <SessionRibbon now={now} />
        </div>
        <FeedColumn>{feed}</FeedColumn>
      </div>

      {/* ═══ Row 2: world clocks + session status + economic events ═══ */}
      <div className="mp-grid3" style={{ display: "grid", gridTemplateColumns: "minmax(240px, 0.82fr) minmax(0, 1fr) minmax(0, 1.05fr)", gap: "18px", alignItems: "start" }}>
        <WorldClocks now={now} states={states} openCount={openCount} />
        <SessionCards states={states} />
        <EconomicEvents events={eventList} now={now} hasData={events.length > 0} />
      </div>

      <style>{`
        @keyframes mp-ping { 0% { transform: scale(1); opacity: 0.6; } 70%,100% { transform: scale(2.8); opacity: 0; } }
        @keyframes mp-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.45; } }
        @keyframes mp-twinkle { 0%,100% { opacity: 0.25; } 50% { opacity: 0.9; } }
        @keyframes mp-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .mp-panel { animation: mp-in 0.45s ease both; }
        .mp-feedscroll { overflow-y: auto; }
        .mp-feedscroll::-webkit-scrollbar { width: 8px; }
        .mp-feedscroll::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 8px; }
        .mp-feedscroll::-webkit-scrollbar-track { background: transparent; }
        @media (max-width: 1100px) {
          .mp-hero { grid-template-columns: 1fr !important; height: auto !important; }
          .mp-hero > * { min-height: 420px; }
          .mp-grid3 { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}

// ── Shared panel shell ────────────────────────────────────────────────────────
function panelStyle(extra?: React.CSSProperties): React.CSSProperties {
  return {
    position: "relative",
    borderRadius: "20px",
    border: "1px solid rgba(255,255,255,0.07)",
    background: "linear-gradient(155deg, rgba(139,92,246,0.05), rgba(255,255,255,0.015) 45%, rgba(0,0,0,0))",
    overflow: "hidden",
    ...extra,
  };
}

function PanelLabel({ text, accent = ACCENT, right }: { text: string; accent?: string; right?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "9px", marginBottom: "16px" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, boxShadow: `0 0 10px ${accent}` }} />
      <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.16em", color: "#9CA3AF", textTransform: "uppercase" }}>{text}</span>
      {right && <div style={{ marginLeft: "auto" }}>{right}</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WORLD MAP PANEL — neon hologram
// ═══════════════════════════════════════════════════════════════════════════
function WorldMapPanel({ states, openCount }: {
  states: { s: Session; open: boolean; boundary: number }[];
  openCount: number;
}) {
  // Fixed starfield (generated once, client-only — panel renders after mount)
  const stars = useMemo(() => {
    const out: { x: number; y: number; r: number; d: number }[] = [];
    for (let i = 0; i < 90; i++) {
      out.push({ x: Math.random() * 100, y: Math.random() * 100, r: Math.random() * 1.4 + 0.4, d: Math.random() * 4 });
    }
    return out;
  }, []);

  const vb = `${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`;

  return (
    <div className="mp-panel" style={panelStyle({
      padding: "20px 22px 18px",
      background: "radial-gradient(120% 90% at 50% 20%, rgba(30,27,75,0.55), rgba(2,6,23,0.9) 70%), #05060f",
      display: "flex", flexDirection: "column",
    })}>
      {/* stars */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {stars.map((s, i) => (
          <span key={i} style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`,
            width: s.r, height: s.r, borderRadius: "50%", background: "#fff",
            opacity: 0.5, animation: `mp-twinkle ${3 + s.d}s ease-in-out ${s.d}s infinite`,
          }} />
        ))}
      </div>

      <PanelLabel
        text="Global Market Sessions"
        accent="#22d3ee"
        right={
          <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", padding: "4px 11px", borderRadius: "20px", background: openCount > 0 ? "rgba(34,197,94,0.12)" : "rgba(255,255,255,0.05)", border: `1px solid ${openCount > 0 ? "rgba(34,197,94,0.35)" : "rgba(255,255,255,0.1)"}`, backdropFilter: "blur(6px)" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: openCount > 0 ? OPEN_GREEN : "#4B5563", boxShadow: openCount > 0 ? `0 0 8px ${OPEN_GREEN}` : "none", animation: openCount > 0 ? "mp-pulse 2s infinite" : "none" }} />
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.06em", color: openCount > 0 ? OPEN_GREEN : "#6B7280" }}>
              {openCount > 0 ? `${openCount} MARKET${openCount > 1 ? "S" : ""} OPEN` : "MARKETS CLOSED"}
            </span>
          </span>
        }
      />

      {/* Map — box locked to the map's aspect ratio, filling the widget width 100%
          (height follows). % marker positions map 1:1, no distortion, no gaps. */}
      <div style={{ position: "relative", width: "100%", aspectRatio: `${VIEW.w} / ${VIEW.h}`, marginTop: "4px" }}>
        <svg viewBox={vb} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="mp-neon" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="45%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#d946ef" />
            </linearGradient>
            <pattern id="mp-grid" width="13" height="13" patternUnits="userSpaceOnUse">
              <path d="M13 0 L0 0 0 13" fill="none" stroke="rgba(56,189,248,0.35)" strokeWidth="0.4" />
            </pattern>
            <filter id="mp-glow" x="-25%" y="-25%" width="150%" height="150%">
              <feGaussianBlur stdDeviation="2.4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <clipPath id="mp-land"><path d={WORLD_PATH} /></clipPath>
          </defs>

          {/* wireframe grid clipped to landmass */}
          <g clipPath="url(#mp-land)">
            <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="rgba(37,99,235,0.14)" />
            <rect x="0" y="0" width={MAP_W} height={MAP_H} fill="url(#mp-grid)" />
          </g>
          {/* soft outer glow pass */}
          <path d={WORLD_PATH} fill="none" stroke="url(#mp-neon)" strokeWidth="2.2" strokeLinejoin="round" opacity="0.5" filter="url(#mp-glow)" />
          {/* crisp coastline */}
          <path d={WORLD_PATH} fill="none" stroke="url(#mp-neon)" strokeWidth="0.9" strokeLinejoin="round" />
        </svg>

        {/* city session nodes */}
        {states.map(({ s, open }) => {
          const p = mapPct(s.lon, s.lat);
          if (p.y < 0 || p.y > 100) return null;
          return (
            <div key={s.key} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%`, transform: "translate(-50%, -50%)", zIndex: 3 }}>
              {open && (
                <span style={{ position: "absolute", left: "50%", top: "50%", width: 12, height: 12, marginLeft: -6, marginTop: -6, borderRadius: "50%", background: s.color, animation: "mp-ping 2s ease-out infinite" }} />
              )}
              <span style={{
                position: "relative", display: "block", width: open ? 11 : 7, height: open ? 11 : 7, borderRadius: "50%",
                background: open ? s.color : "rgba(226,232,240,0.6)",
                boxShadow: open ? `0 0 16px ${s.color}, 0 0 5px ${s.color}` : "0 0 6px rgba(226,232,240,0.5)",
                border: `1.5px solid rgba(255,255,255,0.95)`,
              }} />
              <span style={{
                position: "absolute", top: open ? "15px" : "12px", left: "50%", transform: "translateX(-50%)",
                whiteSpace: "nowrap", fontSize: "10px", fontWeight: 700, letterSpacing: "0.02em",
                color: open ? "#F9FAFB" : "#94a3b8",
                textShadow: "0 1px 6px rgba(0,0,0,1)",
              }}>
                {s.city}
              </span>
            </div>
          );
        })}
      </div>

      {/* legend */}
      <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", marginTop: "14px", position: "relative", zIndex: 2 }}>
        {SESSIONS.map(s => {
          const open = states.find(st => st.s.key === s.key)?.open;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: open ? s.color : "rgba(148,163,184,0.35)", boxShadow: open ? `0 0 8px ${s.color}` : "none" }} />
              <span style={{ fontSize: "12px", color: open ? "#D1D5DB" : "#4B5563", fontWeight: 600 }}>{s.city}</span>
              <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.05em", color: open ? OPEN_GREEN : "#374151" }}>{open ? "OPEN" : "CLOSED"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FEED COLUMN — the AI insights main content, right of the map
// ═══════════════════════════════════════════════════════════════════════════
function FeedColumn({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mp-panel" style={panelStyle({})}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", padding: "20px 20px 8px" }}>
        <PanelLabel
          text="AI Market Insights"
          right={
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", borderRadius: "20px", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.28)" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: OPEN_GREEN, boxShadow: `0 0 8px ${OPEN_GREEN}`, animation: "mp-pulse 2s infinite" }} />
              <span style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.08em", color: OPEN_GREEN }}>LIVE</span>
            </span>
          }
        />
        <div className="mp-feedscroll" style={{ flex: 1, minHeight: 0, paddingRight: "8px", marginRight: "-8px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WORLD CLOCKS
// ═══════════════════════════════════════════════════════════════════════════
function WorldClocks({ now, states, openCount }: { now: Date; states: { s: Session; open: boolean; boundary: number }[]; openCount: number }) {
  const next = [...states].sort((a, b) => a.boundary - b.boundary)[0];
  return (
    <div className="mp-panel" style={panelStyle({ padding: "20px 20px 20px", display: "flex", flexDirection: "column" })}>
      <PanelLabel text="World Clock" accent="#3b82f6" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {CLOCKS.map((c, i) => {
          const lp = localParts(now, c.tz);
          const open = states.find(st => st.s.key === c.session)?.open ?? false;
          return (
            <div key={c.city} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "13px 2px", borderBottom: i < CLOCKS.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: open ? OPEN_GREEN : "#374151", boxShadow: open ? `0 0 9px ${OPEN_GREEN}` : "none", animation: open ? "mp-pulse 2s infinite" : "none" }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#E5E7EB", lineHeight: 1.2 }}>{c.city}</div>
                <div style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.05em", color: open ? "rgba(34,197,94,0.9)" : "#4B5563" }}>{open ? "OPEN" : "CLOSED"}</div>
              </div>
              <div style={{ fontVariantNumeric: "tabular-nums", fontSize: "18px", fontWeight: 700, letterSpacing: "0.02em", color: "#F9FAFB" }}>
                {lp.time}
                <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "3px" }}>:{String(lp.second).padStart(2, "0")}</span>
              </div>
            </div>
          );
        })}
      </div>
      {next && (
        <div style={{ marginTop: "auto", paddingTop: "18px" }}>
          <div style={{ position: "relative", overflow: "hidden", borderRadius: "14px", padding: "16px 18px", border: `1px solid ${next.open ? "rgba(239,68,68,0.28)" : `${next.s.color}44`}`, background: next.open ? "linear-gradient(140deg, rgba(239,68,68,0.14), rgba(0,0,0,0))" : `linear-gradient(140deg, ${next.s.color}1e, rgba(0,0,0,0))` }}>
            <div style={{ fontSize: "10px", fontWeight: 800, letterSpacing: "0.14em", color: "#9CA3AF", textTransform: "uppercase", marginBottom: "8px" }}>{next.open ? "Next Close" : "Next Open"}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "9px" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: next.open ? "#ef4444" : next.s.color, boxShadow: `0 0 10px ${next.open ? "#ef4444" : next.s.color}`, alignSelf: "center" }} />
              <span style={{ fontSize: "17px", fontWeight: 700, color: "#F9FAFB" }}>{next.s.city}</span>
              <span style={{ marginLeft: "auto", fontSize: "20px", fontWeight: 800, color: "#F9FAFB", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{fmtCountdown(next.boundary)}</span>
            </div>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 500, marginTop: "6px" }}>{openCount === 0 ? "All markets currently closed" : `${openCount} market${openCount > 1 ? "s" : ""} trading now`}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 24H SESSION RIBBON
// ═══════════════════════════════════════════════════════════════════════════
function SessionRibbon({ now }: { now: Date }) {
  const bars = useMemo(() => {
    return SESSIONS.map(s => {
      const lp = localParts(now, s.tz);
      const localMinutesNow = lp.hour * 60 + lp.minute;
      const utcMinutesNow = now.getUTCHours() * 60 + now.getUTCMinutes();
      let offset = Math.round((localMinutesNow - utcMinutesNow) / 15) * 15;
      if (offset > 780) offset -= 1440;
      if (offset < -720) offset += 1440;
      const openUtc = (((s.open * 60 - offset) % 1440) + 1440) % 1440;
      const closeUtc = (((s.close * 60 - offset) % 1440) + 1440) % 1440;
      return { s, openUtc, closeUtc };
    });
  }, [now]);

  const nowUtcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const nowPct = (nowUtcMin / 1440) * 100;

  function segments(openUtc: number, closeUtc: number): [number, number][] {
    if (closeUtc > openUtc) return [[openUtc / 1440 * 100, closeUtc / 1440 * 100]];
    return [[openUtc / 1440 * 100, 100], [0, closeUtc / 1440 * 100]];
  }

  return (
    <div className="mp-panel" style={panelStyle({ padding: "14px 18px 10px" })}>
      <PanelLabel text="24h Session Flow" accent="#f59e0b" right={
        <span style={{ fontSize: "11px", color: "#6B7280", fontWeight: 600 }}>{String(now.getUTCHours()).padStart(2, "0")}:{String(now.getUTCMinutes()).padStart(2, "0")} UTC</span>
      } />
      <div style={{ position: "relative", paddingLeft: "66px" }}>
        {bars.map(({ s, openUtc, closeUtc }) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center", height: "18px", marginBottom: "5px" }}>
            <span style={{ position: "absolute", left: 0, width: "60px", fontSize: "10px", fontWeight: 700, color: "#9CA3AF", textAlign: "right" }}>{s.city}</span>
            <div style={{ position: "relative", flex: 1, height: "11px", borderRadius: "6px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              {segments(openUtc, closeUtc).map(([a, b], i) => (
                <div key={i} style={{ position: "absolute", top: 0, bottom: 0, left: `${a}%`, width: `${b - a}%`, borderRadius: "8px", background: `linear-gradient(90deg, ${s.color}66, ${s.color}bb)`, boxShadow: `inset 0 0 0 1px ${s.color}55, 0 0 14px ${s.color}33` }} />
              ))}
            </div>
          </div>
        ))}
        <div style={{ position: "relative", marginTop: "6px", height: "14px" }}>
          {[0, 4, 8, 12, 16, 20, 24].map(h => (
            <span key={h} style={{ position: "absolute", left: `${h / 24 * 100}%`, transform: "translateX(-50%)", fontSize: "9px", color: "#4B5563", fontWeight: 600 }}>{h === 24 ? "24" : String(h).padStart(2, "0")}</span>
          ))}
        </div>
        <div style={{ position: "absolute", top: 0, bottom: "18px", left: `calc(66px + (100% - 66px) * ${nowPct / 100})`, width: "2px", background: "linear-gradient(180deg, #fff, rgba(255,255,255,0.2))", boxShadow: "0 0 10px rgba(255,255,255,0.6)", zIndex: 4 }}>
          <span style={{ position: "absolute", top: "-6px", left: "50%", transform: "translateX(-50%)", width: 7, height: 7, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px #fff" }} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// SESSION STATUS CARDS
// ═══════════════════════════════════════════════════════════════════════════
function SessionCards({ states }: { states: { s: Session; open: boolean; boundary: number }[] }) {
  return (
    <div className="mp-panel" style={panelStyle({ padding: "20px 22px" })}>
      <PanelLabel text="Session Status" accent={OPEN_GREEN} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
        {states.map(({ s, open, boundary }) => (
          <div key={s.key} style={{ position: "relative", overflow: "hidden", borderRadius: "14px", padding: "14px 15px", border: `1px solid ${open ? `${s.color}44` : "rgba(255,255,255,0.06)"}`, background: open ? `linear-gradient(150deg, ${s.color}18, rgba(0,0,0,0))` : "rgba(255,255,255,0.02)" }}>
            {open && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${s.color}, transparent)` }} />}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <span style={{ width: 9, height: 9, borderRadius: "50%", background: open ? s.color : "#374151", boxShadow: open ? `0 0 10px ${s.color}` : "none", animation: open ? "mp-pulse 2s infinite" : "none" }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#F9FAFB" }}>{s.city}</span>
              <span style={{ marginLeft: "auto", fontSize: "10px", fontWeight: 800, letterSpacing: "0.06em", color: open ? OPEN_GREEN : "#4B5563" }}>{open ? "OPEN" : "CLOSED"}</span>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: open ? "#F9FAFB" : "#9CA3AF", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{fmtCountdown(boundary)}</div>
            <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 600, marginTop: "2px" }}>{open ? "until close" : "until open"}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ECONOMIC EVENTS
// ═══════════════════════════════════════════════════════════════════════════
function EconomicEvents({ events, now, hasData }: { events: (EcoEvent & { released?: boolean })[]; now: Date; hasData: boolean }) {
  function whenLabel(iso: string, released?: boolean): string {
    const diff = new Date(iso).getTime() - now.getTime();
    const mins = Math.round(Math.abs(diff) / 60000);
    const h = Math.floor(mins / 60);
    const d = Math.floor(h / 24);
    if (released || diff < 0) {
      if (mins < 60) return `${mins}m ago`;
      if (h < 24) return `${h}h ago`;
      return `${d}d ago`;
    }
    if (mins < 60) return `in ${mins}m`;
    if (h < 24) return `in ${h}h ${mins % 60}m`;
    return `in ${d}d`;
  }
  function timeEt(iso: string): string {
    return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
  }

  return (
    <div className="mp-panel" style={panelStyle({ padding: "20px 22px", display: "flex", flexDirection: "column" })}>
      <PanelLabel text="High-Impact Events" accent="#ef4444" right={<span style={{ fontSize: "10px", color: "#4B5563", fontWeight: 700, letterSpacing: "0.05em" }}>ET</span>} />
      {events.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "30px 0", textAlign: "center" }}>
          <div style={{ width: 46, height: 46, borderRadius: "13px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "12px" }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </div>
          <div style={{ color: "#6B7280", fontSize: "13px" }}>{hasData ? "No upcoming events in range." : "Loading calendar…"}</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
          {events.map(e => {
            const im = IMPACT_META[e.impact] ?? IMPACT_META.low;
            const soon = new Date(e.event_time).getTime() - now.getTime();
            const isSoon = !e.released && soon > 0 && soon < 2 * 3600000;
            return (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "11px 13px", borderRadius: "12px", border: `1px solid ${isSoon ? `${im.color}40` : "rgba(255,255,255,0.06)"}`, background: isSoon ? `${im.color}0f` : "rgba(255,255,255,0.02)" }}>
                <span style={{ fontSize: "17px", flexShrink: 0, filter: "saturate(1.1)" }}>{FLAG[e.country] ?? "🏳️"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#E5E7EB", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.title}</div>
                  <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 500 }}>
                    {e.country} · {timeEt(e.event_time)}
                    {e.forecast && <span> · f/c {e.forecast}</span>}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px", flexShrink: 0 }}>
                  <span style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.05em", color: im.color, background: `${im.color}1c`, border: `1px solid ${im.color}40`, borderRadius: "5px", padding: "2px 6px", textTransform: "uppercase" }}>{im.label}</span>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: isSoon ? im.color : e.released ? "#4B5563" : "#6B7280", fontVariantNumeric: "tabular-nums" }}>{whenLabel(e.event_time, e.released)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
