"use client";

const T1 = [
  { name: "Marcus K.", role: "Forex / Prop", q: "Killed my spreadsheet on day 3. The discipline score is the part nobody else builds — and it's the only thing that moved my equity curve." },
  { name: "Sofia R.", role: "Futures / NQ", q: "I'd been faking journaling for two years. Auto-sync removes the excuse. I just trade, the journal builds itself." },
  { name: "James A.", role: "FTMO funded", q: "Cleared my $200k challenge after rebuilding around the weekly TJ reports. Found a 14% leak I never knew I had." },
  { name: "Niko M.", role: "Swing / Forex", q: "Strategy splits told me what I refused to believe — my favorite setup was my worst one. Brutal, but I needed it." },
];
const T2 = [
  { name: "Priya S.", role: "Indices / DAX", q: "The calendar heatmap turned my chaos into one obvious pattern: I'm bad on Wednesdays. I now don't trade Wednesdays." },
  { name: "Daniel V.", role: "Apex funded", q: "The MT5 connection just works. I plugged it in, drank coffee, and the trades were already there." },
  { name: "Anya L.", role: "Forex / Day", q: "Cleanest trading UI I've used. Doesn't feel like enterprise software — feels like something a trader actually built." },
  { name: "Tom B.", role: "Topstep combine", q: "$29/mo is laughable for what this does. I would pay 10x." },
];

function Card({ name, role, q }: { name: string; role: string; q: string }) {
  return (
    <div className="w-[360px] shrink-0 rounded-2xl border border-white/10 bg-zinc-950/70 backdrop-blur p-6">
      <div className="text-yellow-400 text-sm mb-3">★ ★ ★ ★ ★</div>
      <p className="text-zinc-200 text-[15px] leading-relaxed">&ldquo;{q}&rdquo;</p>
      <div className="mt-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 grid place-items-center text-sm font-semibold">
          {name.split(" ").map((s) => s[0]).join("")}
        </div>
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-zinc-500">{role}</div>
        </div>
      </div>
    </div>
  );
}

function Row({ items, reverse = false }: { items: typeof T1; reverse?: boolean }) {
  return (
    <div className="relative overflow-hidden mask-fade">
      <div className={`flex w-max gap-5 ${reverse ? "v2-marquee-track-rev" : "v2-marquee-track"}`}>
        {[...items, ...items].map((t, i) => <Card key={i} {...t} />)}
      </div>
      <style>{`.mask-fade { mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 6%, black 94%, transparent); }`}</style>
    </div>
  );
}

export default function TestimonialsMarquee() {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="mx-auto max-w-7xl px-6 mb-16">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.25em] text-violet-400 mb-3">Traders</p>
          <h2 className="text-4xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            Loved by traders who actually <span className="v2-aurora">log their trades</span>.
          </h2>
        </div>
      </div>
      <div className="space-y-5">
        <Row items={T1} />
        <Row items={T2} reverse />
      </div>
    </section>
  );
}
