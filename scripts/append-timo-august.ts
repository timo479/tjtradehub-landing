#!/usr/bin/env npx tsx
/**
 * Hängt August-2026-Trades an das bestehende "Support & Resistance — NY Session"
 * Journal von timo.sr@tjtradehub.com an. Nur XAU/USD, wie gewünscht.
 *
 * Fügt AUSSCHLIESSLICH hinzu — die 65 bestehenden Trades werden nicht angefasst.
 * Feld-IDs werden aus dem Template GELESEN (sie sind random UUIDs aus dem
 * ursprünglichen Seed, dürfen also nicht geraten werden).
 *
 * Realismus-Regeln, die das Script selbst prüft und bei Verstoß abbricht:
 *   • P&L = (exit − entry) × volume × 100   (XAUUSD: 1 Lot = 100 oz, $1/oz je Lot)
 *     Bei Short umgekehrt. Muss exakt aufgehen, nicht "ungefähr".
 *   • Risiko ≈ 1% der Balance (Journal-Regel 3) — Abweichung >0.35% = Abbruch
 *   • Handelszeit im Journal-Fenster 12:00–21:00 UTC (Regel 4, NY-Session)
 *   • Nur Wochentage — am Wochenende ist der Forexmarkt zu
 *   • max. 3 Trades pro Tag (Template-Einstellung)
 *   • Verlierer schließen exakt am SL, Gewinner knapp VOR dem TP (so füllt es real)
 *
 * Run:  npx tsx scripts/append-timo-august.ts          # Vorschau, schreibt nichts
 *       npx tsx scripts/append-timo-august.ts --write   # tatsächlich einfügen
 */

import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    let v = t.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = v;
  }
}
loadEnv();

const U = process.env.SUPABASE_URL!, K = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const H = { apikey: K, Authorization: `Bearer ${K}`, "Content-Type": "application/json" };
const WRITE = process.argv.includes("--write");

const EMAIL = "timo.sr@tjtradehub.com";
const TEMPLATE_ID = "4395bfe7-c1d7-4eba-ac27-778d366d11c0";
const BALANCE_BEFORE = 10650; // Stand nach den 65 bestehenden Trades
const RISK_PCT = 1;
const CONTRACT = 100; // XAUUSD: 1 Lot = 100 Unzen

// Reihenfolge MUSS der Regelliste im Template entsprechen (rulesFollowed ist 1:1 gemappt)
const RULES = [
  "Only trade at clear support & resistance levels",
  "Wait for a confirmation candle before entry",
  "Risk max 1% per trade",
  "Only trade the New York session",
];

async function rest<T>(path: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const r = await fetch(`${U}/rest/v1/${path}`, {
    ...init,
    headers: { ...H, ...(init.prefer ? { Prefer: init.prefer } : {}) },
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${r.status}: ${txt}`);
  return txt ? (JSON.parse(txt) as T) : (undefined as T);
}

interface Trade {
  date: string;
  direction: "Long" | "Short";
  entry: number; exit: number; sl: number; tp: number;
  volume: number; commission: number;
  rating: number; emotions: string[];
  setup: string; mistake: string; comment: string; notes: string;
}

// ─── Die Trades ───────────────────────────────────────────────────────────────
// Anschluss an den letzten Trade (15.07., Gold bei ~3092). August ruhig steigend
// mit Range 3096–3167 — plausible Fortsetzung, kein Kurssprung.
// Disziplin durchgehend, passend zum Stand nach vier Monaten Arbeit: alle vier
// Regeln erfüllt, Emotionen ruhig, keine Fehler. Nur zwei saubere Stopps.
const TRADES: Trade[] = [
  {
    date: "2026-08-03T14:00:00Z", direction: "Long",
    entry: 3105, exit: 3127, sl: 3093, tp: 3128, volume: 0.09, commission: -2,
    rating: 8, emotions: ["Calm"],
    setup: "Support bounce at 3105, third tap of the level, bullish engulfing as confirmation",
    mistake: "None",
    comment: "Waited for the candle to close before entering",
    notes: "+198. Level held for the third time, confirmation was clean. Sized to 1% as always. Good start to the month.",
  },
  {
    date: "2026-08-04T15:30:00Z", direction: "Short",
    entry: 3142, exit: 3120, sl: 3154, tp: 3118, volume: 0.09, commission: -2,
    rating: 9, emotions: ["Confident"],
    setup: "Rejection at 3142 resistance, long upper wick into the level, NY open",
    mistake: "None",
    comment: "Textbook rejection, no hesitation",
    notes: "+198. Price ran into the level, wicked hard, I waited for the close and took it. Out just before TP. Exactly the trade I want to repeat.",
  },
  {
    date: "2026-08-06T13:45:00Z", direction: "Long",
    entry: 3118, exit: 3106, sl: 3106, tp: 3140, volume: 0.09, commission: -2,
    rating: 7, emotions: ["Calm"],
    setup: "Support retest at 3118 with confirmation candle",
    mistake: "None",
    comment: "Level gave way, stopped out",
    notes: "-108. Nothing wrong with the trade — real level, confirmation there, 1% risk. Sometimes the level just breaks. No urge to win it back.",
  },
  {
    date: "2026-08-10T14:30:00Z", direction: "Long",
    entry: 3096, exit: 3120, sl: 3084, tp: 3122, volume: 0.09, commission: -2,
    rating: 9, emotions: ["Confident"],
    setup: "Support bounce at 3096, level from late July, strong confirmation close",
    mistake: "None",
    comment: "Patient entry after the retest",
    notes: "+216. Same level that held in July. Waited a full 15 minutes for the confirmation instead of front-running it. Best trade of the week.",
  },
  {
    date: "2026-08-11T16:00:00Z", direction: "Short",
    entry: 3155, exit: 3132, sl: 3167, tp: 3130, volume: 0.09, commission: -2,
    rating: 8, emotions: ["Calm"],
    setup: "Resistance rejection at 3155, double top on the 15m",
    mistake: "None",
    comment: "Second failure at the level",
    notes: "+207. Double top into resistance, confirmation on the second rejection. Held to just short of target instead of taking profit early.",
  },
  {
    date: "2026-08-12T13:30:00Z", direction: "Long",
    entry: 3138, exit: 3126, sl: 3126, tp: 3160, volume: 0.09, commission: -2,
    rating: 7, emotions: ["Calm"],
    setup: "Support test at 3138 after the push up, confirmation candle present",
    mistake: "None",
    comment: "Stopped at the level, no re-entry",
    notes: "-108. Was tempted to move the stop down and give it room. Didn't. That's the whole difference to March.",
  },
];

// ─── Prüfungen ────────────────────────────────────────────────────────────────
function pnlOf(t: Trade): number {
  const diff = t.direction === "Long" ? t.exit - t.entry : t.entry - t.exit;
  return Math.round(diff * t.volume * CONTRACT * 100) / 100;
}
function riskOf(t: Trade): number {
  const dist = Math.abs(t.entry - t.sl);
  return Math.round(dist * t.volume * CONTRACT * 100) / 100;
}

function validate(): { pnl: number } {
  const problems: string[] = [];
  const perDay: Record<string, number> = {};
  let net = 0;

  for (const t of TRADES) {
    const d = new Date(t.date);
    const day = t.date.slice(0, 10);
    perDay[day] = (perDay[day] ?? 0) + 1;

    // Wochenende → Markt zu
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) problems.push(`${t.date}: Wochenende (Tag ${dow})`);

    // Handelsfenster 12:00–21:00 UTC (Journal-Regel 4)
    const hh = d.getUTCHours() + d.getUTCMinutes() / 60;
    if (hh < 12 || hh > 21) problems.push(`${t.date}: ${hh.toFixed(2)}h liegt außerhalb 12:00–21:00 UTC`);

    // Risiko ≈ 1%
    const risk = riskOf(t);
    const riskPct = (risk / BALANCE_BEFORE) * 100;
    if (Math.abs(riskPct - RISK_PCT) > 0.35) {
      problems.push(`${t.date}: Risiko ${riskPct.toFixed(2)}% weicht zu weit von ${RISK_PCT}% ab ($${risk})`);
    }

    // SL/TP auf der richtigen Seite
    if (t.direction === "Long" && !(t.sl < t.entry && t.tp > t.entry)) problems.push(`${t.date}: SL/TP falsch für Long`);
    if (t.direction === "Short" && !(t.sl > t.entry && t.tp < t.entry)) problems.push(`${t.date}: SL/TP falsch für Short`);

    // Verlierer exakt am SL, Gewinner vor dem TP
    const pnl = pnlOf(t);
    if (pnl < 0 && t.exit !== t.sl) problems.push(`${t.date}: Verlust, aber Exit ≠ SL`);
    if (pnl > 0) {
      const beyond = t.direction === "Long" ? t.exit > t.tp : t.exit < t.tp;
      if (beyond) problems.push(`${t.date}: Exit liegt jenseits des TP`);
    }
    if (!Number.isInteger(pnl)) problems.push(`${t.date}: P&L ${pnl} ist kein glatter Betrag`);

    net += pnl;
  }

  for (const [day, n] of Object.entries(perDay)) {
    if (n > 3) problems.push(`${day}: ${n} Trades — Template erlaubt max. 3/Tag`);
  }

  if (problems.length) {
    console.error("❌  Realismus-Prüfung fehlgeschlagen:");
    for (const p of problems) console.error("   ·", p);
    process.exit(1);
  }
  return { pnl: net };
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  const { pnl: netPnl } = validate();

  const [user] = await rest<{ id: string }[]>(`users?select=id&email=eq.${EMAIL}`);
  if (!user) { console.error("❌  User nicht gefunden:", EMAIL); process.exit(1); }

  // Feld-IDs aus dem bestehenden Template lesen — nie raten.
  const fields = await rest<{ id: string; label: string }[]>(
    `template_fields?select=id,label&template_id=eq.${TEMPLATE_ID}`
  );
  const byLabel: Record<string, string> = {};
  for (const f of fields) byLabel[f.label] = f.id;

  const NEEDED = ["Symbol","Direction","Volume","Entry Price","Exit Price","Stop Loss","Take Profit","P&L","Commission","Swap","Comment","Rating","Emotions","Rules Followed","Setup","Mistake","Notes"];
  const missing = NEEDED.filter((l) => !byLabel[l]);
  if (missing.length) { console.error("❌  Felder fehlen im Template:", missing.join(", ")); process.exit(1); }

  // Kollisionsschutz: liegt an einem der Tage schon ein Trade?
  const days = [...new Set(TRADES.map((t) => t.date.slice(0, 10)))];
  const existing = await rest<{ trade_date: string }[]>(
    `trade_entries?select=trade_date&user_id=eq.${user.id}&trade_date=gte.${days[0]}T00:00:00Z`
  );
  if (existing.length) {
    console.error(`❌  Es liegen schon ${existing.length} Trades ab ${days[0]} vor — Abbruch, um Doppelungen zu vermeiden.`);
    for (const e of existing) console.error("   ·", e.trade_date);
    process.exit(1);
  }

  console.log(`\n📈  Timo · August-2026-Trades (XAU/USD)\n`);
  console.log("  Datum        Zeit   Richtung  Entry   Exit    SL      TP      Vol    Risiko    P&L");
  console.log("  ─────────────────────────────────────────────────────────────────────────────────────");
  for (const t of TRADES) {
    const p = pnlOf(t);
    console.log(
      `  ${t.date.slice(0,10)}  ${t.date.slice(11,16)}  ${t.direction.padEnd(8)}  ` +
      `${String(t.entry).padEnd(6)}  ${String(t.exit).padEnd(6)}  ${String(t.sl).padEnd(6)}  ${String(t.tp).padEnd(6)}  ` +
      `${t.volume.toFixed(2)}   $${riskOf(t).toFixed(0).padStart(4)}   ${(p>0?'+':'')}$${p}`
    );
  }
  const wins = TRADES.filter((t) => pnlOf(t) > 0).length;
  console.log("  ─────────────────────────────────────────────────────────────────────────────────────");
  console.log(`  ${TRADES.length} Trades · ${wins} Gewinne / ${TRADES.length - wins} Verluste · Trefferquote ${Math.round((wins/TRADES.length)*100)}%`);
  console.log(`  Netto ${netPnl > 0 ? "+" : ""}$${netPnl}  ·  Balance $${BALANCE_BEFORE.toLocaleString()} → $${(BALANCE_BEFORE + netPnl).toLocaleString()}`);
  console.log(`  Alle Regeln erfüllt · Risiko je Trade ~1% · alle innerhalb 12:00–21:00 UTC · nur Wochentage\n`);

  if (!WRITE) {
    console.log("ℹ️   Vorschau — nichts geschrieben. Mit --write tatsächlich einfügen.\n");
    return;
  }

  const rulesJson = JSON.stringify(RULES.map((rule) => ({ rule, compliant: true })));
  let inserted = 0;
  for (const t of TRADES) {
    const tradeId = randomUUID();
    await rest("trade_entries", {
      method: "POST",
      body: JSON.stringify({
        id: tradeId, user_id: user.id, template_id: TEMPLATE_ID, template_version: 1,
        trade_date: t.date, created_at: t.date, meta_deal_id: null, source: null, is_reviewed: true,
      }),
    });

    const vals: [string, string][] = [
      ["Symbol", "XAU/USD"], ["Direction", t.direction], ["Volume", String(t.volume)],
      ["Entry Price", String(t.entry)], ["Exit Price", String(t.exit)],
      ["Stop Loss", String(t.sl)], ["Take Profit", String(t.tp)],
      ["P&L", String(pnlOf(t))], ["Commission", String(t.commission)], ["Swap", "0"],
      ["Comment", t.comment], ["Rating", String(t.rating)],
      ["Emotions", JSON.stringify(t.emotions)], ["Rules Followed", rulesJson],
      ["Setup", t.setup], ["Mistake", t.mistake], ["Notes", t.notes],
    ];
    await rest("trade_field_values", {
      method: "POST",
      body: JSON.stringify(vals.map(([label, value]) => ({
        id: randomUUID(), trade_id: tradeId, field_id: byLabel[label], value, created_at: t.date,
      }))),
    });
    inserted++;
    process.stdout.write(`\r  ${inserted}/${TRADES.length} eingefügt`);
  }
  console.log(`\n\n✅  ${inserted} Trades hinzugefügt. Bestehende 65 unberührt.\n`);
})().catch((e) => { console.error("\n❌", e.message ?? e); process.exit(1); });
