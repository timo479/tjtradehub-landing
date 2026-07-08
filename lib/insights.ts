/**
 * Insight engine — derives real, actionable patterns from a user's trades.
 *
 * Shared by BOTH the Statistics view (JournalStats.tsx) and the Dashboard
 * (WidgetGrid.tsx) so the two never drift. Pure TS, no React.
 *
 * Insights are computed identically for everyone; the UI decides whether to
 * blur the payoff for Basic users. The blurred number is always the REAL one.
 */

// ─── Normalised trade ────────────────────────────────────────────────────────

export interface NormalizedTrade {
  pnl: number;
  isWin: boolean;
  hourUtc: number;
  weekday: number; // 0=Sun … 6=Sat
  symbol: string | null;
  direction: "long" | "short" | null;
  ruleBroken: boolean | null;
  emotions: string[];
  dateMs: number;
}

interface FieldValue {
  value: string;
  template_fields?: { label?: string; field_type?: string } | null;
}
interface RawEntry {
  trade_date: string;
  trade_field_values?: FieldValue[] | null;
}

const NEG_EMOTIONS = ["fomo", "greedy", "greed", "fearful", "fear", "nervous", "frustrated", "revenge", "anxious", "impatient"];

function parseNum(v: string | undefined): number | null {
  if (v == null || v === "") return null;
  const n = parseFloat(String(v).replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? null : n;
}

/** Map an entry's field values → {lowercased label: {value, type}} for detection. */
function fieldMap(e: RawEntry): Map<string, { value: string; type: string }> {
  const m = new Map<string, { value: string; type: string }>();
  for (const fv of e.trade_field_values ?? []) {
    const label = (fv.template_fields?.label ?? "").trim().toLowerCase();
    if (label) m.set(label, { value: fv.value, type: fv.template_fields?.field_type ?? "" });
  }
  return m;
}

/**
 * Normalise a raw entry. Handles both manual-journal and MetaAPI-import label
 * conventions. Returns null when there's no usable numeric P&L (can't score it).
 */
export function normalizeTrade(e: RawEntry): NormalizedTrade | null {
  const fm = fieldMap(e);

  // P&L — a field whose label looks like profit/loss (covers manual "P&L" and
  // MetaAPI "P&L"). "commission"/"swap" are excluded so they can't be mistaken.
  let pnl: number | null = null;
  for (const [label, f] of fm) {
    if (/p&l|pnl|profit|gain|gewinn/.test(label) && !/commission|swap/.test(label)) {
      const n = parseNum(f.value);
      if (n != null) { pnl = n; break; }
    }
  }
  if (pnl == null) return null;

  const d = new Date(e.trade_date);
  if (isNaN(d.getTime())) return null;

  // Direction
  const dirRaw = (fm.get("direction")?.value ?? "").toLowerCase();
  const direction: "long" | "short" | null =
    dirRaw.includes("long") || dirRaw.includes("buy") ? "long" :
    dirRaw.includes("short") || dirRaw.includes("sell") ? "short" : null;

  // Symbol
  const symbolRaw = (fm.get("symbol")?.value ?? "").trim().toUpperCase();
  const symbol = symbolRaw || null;

  // Rules broken — "Rules Followed" (JSON) or MetaAPI "Followed Plan" (bool).
  let ruleBroken: boolean | null = null;
  const rulesRaw = fm.get("rules followed")?.value ?? fm.get("rules")?.value;
  if (rulesRaw) {
    try {
      const arr = JSON.parse(rulesRaw) as Array<{ compliant?: boolean }>;
      if (Array.isArray(arr) && arr.length) ruleBroken = arr.some(r => r?.compliant === false);
    } catch { /* ignore malformed */ }
  } else {
    const fp = fm.get("followed plan")?.value;
    if (fp != null && fp !== "") {
      const v = String(fp).toLowerCase();
      ruleBroken = !(v === "true" || v === "yes" || v === "1");
    }
  }

  // Emotions — "Emotions" (JSON array) or MetaAPI "Emotion" (single select).
  let emotions: string[] = [];
  const emoRaw = fm.get("emotions")?.value;
  if (emoRaw) {
    try {
      const arr = JSON.parse(emoRaw);
      if (Array.isArray(arr)) emotions = arr.map(x => String(x).toLowerCase());
    } catch { emotions = [String(emoRaw).toLowerCase()]; }
  } else {
    const single = fm.get("emotion")?.value;
    if (single) emotions = [String(single).toLowerCase()];
  }

  return {
    pnl,
    isWin: pnl > 0,
    hourUtc: d.getUTCHours(),
    weekday: d.getUTCDay(),
    symbol,
    direction,
    ruleBroken,
    emotions,
    dateMs: d.getTime(),
  };
}

// ─── Segment helpers ─────────────────────────────────────────────────────────

const WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Non-overlapping UTC windows mapped to trader-meaningful sessions.
function sessionOf(hourUtc: number): string {
  if (hourUtc < 8) return "Asian session";
  if (hourUtc < 13) return "London morning";
  if (hourUtc < 16) return "London–NY overlap";
  if (hourUtc < 21) return "New York afternoon";
  return "Late / off-hours";
}

interface Stats { n: number; wins: number; winRate: number; netPnl: number; avgPnl: number; }
function stats(trades: NormalizedTrade[]): Stats {
  const n = trades.length;
  const wins = trades.filter(t => t.isWin).length;
  const netPnl = trades.reduce((s, t) => s + t.pnl, 0);
  return { n, wins, winRate: n ? wins / n : 0, netPnl, avgPnl: n ? netPnl / n : 0 };
}

const MIN_TOTAL = 15;   // data gate: below this, no insights for anyone
const MIN_SEGMENT = 5;  // a segment (and its complement) needs this many trades
const MIN_DELTA_PP = 10; // win-rate delta (percentage points) to be worth surfacing

/** Why a losing trade was avoidable — reused by the weekly recap card. */
export function lossFlag(t: NormalizedTrade): "rule" | "tilt" | null {
  if (t.ruleBroken === true) return "rule";
  if (t.emotions.some(e => NEG_EMOTIONS.some(n => e.includes(n)))) return "tilt";
  return null;
}

export interface Insight {
  id: string;
  dimension: "session" | "weekday" | "symbol" | "direction" | "rules" | "emotion";
  severity: "leak" | "edge";
  headline: string;    // always visible — the hook
  segmentLabel: string; // gated payoff (which segment)
  detailValue: string;  // gated payoff (the numbers)
  deltaPP: number;
  netPnl: number;
  n: number;
  tier: number;         // 3 = money-losing segment, 2 = win-rate leak, 1 = edge
  effect: number;       // within-tier ranking weight
}

export type InsightResult =
  | { status: "insufficient"; total: number; needed: number }
  | { status: "ok"; insights: Insight[] };

/** Find the group whose win rate deviates most from the rest of its dimension. */
function strongestGroup(
  groups: Map<string, NormalizedTrade[]>,
): { label: string; deltaPP: number; group: Stats; rest: Stats } | null {
  // Compare within the dimension's classified universe (e.g. long vs short),
  // not against unclassified trades.
  const universe: NormalizedTrade[] = [];
  for (const members of groups.values()) universe.push(...members);

  let best: { label: string; deltaPP: number; group: Stats; rest: Stats } | null = null;
  for (const [label, members] of groups) {
    if (members.length < MIN_SEGMENT) continue;
    const set = new Set(members);
    const rest = universe.filter(t => !set.has(t));
    if (rest.length < MIN_SEGMENT) continue;
    const g = stats(members), r = stats(rest);
    const deltaPP = (g.winRate - r.winRate) * 100;
    if (!best || Math.abs(deltaPP) > Math.abs(best.deltaPP)) best = { label, deltaPP, group: g, rest: r };
  }
  return best;
}

function pct(x: number) { return `${Math.round(x)}%`; }
function money(x: number) { return `${x >= 0 ? "+" : "−"}$${Math.abs(Math.round(x)).toLocaleString("en-US")}`; }
function signPP(x: number) { return `${x >= 0 ? "+" : "−"}${Math.abs(Math.round(x))}pp`; }

/** Build one insight from the strongest group of a dimension, or null. */
function fromGroup(
  dimension: Insight["dimension"],
  groups: Map<string, NormalizedTrade[]>,
  copy: { leakHead: string; edgeHead: string },
): Insight | null {
  const best = strongestGroup(groups);
  if (!best || Math.abs(best.deltaPP) < MIN_DELTA_PP) return null;
  const leak = best.deltaPP < 0;
  // An "edge" must actually make money — a higher win rate on a net-losing
  // segment (e.g. 10% vs 0%) is not an edge worth bragging about.
  if (!leak && best.group.netPnl <= 0) return null;
  return {
    id: `${dimension}:${best.label}`,
    dimension,
    severity: leak ? "leak" : "edge",
    headline: leak ? copy.leakHead : copy.edgeHead,
    segmentLabel: best.label,
    detailValue: `${signPP(best.deltaPP)} win rate (${pct(best.group.winRate * 100)} vs ${pct(best.rest.winRate * 100)}) · ${money(best.group.netPnl)} over ${best.group.n} trades`,
    deltaPP: best.deltaPP,
    netPnl: best.group.netPnl,
    n: best.group.n,
    tier: leak ? 2 : 1,
    effect: Math.abs(best.deltaPP) * Math.log2(best.group.n + 1),
  };
}

/** A segment that is net-negative on its own — concrete money leaking out. */
function pnlLeak(
  dimension: Insight["dimension"],
  groups: Map<string, NormalizedTrade[]>,
  leakHead: string,
): Insight | null {
  // A leak must be MATERIAL: net-negative AND the segment's avg is meaningfully
  // worse than the account's own average trade — scale-agnostic, so flat/tiny
  // accounts don't surface "−$0 avg" noise.
  const universe: NormalizedTrade[] = [];
  for (const m of groups.values()) universe.push(...m);
  const overall = stats(universe);
  const meanAbs = universe.reduce((s, t) => s + Math.abs(t.pnl), 0) / (universe.length || 1);

  let worst: { label: string; g: Stats } | null = null;
  for (const [label, members] of groups) {
    if (members.length < MIN_SEGMENT) continue;
    const g = stats(members);
    if (g.netPnl >= 0) continue; // only real losses
    if (g.avgPnl > -1) continue; // avg loss rounds to −$0 → nothing worth showing
    if (overall.avgPnl - g.avgPnl < 0.25 * meanAbs) continue; // not materially worse than average
    if (!worst || g.netPnl < worst.g.netPnl) worst = { label, g };
  }
  if (!worst) return null;
  return {
    id: `${dimension}:${worst.label}`,
    dimension,
    severity: "leak",
    headline: leakHead,
    segmentLabel: worst.label,
    detailValue: `${money(worst.g.netPnl)} net over ${worst.g.n} trades (avg ${money(worst.g.avgPnl)} · ${pct(worst.g.winRate * 100)} win rate)`,
    deltaPP: 0,
    netPnl: worst.g.netPnl,
    n: worst.g.n,
    tier: 3,
    effect: Math.abs(worst.g.netPnl),
  };
}

function groupBy(trades: NormalizedTrade[], key: (t: NormalizedTrade) => string | null): Map<string, NormalizedTrade[]> {
  const m = new Map<string, NormalizedTrade[]>();
  for (const t of trades) {
    const k = key(t);
    if (k == null) continue;
    (m.get(k) ?? m.set(k, []).get(k)!).push(t);
  }
  return m;
}

/**
 * Compute the top insights across all dimensions.
 * `raw` is the array of entries straight from /api/v2/entries.
 */
export function computeInsights(raw: RawEntry[], limit = 4): InsightResult {
  const trades = raw.map(normalizeTrade).filter((t): t is NormalizedTrade => t !== null);
  if (trades.length < MIN_TOTAL) {
    return { status: "insufficient", total: trades.length, needed: MIN_TOTAL };
  }

  const DIMS: Array<{
    dim: Insight["dimension"];
    key: (t: NormalizedTrade) => string | null;
    leakHead: string; edgeHead: string;
  }> = [
    { dim: "session", key: t => sessionOf(t.hourUtc),
      leakHead: "One trading session is quietly draining your account.",
      edgeHead: "You have a clear edge in one session." },
    { dim: "weekday", key: t => WEEKDAY_NAMES[t.weekday],
      leakHead: "One weekday costs you far more than the rest.",
      edgeHead: "One weekday is consistently your best." },
    { dim: "symbol", key: t => t.symbol,
      leakHead: "One instrument is bleeding your account.",
      edgeHead: "One instrument is carrying your results." },
    { dim: "direction", key: t => t.direction,
      leakHead: "Your longs and shorts perform very differently.",
      edgeHead: "Your longs and shorts perform very differently." },
    { dim: "rules", key: t => t.ruleBroken == null ? null : t.ruleBroken ? "Rules broken" : "Rules followed",
      leakHead: "Breaking your own rules has a measurable cost.",
      edgeHead: "Following your rules clearly pays off." },
    { dim: "emotion", key: t => t.emotions.length === 0 ? null : t.emotions.some(e => NEG_EMOTIONS.some(n => e.includes(n))) ? "Traded on tilt" : "Calm / neutral",
      leakHead: "Certain emotions wreck your results.",
      edgeHead: "You trade best with a clear head." },
  ];

  // Keep the single strongest insight per dimension (diversity), then rank
  // across dimensions by tier (money-loss > win-rate leak > edge) then effect.
  const perDim: Insight[] = [];
  for (const d of DIMS) {
    const groups = groupBy(trades, d.key);
    const cands = [
      pnlLeak(d.dim, groups, d.leakHead),
      fromGroup(d.dim, groups, { leakHead: d.leakHead, edgeHead: d.edgeHead }),
    ].filter((c): c is Insight => c !== null);
    if (!cands.length) continue;
    cands.sort((a, b) => (b.tier - a.tier) || (b.effect - a.effect));
    perDim.push(cands[0]);
  }

  const insights = perDim
    .sort((a, b) => (b.tier - a.tier) || (b.effect - a.effect))
    .slice(0, limit);

  return { status: "ok", insights };
}
