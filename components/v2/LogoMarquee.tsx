"use client";

const ROW_A = [
  "MetaTrader 5", "MetaTrader 4", "IC Markets", "Pepperstone", "OANDA",
  "FTMO", "MyForexFunds", "TopstepFutures", "Tradovate", "NinjaTrader",
];
const ROW_B = [
  "FundedNext", "The5ers", "True Forex Funds", "Earn2Trade", "Apex Trader Funding",
  "ATAS", "AMP Futures", "TradeStation", "Forex.com", "Eightcap",
];

function Row({ items, reverse = false }: { items: string[]; reverse?: boolean }) {
  return (
    <div className="relative overflow-hidden v2-no-scrollbar mask-fade">
      <div className={`flex w-max gap-12 ${reverse ? "v2-marquee-track-rev" : "v2-marquee-track"}`}>
        {[...items, ...items].map((name, i) => (
          <div key={i} className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors whitespace-nowrap">
            <span className="w-2 h-2 rounded-sm bg-gradient-to-br from-violet-500 to-fuchsia-500 opacity-60" />
            <span className="text-lg font-medium tracking-tight">{name}</span>
          </div>
        ))}
      </div>
      <style>{`.mask-fade { mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent); }`}</style>
    </div>
  );
}

export default function LogoMarquee() {
  return (
    <section className="py-16 md:py-20 border-y border-white/[0.06] bg-zinc-950/40">
      <div className="mx-auto max-w-7xl px-6">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-zinc-500 mb-10">
          Built for traders on every prop firm & broker
        </p>
        <div className="space-y-6">
          <Row items={ROW_A} />
          <Row items={ROW_B} reverse />
        </div>
      </div>
    </section>
  );
}
