#!/usr/bin/env npx tsx
/**
 * TJTradeHub – Demo Account Seed Script
 *
 * Creates a demo user with 60 trades showing a clear 3-month improvement curve.
 * Used for marketing videos and demos.
 *
 * Run:
 *   cd /path/to/tjtradehub-landing
 *   npx tsx scripts/seed-demo.ts
 *
 * Requires SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 *
 * To reset and re-seed: add --reset flag
 *   npx tsx scripts/seed-demo.ts --reset
 */

import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Load .env.local ──────────────────────────────────────────────────────────
function loadEnv() {
  try {
    const raw = readFileSync(resolve(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (key && !process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local not found – rely on actual env vars
  }
}
loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  console.error("    Add them to .env.local or export as env vars.");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ─── Constants ────────────────────────────────────────────────────────────────
const DEMO_EMAIL = "demo@tjtradehub.com";
const DEMO_PASSWORD = "demo1234";
const DEMO_NAME = "Alex Demo";
const RESET = process.argv.includes("--reset");

// Trading rules that will be tracked in the Discipline Score widget
const RULES = [
  "Only trade with the trend",
  "Max risk 1% per trade",
  "Wait for confirmation before entry",
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface TradeInput {
  date: string;
  pair: string;
  direction: "Long" | "Short";
  entry: number;
  exit: number;
  sl: number;
  tp: number;
  volume: number;
  pnl: number;
  commission: number;
  swap: number;
  rating: number;
  emotions: string[];           // e.g. ["FOMO", "Greedy"] — stored as JSON
  rulesCompliant: boolean[];    // one per RULES entry
  setup: string;
  mistake: string;
  comment: string;
  notes: string;
}

// ─── TRADE DATA ───────────────────────────────────────────────────────────────
// Month 1 (Feb 2026): 20 trades · 7W 13L · Win Rate ~35% · Net P&L ~-$465
// Emotional, undisciplined, many rule breaks
// ─────────────────────────────────────────────────────────────────────────────
const month1: TradeInput[] = [
  {
    date: "2026-02-03T09:15:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2718.50, exit: 2703.20, sl: 2705.00, tp: 2745.00,
    volume: 0.02, pnl: -30.60, commission: -2, swap: 0,
    rating: 3,
    emotions: ["FOMO", "Greedy"],
    rulesCompliant: [false, false, false],
    setup: "None – chased breakout above resistance",
    mistake: "Entry too early",
    comment: "Gold breaking out – had to jump in",
    notes: "FOMO entry. SL too tight, no setup. Stopped out in 20 min. Need to wait for confirmation.",
  },
  {
    date: "2026-02-04T10:30:00Z",
    pair: "EUR/USD", direction: "Short",
    entry: 1.08420, exit: 1.08250, sl: 1.08600, tp: 1.08000,
    volume: 0.10, pnl: 17.00, commission: -1, swap: 0,
    rating: 4,
    emotions: ["Nervous"],
    rulesCompliant: [true, true, false],
    setup: "Break of support – valid idea",
    mistake: "Exited too early",
    comment: "Bearish daily bias – short at resistance",
    notes: "Closed at +17 out of fear of reversal. Would have hit full TP (+42). Cutting winners, letting losers run. Classic mistake.",
  },
  {
    date: "2026-02-05T14:00:00Z",
    pair: "XAU/USD", direction: "Short",
    entry: 2721.00, exit: 2735.40, sl: 2728.00, tp: 2705.00,
    volume: 0.03, pnl: -43.20, commission: -2, swap: 0,
    rating: 2,
    emotions: ["Frustrated", "FOMO"],
    rulesCompliant: [false, false, false],
    setup: "Revenge trade – no real setup",
    mistake: "Wrong direction",
    comment: "Shorting gold to recover yesterday's loss",
    notes: "Revenge trade into an uptrend. Moved SL once, still got crushed. -$43. This is how accounts blow up.",
  },
  {
    date: "2026-02-06T11:45:00Z",
    pair: "GBP/USD", direction: "Long",
    entry: 1.26350, exit: 1.25980, sl: 1.26000, tp: 1.27000,
    volume: 0.10, pnl: -37.00, commission: -1, swap: 0,
    rating: 3,
    emotions: ["Uncertain", "Nervous"],
    rulesCompliant: [true, true, false],
    setup: "Late breakout entry",
    mistake: "Entry too late",
    comment: "Breakout above 1.2630 – jumped in late",
    notes: "Chased the move, entered at the top. Immediate reversal. Entry was 12 pips after the actual breakout. Patience!",
  },
  {
    date: "2026-02-07T09:00:00Z",
    pair: "USD/JPY", direction: "Long",
    entry: 151.850, exit: 152.380, sl: 151.400, tp: 153.000,
    volume: 0.10, pnl: 35.00, commission: -1, swap: 0,
    rating: 5,
    emotions: ["Nervous"],
    rulesCompliant: [true, true, false],
    setup: "Momentum continuation",
    mistake: "Exited too early",
    comment: "Strong USD – buying the dip",
    notes: "Closed at +35 instead of TP (+115). Was nervous about the week ending. Would have been +3.3R. Let winners run!",
  },
  {
    date: "2026-02-10T08:30:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2730.00, exit: 2712.50, sl: 2722.00, tp: 2760.00,
    volume: 0.03, pnl: -52.50, commission: -2, swap: -1,
    rating: 2,
    emotions: ["Frustrated", "Greedy"],
    rulesCompliant: [false, false, false],
    setup: "No setup – gut feeling",
    mistake: "Other",
    comment: "Gold will go up this week – just feels right",
    notes: "No real setup. Moved SL from 2722 to 2716 hoping for a reversal. Original risk: $24. Actual loss: $52. Moved SL = disaster.",
  },
  {
    date: "2026-02-11T11:00:00Z",
    pair: "EUR/USD", direction: "Long",
    entry: 1.08150, exit: 1.08390, sl: 1.07950, tp: 1.08600,
    volume: 0.10, pnl: 24.00, commission: -1, swap: 0,
    rating: 5,
    emotions: ["Nervous"],
    rulesCompliant: [true, true, false],
    setup: "Support bounce",
    mistake: "Exited too early",
    comment: "Bounce from daily support level",
    notes: "+24 instead of +45 TP. Doing it again – closing early out of fear. At least a win.",
  },
  {
    date: "2026-02-12T14:30:00Z",
    pair: "XAU/USD", direction: "Short",
    entry: 2735.00, exit: 2749.80, sl: 2742.00, tp: 2715.00,
    volume: 0.02, pnl: -29.60, commission: -2, swap: 0,
    rating: 2,
    emotions: ["Greedy", "Frustrated"],
    rulesCompliant: [false, true, false],
    setup: "RSI overbought – counter trend",
    mistake: "Wrong direction",
    comment: "RSI at 75 – due for a pullback",
    notes: "Shorting in a clear uptrend because of RSI. Never works. -$29. RSI can stay overbought for weeks in a trend.",
  },
  {
    date: "2026-02-13T09:45:00Z",
    pair: "GBP/USD", direction: "Short",
    entry: 1.26850, exit: 1.27200, sl: 1.27000, tp: 1.26200,
    volume: 0.10, pnl: -35.00, commission: -1, swap: 0,
    rating: 3,
    emotions: ["Fearful", "Frustrated"],
    rulesCompliant: [false, false, false],
    setup: "Failed breakout reversal",
    mistake: "Overleveraged",
    comment: "Expecting reversal – double sized position",
    notes: "Good idea but 2x normal size because 'confident'. SL hit. -$35. Overleveraging ruins good ideas.",
  },
  {
    date: "2026-02-14T10:00:00Z",
    pair: "USD/JPY", direction: "Short",
    entry: 152.500, exit: 152.150, sl: 152.800, tp: 151.800,
    volume: 0.10, pnl: 23.00, commission: -1, swap: 0,
    rating: 4,
    emotions: ["Nervous", "Uncertain"],
    rulesCompliant: [true, true, false],
    setup: "Reversal at resistance",
    mistake: "Exited too early",
    comment: "152.50 is a key resistance zone",
    notes: "Closed at +23 instead of +70 TP. Same pattern. Why do I keep doing this? Must commit to my TP.",
  },
  {
    date: "2026-02-17T09:30:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2741.50, exit: 2724.00, sl: 2734.00, tp: 2768.00,
    volume: 0.02, pnl: -35.00, commission: -2, swap: -1,
    rating: 2,
    emotions: ["Frustrated"],
    rulesCompliant: [false, false, false],
    setup: "Asian session breakout",
    mistake: "Other",
    comment: "Gold made new high in Asia – expecting continuation",
    notes: "Moved SL 3 times trying to avoid the loss. From 2734 → 2730 → 2726 → 2724. Turned a -$15 loss into -$35. Never again.",
  },
  {
    date: "2026-02-18T13:00:00Z",
    pair: "EUR/USD", direction: "Short",
    entry: 1.08500, exit: 1.08720, sl: 1.08680, tp: 1.08050,
    volume: 0.10, pnl: -22.00, commission: -1, swap: 0,
    rating: 3,
    emotions: ["Uncertain", "Nervous"],
    rulesCompliant: [false, true, false],
    setup: "Boredom trade – low volatility session",
    mistake: "Entry too early",
    comment: "Slow session, bored, saw a potential dip",
    notes: "Boredom trade with a too-tight SL. Stopped out on a wick. If there's no setup, there's no trade.",
  },
  {
    date: "2026-02-19T10:15:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2745.00, exit: 2758.80, sl: 2736.00, tp: 2772.00,
    volume: 0.02, pnl: 27.60, commission: -2, swap: 0,
    rating: 6,
    emotions: ["Nervous"],
    rulesCompliant: [true, true, false],
    setup: "Intraday breakout – decent setup",
    mistake: "Exited too early",
    comment: "Classic consolidation breakout on H1",
    notes: "A real setup! But closed at +27 instead of +54 TP. Fear after 3 losses in a row. At least an actual win. Keep building.",
  },
  {
    date: "2026-02-20T09:00:00Z",
    pair: "GBP/USD", direction: "Short",
    entry: 1.26480, exit: 1.26840, sl: 1.26700, tp: 1.25900,
    volume: 0.10, pnl: -36.00, commission: -1, swap: 0,
    rating: 3,
    emotions: ["Frustrated", "Fearful"],
    rulesCompliant: [false, true, false],
    setup: "Resistance rejection – premature entry",
    mistake: "Entry too early",
    comment: "Expecting rejection at 1.2650",
    notes: "Entered before bearish confirmation. Price ran to 1.2680 then came back – but SL already hit. Wait for the close!",
  },
  {
    date: "2026-02-21T11:30:00Z",
    pair: "USD/JPY", direction: "Short",
    entry: 152.200, exit: 151.920, sl: 152.450, tp: 151.400,
    volume: 0.10, pnl: 18.00, commission: -1, swap: 0,
    rating: 4,
    emotions: ["Nervous", "Uncertain"],
    rulesCompliant: [true, true, false],
    setup: "Lower high – H4 bearish structure",
    mistake: "Exited too early",
    comment: "H4 structure turning bearish",
    notes: "+18 instead of +80. Scared of NFP next week. Pattern: valid setup, exit too early, miss the full move. Always.",
  },
  {
    date: "2026-02-24T09:00:00Z",
    pair: "XAU/USD", direction: "Short",
    entry: 2751.00, exit: 2768.50, sl: 2758.00, tp: 2723.00,
    volume: 0.04, pnl: -70.00, commission: -2, swap: 0,
    rating: 1,
    emotions: ["Frustrated", "Greedy"],
    rulesCompliant: [false, false, false],
    setup: "Revenge – 4x size to recover week's losses",
    mistake: "Overleveraged",
    comment: "Need to recover. Going big.",
    notes: "WORST TRADE. 4x normal size shorting into an uptrend. -$70. This is how accounts get blown. Never sizing up to revenge.",
  },
  {
    date: "2026-02-25T14:00:00Z",
    pair: "EUR/USD", direction: "Long",
    entry: 1.08200, exit: 1.08380, sl: 1.08000, tp: 1.08600,
    volume: 0.10, pnl: 18.00, commission: -1, swap: 0,
    rating: 5,
    emotions: ["Uncertain"],
    rulesCompliant: [true, true, false],
    setup: "Daily support – 3rd test holding",
    mistake: "Exited too early",
    comment: "Daily support holding after multiple tests",
    notes: "+18 vs +40 TP. Closed early again. But this time I see the pattern. Starting to understand what I'm doing wrong.",
  },
  {
    date: "2026-02-26T10:30:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2756.00, exit: 2744.20, sl: 2748.00, tp: 2778.00,
    volume: 0.02, pnl: -23.60, commission: -2, swap: 0,
    rating: 3,
    emotions: ["Fearful"],
    rulesCompliant: [true, false, false],
    setup: "London breakout – entered too late",
    mistake: "Entry too late",
    comment: "Late entry chasing London breakout",
    notes: "Entered 12 points after the move started. Risk:Reward was terrible from the start. Don't chase.",
  },
  {
    date: "2026-02-27T09:15:00Z",
    pair: "GBP/USD", direction: "Short",
    entry: 1.26200, exit: 1.26580, sl: 1.26400, tp: 1.25600,
    volume: 0.10, pnl: -38.00, commission: -1, swap: 0,
    rating: 2,
    emotions: ["Frustrated"],
    rulesCompliant: [false, true, false],
    setup: "Counter trend – ego trade",
    mistake: "Wrong direction",
    comment: "Shorting into an obvious bullish trend",
    notes: "EGO TRADE. Clear uptrend, shorted because 'it went up too much'. -$38. The trend is my friend. Repeat until learned.",
  },
  {
    date: "2026-02-28T10:00:00Z",
    pair: "USD/JPY", direction: "Long",
    entry: 150.850, exit: 150.520, sl: 150.600, tp: 151.600,
    volume: 0.10, pnl: -33.00, commission: -1, swap: 0,
    rating: 3,
    emotions: ["Uncertain", "Nervous"],
    rulesCompliant: [false, true, false],
    setup: "Month-end desperation trade",
    mistake: "Other",
    comment: "Trying to end February green",
    notes: "Tight SL on a hope trade. Ending February: -$466. I need to completely rebuild my approach. Rules. Discipline. Process.",
  },
];

// Month 2 (Mar 2026): 20 trades · 10W 10L · Win Rate 50% · Net P&L ~+$118
// Applying rules, controlling emotions, but still some slip-ups
// ─────────────────────────────────────────────────────────────────────────────
const month2: TradeInput[] = [
  {
    date: "2026-03-03T09:30:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2748.00, exit: 2763.50, sl: 2740.00, tp: 2772.00,
    volume: 0.02, pnl: 31.00, commission: -2, swap: 0,
    rating: 7,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "H4 bullish flag breakout – waited for close above",
    mistake: "Exited too early",
    comment: "Clean flag pattern – waiting for confirmed breakout",
    notes: "First trade actually following the rules! Good entry, proper SL. Closed before TP (nerves) but huge improvement. +31.",
  },
  {
    date: "2026-03-04T11:00:00Z",
    pair: "EUR/USD", direction: "Short",
    entry: 1.08100, exit: 1.08420, sl: 1.08300, tp: 1.07600,
    volume: 0.10, pnl: -32.00, commission: -1, swap: 0,
    rating: 6,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "Bearish engulfing on H4 at resistance",
    mistake: "None",
    comment: "Bearish reversal candle at key level – defined risk",
    notes: "Followed all rules. SL hit at planned level – no SL movement. Controlled loss. The process is right even when trade loses.",
  },
  {
    date: "2026-03-05T09:45:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2752.00, exit: 2776.20, sl: 2742.00, tp: 2782.00,
    volume: 0.02, pnl: 48.40, commission: -2, swap: 0,
    rating: 8,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Break above weekly resistance – high probability",
    mistake: "Exited too early",
    comment: "Major level breakout with momentum",
    notes: "Held longer than usual – closed 5.8pt from TP instead of immediately. Progress! +48. Getting comfortable in winners.",
  },
  {
    date: "2026-03-06T14:00:00Z",
    pair: "GBP/USD", direction: "Long",
    entry: 1.27100, exit: 1.26750, sl: 1.26900, tp: 1.27700,
    volume: 0.10, pnl: -35.00, commission: -1, swap: 0,
    rating: 6,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "Pullback to support in established uptrend",
    mistake: "None",
    comment: "Buying the dip in a clear bull trend",
    notes: "Valid setup, SL hit at planned level. Didn't move it. Didn't revenge trade after. Clean execution = win for discipline.",
  },
  {
    date: "2026-03-07T09:00:00Z",
    pair: "USD/JPY", direction: "Short",
    entry: 150.650, exit: 150.120, sl: 151.000, tp: 149.700,
    volume: 0.10, pnl: 53.00, commission: -1, swap: 0,
    rating: 8,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Weak NFP reaction – structural short",
    mistake: "None",
    comment: "Weak job data, USD selling – trend trade",
    notes: "Hit 56% of TP move. Macro + technical alignment. Following rules is starting to pay off. +53.",
  },
  {
    date: "2026-03-10T10:00:00Z",
    pair: "XAU/USD", direction: "Short",
    entry: 2768.00, exit: 2781.40, sl: 2775.00, tp: 2742.00,
    volume: 0.02, pnl: -26.80, commission: -2, swap: 0,
    rating: 4,
    emotions: ["Uncertain"],
    rulesCompliant: [false, true, false],
    setup: "Counter-trend – old habit creeping back",
    mistake: "Wrong direction",
    comment: "Gold pushed too far, expecting mean reversion",
    notes: "Fell into old counter-trend habit. -$26. Must respect the trend. At least the SL held, didn't move it. Partial win.",
  },
  {
    date: "2026-03-11T09:15:00Z",
    pair: "EUR/USD", direction: "Long",
    entry: 1.08650, exit: 1.09010, sl: 1.08450, tp: 1.09250,
    volume: 0.10, pnl: 36.00, commission: -1, swap: 0,
    rating: 7,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Higher low + H4 trend continuation",
    mistake: "Exited too early",
    comment: "EUR recovering, bullish structure intact",
    notes: "Followed the plan! +36 vs +60 TP. Still closing slightly early but getting better. Trend really is my friend.",
  },
  {
    date: "2026-03-12T11:30:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2774.00, exit: 2762.00, sl: 2767.00, tp: 2795.00,
    volume: 0.02, pnl: -24.00, commission: -2, swap: -1,
    rating: 6,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "London open trend continuation",
    mistake: "None",
    comment: "Clean setup with proper R:R from the start",
    notes: "SL hit at planned level. No panic, no SL movement. The loss is just the cost of trading. Moved to next setup calmly.",
  },
  {
    date: "2026-03-13T09:30:00Z",
    pair: "GBP/USD", direction: "Short",
    entry: 1.27450, exit: 1.27000, sl: 1.27650, tp: 1.26750,
    volume: 0.10, pnl: 45.00, commission: -1, swap: 0,
    rating: 8,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Rejection at weekly high – clean short signal",
    mistake: "None",
    comment: "Rejection candle at major weekly resistance",
    notes: "Held to 65% of TP. Waited for confirmation, followed rules. +45. Trading feels different when you follow the plan.",
  },
  {
    date: "2026-03-14T14:00:00Z",
    pair: "USD/JPY", direction: "Long",
    entry: 149.800, exit: 149.430, sl: 149.550, tp: 150.500,
    volume: 0.10, pnl: -37.00, commission: -1, swap: 0,
    rating: 6,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "Historical support zone",
    mistake: "None",
    comment: "Support tested 4 times – high probability bounce",
    notes: "Market gapped through support. Clean stop, no panic. Accepted the loss without revenge. Mental growth.",
  },
  {
    date: "2026-03-17T09:00:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2779.00, exit: 2795.60, sl: 2770.00, tp: 2806.00,
    volume: 0.02, pnl: 33.20, commission: -2, swap: 0,
    rating: 7,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Monday gap fill + weekly bullish bias",
    mistake: "Exited too early",
    comment: "Bullish weekly bias – buy Monday dips",
    notes: "Solid setup. Closed before TP again but held longer than any trade in Feb. +33. Getting more comfortable.",
  },
  {
    date: "2026-03-18T11:00:00Z",
    pair: "EUR/USD", direction: "Short",
    entry: 1.09100, exit: 1.09480, sl: 1.09300, tp: 1.08600,
    volume: 0.10, pnl: -38.00, commission: -1, swap: 0,
    rating: 5,
    emotions: ["Uncertain"],
    rulesCompliant: [false, true, false],
    setup: "Range top – entered before confirmation",
    mistake: "Entry too early",
    comment: "Selling at top of the range",
    notes: "Entered before bearish candle close confirmed the rejection. Should have waited. -$38 but identified the mistake immediately.",
  },
  {
    date: "2026-03-19T09:30:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2783.00, exit: 2806.50, sl: 2773.00, tp: 2813.00,
    volume: 0.02, pnl: 47.00, commission: -2, swap: 0,
    rating: 9,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Breakout with strong momentum – high conviction",
    mistake: "None",
    comment: "Strong bullish orderflow, momentum building",
    notes: "Best trade of March. Let it run to 90% of TP. Completely followed the plan. +47. THIS is what disciplined trading looks like.",
  },
  {
    date: "2026-03-20T14:00:00Z",
    pair: "GBP/USD", direction: "Long",
    entry: 1.27800, exit: 1.27350, sl: 1.27600, tp: 1.28400,
    volume: 0.10, pnl: -45.00, commission: -1, swap: -1,
    rating: 6,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "Trend continuation – clean dip buy",
    mistake: "None",
    comment: "Buying the dip in the bull trend",
    notes: "Technical stop hit, market didn't follow through. Accepted it calmly. No anger, no revenge. Process is solid.",
  },
  {
    date: "2026-03-21T09:00:00Z",
    pair: "USD/JPY", direction: "Short",
    entry: 150.200, exit: 149.730, sl: 150.450, tp: 149.450,
    volume: 0.10, pnl: 47.00, commission: -1, swap: 0,
    rating: 8,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "Bearish structure shift on H4 – patience entry",
    mistake: "None",
    comment: "Waited 2h for confirmed entry signal",
    notes: "Patience paid off. +47. Waiting for confirmation instead of jumping in – that's the difference. Process > impulse.",
  },
  {
    date: "2026-03-24T09:30:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2790.00, exit: 2811.00, sl: 2780.00, tp: 2820.00,
    volume: 0.02, pnl: 42.00, commission: -2, swap: 0,
    rating: 8,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Bullish structure on all timeframes – multi-TF confluence",
    mistake: "None",
    comment: "All timeframes aligned bullish",
    notes: "Held to 70% of TP. Learning to sit in winners. +42. Consistency building week by week.",
  },
  {
    date: "2026-03-25T11:00:00Z",
    pair: "EUR/USD", direction: "Long",
    entry: 1.08350, exit: 1.08050, sl: 1.08150, tp: 1.08850,
    volume: 0.10, pnl: -30.00, commission: -1, swap: 0,
    rating: 6,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "Key support area with defined risk",
    mistake: "None",
    comment: "Support reaction – clean risk definition",
    notes: "Clean loss. Respected stop. No emotional response. Part of the game.",
  },
  {
    date: "2026-03-26T10:00:00Z",
    pair: "XAU/USD", direction: "Short",
    entry: 2818.00, exit: 2833.20, sl: 2825.00, tp: 2793.00,
    volume: 0.02, pnl: -30.40, commission: -2, swap: 0,
    rating: 4,
    emotions: ["Uncertain"],
    rulesCompliant: [false, true, false],
    setup: "Counter-trend resistance – old habit returns",
    mistake: "Wrong direction",
    comment: "Expecting pullback after extended move",
    notes: "Counter-trend again. Trend is still up. Must stop fighting the trend entirely. -$30. Lesson being reinforced.",
  },
  {
    date: "2026-03-27T09:15:00Z",
    pair: "GBP/USD", direction: "Long",
    entry: 1.28150, exit: 1.28620, sl: 1.27900, tp: 1.28900,
    volume: 0.10, pnl: 47.00, commission: -1, swap: 0,
    rating: 8,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "GBP bullish momentum – pullback to S/R",
    mistake: "None",
    comment: "Strong GBP, dip buying into momentum",
    notes: "Textbook entry on the pullback. Held to 76% of TP. +47. The system is working when I follow it.",
  },
  {
    date: "2026-03-28T10:30:00Z",
    pair: "USD/JPY", direction: "Long",
    entry: 149.500, exit: 149.980, sl: 149.250, tp: 150.250,
    volume: 0.10, pnl: 48.00, commission: -1, swap: 0,
    rating: 8,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "USD strength continuation – dip buy",
    mistake: "None",
    comment: "Buying USD pullback in clear uptrend",
    notes: "Good finish to March. Followed plan completely. March: +$118 vs February: -$466. Proof the rules work.",
  },
];

// Month 3 (Apr 2026): 20 trades · 13W 7L · Win Rate 65% · Net P&L ~+$522
// Consistent, disciplined, letting winners run, almost no rule breaks
// ─────────────────────────────────────────────────────────────────────────────
const month3: TradeInput[] = [
  {
    date: "2026-04-01T09:15:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2822.00, exit: 2851.80, sl: 2810.00, tp: 2858.00,
    volume: 0.02, pnl: 59.60, commission: -2, swap: 0,
    rating: 9,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Weekly continuation breakout – institutional flow bullish",
    mistake: "None",
    comment: "All-time high breakout – high conviction long",
    notes: "Held to 97% of TP. Nearly perfect. +59. The journal showed me I was always the problem. The setups were fine.",
  },
  {
    date: "2026-04-02T10:30:00Z",
    pair: "EUR/USD", direction: "Long",
    entry: 1.08800, exit: 1.09180, sl: 1.08600, tp: 1.09400,
    volume: 0.10, pnl: 38.00, commission: -1, swap: 0,
    rating: 8,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "H1 higher lows + trend continuation",
    mistake: "None",
    comment: "Multi-timeframe confluence – clean entry",
    notes: "Solid execution. 63% of TP. Consistent. No emotions, just process.",
  },
  {
    date: "2026-04-03T09:30:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2835.00, exit: 2821.00, sl: 2823.00, tp: 2868.00,
    volume: 0.02, pnl: -28.00, commission: -2, swap: 0,
    rating: 7,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "Trend continuation – dip buy",
    mistake: "None",
    comment: "Buying the dip in the gold bull run",
    notes: "SL hit at planned level. Didn't move it. No revenge. Moved on to next setup. This is the standard now.",
  },
  {
    date: "2026-04-04T11:00:00Z",
    pair: "GBP/USD", direction: "Long",
    entry: 1.28900, exit: 1.29480, sl: 1.28650, tp: 1.29700,
    volume: 0.10, pnl: 58.00, commission: -1, swap: 0,
    rating: 9,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Break of key resistance – confirmed entry on close",
    mistake: "None",
    comment: "GBP pushing higher – structural breakout",
    notes: "Patient entry, waited for candle close. Held to 74% of TP. +58. Trusting my analysis is becoming natural.",
  },
  {
    date: "2026-04-05T09:00:00Z",
    pair: "USD/JPY", direction: "Short",
    entry: 148.950, exit: 148.380, sl: 149.200, tp: 148.100,
    volume: 0.10, pnl: 57.00, commission: -1, swap: 0,
    rating: 8,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "JPY strength – risk-off sentiment + structure breakdown",
    mistake: "None",
    comment: "Macro risk-off aligns with technical breakdown",
    notes: "Macro aligned with technicals. Held to 67% of TP. +57. When everything lines up, results follow.",
  },
  {
    date: "2026-04-08T09:30:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2841.00, exit: 2872.50, sl: 2828.00, tp: 2880.00,
    volume: 0.02, pnl: 63.00, commission: -2, swap: -1,
    rating: 9,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Weekly gold continuation – buy the dip in bull market",
    mistake: "None",
    comment: "Gold bull market – buy every pullback",
    notes: "Best gold trade yet. 82% of TP. Sitting in the winner while it ran felt completely natural. +63.",
  },
  {
    date: "2026-04-09T10:00:00Z",
    pair: "EUR/USD", direction: "Short",
    entry: 1.09350, exit: 1.09620, sl: 1.09550, tp: 1.08800,
    volume: 0.10, pnl: -27.00, commission: -1, swap: 0,
    rating: 6,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "Resistance at prior highs",
    mistake: "None",
    comment: "Short at prior high resistance",
    notes: "Valid setup but trend too strong. Clean stop, accepted it. No revenge, no doubling down. Just on to the next trade.",
  },
  {
    date: "2026-04-10T09:15:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2850.00, exit: 2884.60, sl: 2836.00, tp: 2892.00,
    volume: 0.02, pnl: 69.20, commission: -2, swap: 0,
    rating: 9,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "All-time high continuation with momentum",
    mistake: "None",
    comment: "ATH breakout – momentum trade",
    notes: "89% of TP! Almost perfect execution. Sat through a small pullback mid-trade and held. Journal proves the system works.",
  },
  {
    date: "2026-04-11T11:30:00Z",
    pair: "GBP/USD", direction: "Short",
    entry: 1.29500, exit: 1.29080, sl: 1.29750, tp: 1.28800,
    volume: 0.10, pnl: 42.00, commission: -1, swap: 0,
    rating: 8,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Exhaustion candle + bearish divergence – clean entry",
    mistake: "None",
    comment: "Topping pattern with divergence on H4",
    notes: "Patient entry after confirmation. 60% of TP. Consistent.",
  },
  {
    date: "2026-04-12T09:00:00Z",
    pair: "USD/JPY", direction: "Short",
    entry: 147.800, exit: 147.250, sl: 148.100, tp: 146.900,
    volume: 0.10, pnl: 55.00, commission: -1, swap: 0,
    rating: 9,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "Breakdown below key support – trend alignment",
    mistake: "None",
    comment: "JPY bull run, selling USD rallies",
    notes: "4W 1L week. +199 on the week. This is sustainable, repeatable, process-based trading.",
  },
  {
    date: "2026-04-14T09:30:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2858.00, exit: 2841.00, sl: 2844.00, tp: 2890.00,
    volume: 0.02, pnl: -34.00, commission: -2, swap: 0,
    rating: 7,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "Dip buy in gold bull trend",
    mistake: "None",
    comment: "Buying the dip – trend intact",
    notes: "SL hit. Valid setup, wrong timing. Responded with zero emotion. Losses are a cost of doing business. Next.",
  },
  {
    date: "2026-04-15T10:00:00Z",
    pair: "EUR/USD", direction: "Long",
    entry: 1.09500, exit: 1.09920, sl: 1.09280, tp: 1.10000,
    volume: 0.10, pnl: 42.00, commission: -1, swap: 0,
    rating: 8,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Break of 1.0950 key resistance – confirmed close",
    mistake: "None",
    comment: "Major resistance breakout – high probability",
    notes: "84% of TP. Stayed in the trade even when it pulled back slightly. +42. Trusting the setup.",
  },
  {
    date: "2026-04-16T09:15:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2864.00, exit: 2896.40, sl: 2849.00, tp: 2904.00,
    volume: 0.02, pnl: 64.80, commission: -2, swap: -1,
    rating: 9,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Momentum breakout – new all-time high territory",
    mistake: "None",
    comment: "Gold making new highs – trend is everything",
    notes: "80% of TP. The pattern is clear: follow trend, protect SL, let winners run. Simple. Effective. The journal proved it.",
  },
  {
    date: "2026-04-17T11:00:00Z",
    pair: "GBP/USD", direction: "Long",
    entry: 1.29800, exit: 1.29450, sl: 1.29550, tp: 1.30400,
    volume: 0.10, pnl: -35.00, commission: -1, swap: 0,
    rating: 7,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "Trend continuation – pullback entry",
    mistake: "None",
    comment: "Continuation in established uptrend",
    notes: "False break took me out. Part of trading. No emotional response. Just noted it and moved on.",
  },
  {
    date: "2026-04-18T09:00:00Z",
    pair: "USD/JPY", direction: "Short",
    entry: 146.900, exit: 146.300, sl: 147.200, tp: 145.900,
    volume: 0.10, pnl: 60.00, commission: -1, swap: 0,
    rating: 9,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Downtrend continuation – all timeframes aligned",
    mistake: "None",
    comment: "JPY strength on all timeframes – sell rallies",
    notes: "60% of TP. Strong week. Month is shaping up as the best ever.",
  },
  {
    date: "2026-04-22T09:30:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2875.00, exit: 2913.00, sl: 2858.00, tp: 2920.00,
    volume: 0.02, pnl: 76.00, commission: -2, swap: 0,
    rating: 10,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Perfect setup: trend + key level + momentum + macro",
    mistake: "None",
    comment: "All signals aligned – maximum conviction",
    notes: "BEST TRADE EVER. 94% of TP. Held through a 12pt pullback mid-trade. The journal showed me I could do this. I am doing this.",
  },
  {
    date: "2026-04-23T10:00:00Z",
    pair: "EUR/USD", direction: "Long",
    entry: 1.10100, exit: 1.10480, sl: 1.09880, tp: 1.10700,
    volume: 0.10, pnl: 38.00, commission: -1, swap: 0,
    rating: 8,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "EUR bull continuation above 1.10",
    mistake: "None",
    comment: "EUR bull run – buying pullbacks",
    notes: "63% of TP. Consistent execution. Every week better than the last.",
  },
  {
    date: "2026-04-24T09:15:00Z",
    pair: "XAU/USD", direction: "Long",
    entry: 2890.00, exit: 2876.50, sl: 2876.00, tp: 2925.00,
    volume: 0.02, pnl: -27.00, commission: -2, swap: 0,
    rating: 7,
    emotions: ["Calm"],
    rulesCompliant: [true, true, true],
    setup: "Continuation long in gold bull market",
    mistake: "None",
    comment: "Another dip buy in the gold bull run",
    notes: "SL hit within $0.50 of plan. Didn't move it. Month still strongly positive. Losses are part of the plan.",
  },
  {
    date: "2026-04-25T11:30:00Z",
    pair: "GBP/USD", direction: "Long",
    entry: 1.30200, exit: 1.30820, sl: 1.29900, tp: 1.31000,
    volume: 0.10, pnl: 62.00, commission: -1, swap: 0,
    rating: 9,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "Psychological level breakout – 1.30 conquered",
    mistake: "None",
    comment: "GBP breaking 1.30 – major level",
    notes: "77% of TP. +62. These levels create strong moves. Textbook trade. Feel in complete control of my trading.",
  },
  {
    date: "2026-04-28T09:00:00Z",
    pair: "USD/JPY", direction: "Short",
    entry: 145.800, exit: 145.190, sl: 146.100, tp: 144.900,
    volume: 0.10, pnl: 61.00, commission: -1, swap: 0,
    rating: 9,
    emotions: ["Confident"],
    rulesCompliant: [true, true, true],
    setup: "JPY bull continuation – downtrend intact",
    mistake: "None",
    comment: "Continuation of the JPY bull run",
    notes: "68% of TP. April final week: 3W 1L. Month total: +$522. 3 months ago I was -$466. The journal changed everything.",
  },
];

// ─── MAIN SEED FUNCTION ───────────────────────────────────────────────────────
async function main() {
  const allTrades = [...month1, ...month2, ...month3];
  console.log(`\n🌱  TJTradeHub Demo Seed`);
  console.log(`    Email:    ${DEMO_EMAIL}`);
  console.log(`    Password: ${DEMO_PASSWORD}`);
  console.log(`    Trades:   ${allTrades.length}`);
  console.log(`    Mode:     ${RESET ? "RESET (delete existing + re-seed)" : "CREATE (skip if exists)"}\n`);

  // ── 1. Handle reset ──────────────────────────────────────────────────────
  if (RESET) {
    console.log("🗑️   Deleting existing demo user…");
    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("email", DEMO_EMAIL)
      .maybeSingle();

    if (existing) {
      const uid = existing.id;
      // Delete in dependency order
      await db.from("trade_field_values").delete().in(
        "trade_id",
        (await db.from("trade_entries").select("id").eq("user_id", uid)).data?.map((r: { id: string }) => r.id) ?? []
      );
      await db.from("trade_entries").delete().eq("user_id", uid);
      await db.from("template_fields").delete().in(
        "template_id",
        (await db.from("journal_templates").select("id").eq("user_id", uid)).data?.map((r: { id: string }) => r.id) ?? []
      );
      await db.from("template_sections").delete().in(
        "template_id",
        (await db.from("journal_templates").select("id").eq("user_id", uid)).data?.map((r: { id: string }) => r.id) ?? []
      );
      await db.from("journal_templates").delete().eq("user_id", uid);
      await db.from("users").delete().eq("id", uid);
      console.log("    ✅  Deleted.\n");
    } else {
      console.log("    ℹ️   No existing demo user found.\n");
    }
  }

  // ── 2. Check if user already exists ─────────────────────────────────────
  const { data: existingUser } = await db
    .from("users")
    .select("id")
    .eq("email", DEMO_EMAIL)
    .maybeSingle();

  if (existingUser && !RESET) {
    console.log(`ℹ️   Demo user already exists (id: ${existingUser.id}).`);
    console.log("    Run with --reset to delete and re-seed.\n");
    process.exit(0);
  }

  // ── 3. Create user ───────────────────────────────────────────────────────
  console.log("👤  Creating demo user…");
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const userId = randomUUID();
  const trialEnd = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(); // 1 year

  const { error: userErr } = await db.from("users").insert({
    id: userId,
    email: DEMO_EMAIL,
    name: DEMO_NAME,
    password_hash: passwordHash,
    email_verified: true,
    trial_ends_at: trialEnd,
    subscription_status: "lifetime",
  });

  if (userErr) {
    console.error("❌  Failed to create user:", userErr.message);
    process.exit(1);
  }
  console.log(`    ✅  User created (id: ${userId})\n`);

  // ── 4. Create journal template ───────────────────────────────────────────
  console.log("📋  Creating journal template…");
  const templateId = randomUUID();

  const { error: tplErr } = await db.from("journal_templates").insert({
    id: templateId,
    user_id: userId,
    name: "My Trading Journal",
    version: 1,
    is_frozen: true,
    is_active: true,
    starting_balance: 5000,
    created_at: new Date("2026-01-27T10:01:00Z").toISOString(),
  });

  if (tplErr) {
    console.error("❌  Failed to create template:", tplErr.message);
    process.exit(1);
  }

  // ── 5. Create sections ───────────────────────────────────────────────────
  const sectionTradeId = randomUUID();
  const sectionReviewId = randomUUID();

  const { error: secErr } = await db.from("template_sections").insert([
    {
      id: sectionTradeId,
      template_id: templateId,
      name: "Trade Data",
      order_index: 0,
      created_at: new Date("2026-01-27T10:01:00Z").toISOString(),
    },
    {
      id: sectionReviewId,
      template_id: templateId,
      name: "Trade Review",
      order_index: 1,
      created_at: new Date("2026-01-27T10:01:00Z").toISOString(),
    },
  ]);

  if (secErr) {
    console.error("❌  Failed to create sections:", secErr.message);
    process.exit(1);
  }

  // ── 6. Create fields ─────────────────────────────────────────────────────
  // Field IDs – we need them later for inserting field values
  const fId = {
    symbol:      randomUUID(),
    direction:   randomUUID(),
    volume:      randomUUID(),
    entryPrice:  randomUUID(),
    exitPrice:   randomUUID(),
    sl:          randomUUID(),
    tp:          randomUUID(),
    pnl:         randomUUID(), // label includes "p&l" → auto-detected by stats
    commission:  randomUUID(),
    swap:        randomUUID(),
    comment:     randomUUID(),
    rating:      randomUUID(), // label includes "rating" → auto-detected
    emotions:    randomUUID(), // label includes "emotions" → Discipline Score
    rulesFollowed: randomUUID(), // label includes "rules" → Discipline Score
    setup:       randomUUID(),
    mistake:     randomUUID(),
    notes:       randomUUID(),
  };

  const now = new Date("2026-01-27T10:01:00Z").toISOString();
  const tradeFields = [
    { id: fId.symbol,     section_id: sectionTradeId,   label: "Symbol",      field_type: "text",    is_required: true,  options: null,                       order_index: 0 },
    { id: fId.direction,  section_id: sectionTradeId,   label: "Direction",   field_type: "select",  is_required: true,  options: ["Long", "Short"],          order_index: 1 },
    { id: fId.volume,     section_id: sectionTradeId,   label: "Volume",      field_type: "number",  is_required: false, options: null,                       order_index: 2 },
    { id: fId.entryPrice, section_id: sectionTradeId,   label: "Entry Price", field_type: "number",  is_required: false, options: null,                       order_index: 3 },
    { id: fId.exitPrice,  section_id: sectionTradeId,   label: "Exit Price",  field_type: "number",  is_required: false, options: null,                       order_index: 4 },
    { id: fId.sl,         section_id: sectionTradeId,   label: "Stop Loss",   field_type: "number",  is_required: false, options: null,                       order_index: 5 },
    { id: fId.tp,         section_id: sectionTradeId,   label: "Take Profit", field_type: "number",  is_required: false, options: null,                       order_index: 6 },
    { id: fId.pnl,        section_id: sectionTradeId,   label: "P&L",         field_type: "number",  is_required: false, options: null,                       order_index: 7 },
    { id: fId.commission, section_id: sectionTradeId,   label: "Commission",  field_type: "number",  is_required: false, options: null,                       order_index: 8 },
    { id: fId.swap,       section_id: sectionTradeId,   label: "Swap",        field_type: "number",  is_required: false, options: null,                       order_index: 9 },
    { id: fId.comment,    section_id: sectionTradeId,   label: "Comment",     field_type: "text",    is_required: false, options: null,                       order_index: 10 },
    { id: fId.rating,     section_id: sectionReviewId,  label: "Rating",      field_type: "number",  is_required: false, options: null,                       order_index: 0 },
    { id: fId.emotions,   section_id: sectionReviewId,  label: "Emotions",    field_type: "select",  is_required: false, options: ["Calm", "Confident", "Nervous", "Fearful", "Greedy", "Uncertain", "Frustrated", "Euphoric", "FOMO"], order_index: 1 },
    { id: fId.rulesFollowed, section_id: sectionReviewId, label: "Rules Followed", field_type: "text", is_required: false, options: null,                    order_index: 2 },
    { id: fId.setup,      section_id: sectionReviewId,  label: "Setup",       field_type: "text",    is_required: false, options: null,                       order_index: 3 },
    { id: fId.mistake,    section_id: sectionReviewId,  label: "Mistake",     field_type: "select",  is_required: false, options: ["None", "Entry too early", "Entry too late", "Exited too early", "Exited too late", "Overleveraged", "Wrong direction", "Other"], order_index: 4 },
    { id: fId.notes,      section_id: sectionReviewId,  label: "Notes",       field_type: "text",    is_required: false, options: null,                       order_index: 5 },
  ].map(f => ({ ...f, template_id: templateId, created_at: now }));

  const { error: fieldErr } = await db.from("template_fields").insert(tradeFields);
  if (fieldErr) {
    console.error("❌  Failed to create fields:", fieldErr.message);
    process.exit(1);
  }
  console.log(`    ✅  Template + ${tradeFields.length} fields created\n`);

  // ── 7. Insert trades ─────────────────────────────────────────────────────
  console.log(`📊  Inserting ${allTrades.length} trades…`);

  let inserted = 0;
  for (const trade of allTrades) {
    const tradeId = randomUUID();

    // Build the rules-followed JSON: array of { rule, compliant }
    const rulesJson = JSON.stringify(
      RULES.map((rule, i) => ({ rule, compliant: trade.rulesCompliant[i] ?? false }))
    );

    // Emotions JSON array
    const emotionsJson = JSON.stringify(trade.emotions);

    // Insert trade entry
    const { error: entryErr } = await db.from("trade_entries").insert({
      id: tradeId,
      user_id: userId,
      template_id: templateId,
      template_version: 1,
      trade_date: trade.date,
      created_at: trade.date,
      meta_deal_id: null,
      source: null,
      is_reviewed: true,
    });

    if (entryErr) {
      console.error(`  ❌  Failed to insert trade entry (${trade.date}):`, entryErr.message);
      continue;
    }

    // Insert field values
    const fieldValues = [
      { field_id: fId.symbol,      value: trade.pair },
      { field_id: fId.direction,   value: trade.direction },
      { field_id: fId.volume,      value: String(trade.volume) },
      { field_id: fId.entryPrice,  value: String(trade.entry) },
      { field_id: fId.exitPrice,   value: String(trade.exit) },
      { field_id: fId.sl,          value: String(trade.sl) },
      { field_id: fId.tp,          value: String(trade.tp) },
      { field_id: fId.pnl,         value: String(trade.pnl) },
      { field_id: fId.commission,  value: String(trade.commission) },
      { field_id: fId.swap,        value: String(trade.swap) },
      { field_id: fId.comment,     value: trade.comment },
      { field_id: fId.rating,      value: String(trade.rating) },
      { field_id: fId.emotions,    value: emotionsJson },
      { field_id: fId.rulesFollowed, value: rulesJson },
      { field_id: fId.setup,       value: trade.setup },
      { field_id: fId.mistake,     value: trade.mistake },
      { field_id: fId.notes,       value: trade.notes },
    ].map(fv => ({
      id: randomUUID(),
      trade_id: tradeId,
      field_id: fv.field_id,
      value: fv.value,
      created_at: trade.date,
    }));

    const { error: fvErr } = await db.from("trade_field_values").insert(fieldValues);
    if (fvErr) {
      console.error(`  ❌  Failed to insert field values (${trade.date}):`, fvErr.message);
      continue;
    }

    inserted++;
    process.stdout.write(`\r    ${inserted}/${allTrades.length} trades inserted`);
  }

  // ── 8. Summary ───────────────────────────────────────────────────────────
  const m1 = month1, m2 = month2, m3 = month3;
  const wr = (trades: TradeInput[]) =>
    `${Math.round((trades.filter(t => t.pnl > 0).length / trades.length) * 100)}%`;
  const net = (trades: TradeInput[]) =>
    trades.reduce((s, t) => s + t.pnl + t.commission + t.swap, 0).toFixed(2);

  console.log(`\n\n✅  Seed complete!\n`);
  console.log("  Month    | Trades | Win Rate | Net P&L");
  console.log("  ---------|--------|----------|---------");
  console.log(`  Feb 2026 |   ${m1.length}   |  ${wr(m1).padEnd(7)} | $${net(m1)}`);
  console.log(`  Mar 2026 |   ${m2.length}   |  ${wr(m2).padEnd(7)} | $${net(m2)}`);
  console.log(`  Apr 2026 |   ${m3.length}   |  ${wr(m3).padEnd(7)} | +$${net(m3)}`);
  console.log(`\n  Login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`  URL:   https://www.tjtradehub.com\n`);
}

main().catch(err => {
  console.error("\n❌  Seed failed:", err.message ?? err);
  process.exit(1);
});
