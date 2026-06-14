"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function GlobeCanvas({ size }: { size: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const rotRef = useRef<number>(0);
  const geoRef = useRef<any>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 10;

    // City dots [lon, lat] in degrees
    const cities: [number, number][] = [
      [-0.1,  51.5],  // London
      [-74,   40.7],  // New York
      [2.35,  48.85], // Paris
      [139.7, 35.7],  // Tokyo
      [121.5, 31.2],  // Shanghai
      [77.2,  28.6],  // Delhi
      [151.2,-33.9],  // Sydney
      [-43.2,-22.9],  // Rio
      [37.6,  55.8],  // Moscow
      [31.2,  30.1],  // Cairo
    ];

    // Load d3-geo + topojson + world data
    Promise.all([
      import("d3-geo"),
      import("topojson-client"),
      import("world-atlas/countries-110m.json"),
    ]).then(([d3geo, topo, worldMod]) => {
      const world = (worldMod as any).default ?? worldMod;
      const countries = (topo as any).feature(world, world.objects.countries);
      const graticule = (d3geo as any).geoGraticule()();

      const makeProjection = (rot: number) =>
        (d3geo as any).geoOrthographic()
          .scale(r)
          .translate([cx, cy])
          .rotate([rot, -20, 0])
          .clipAngle(90);

      geoRef.current = {
        pathGen: (rot: number) => (d3geo as any).geoPath(makeProjection(rot), ctx),
        graticule,
        countries,
      };
    });

    function draw() {
      ctx.clearRect(0, 0, size, size);
      const rot = rotRef.current;
      const rotDeg = (rot * 180) / Math.PI;

      // Sphere base gradient
      const sphereGrad = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, r * 0.04, cx, cy, r);
      sphereGrad.addColorStop(0, "rgba(55,25,95,0.65)");
      sphereGrad.addColorStop(0.45, "rgba(18,10,45,0.85)");
      sphereGrad.addColorStop(1, "rgba(3,1,12,0.97)");
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = sphereGrad;
      ctx.fill();
      ctx.restore();

      if (geoRef.current) {
        const { graticule, countries } = geoRef.current;

        // Re-create projection each frame (cheap)
        const proj = (geoRef.current.pathGen as any)(rotDeg);

        // Graticule (faint grid)
        ctx.beginPath();
        proj(graticule);
        ctx.strokeStyle = "rgba(96,165,250,0.10)";
        ctx.lineWidth = 0.45;
        ctx.stroke();

        // Country borders
        ctx.beginPath();
        proj(countries);
        ctx.strokeStyle = "rgba(167,139,250,0.60)";
        ctx.lineWidth = 0.65;
        ctx.stroke();
      }

      // City dots — projected manually (cheap, no d3 needed per dot)
      for (const [lonDeg, latDeg] of cities) {
        const lon = ((lonDeg - rotDeg) * Math.PI) / 180;
        const lat = (latDeg * Math.PI) / 180;
        const x = Math.cos(lat) * Math.sin(lon);
        const y = Math.sin(lat);
        const z = Math.cos(lat) * Math.cos(lon);
        if (z < 0.05) continue;
        const sx = cx + r * x;
        const sy = cy - r * y;
        const alpha = Math.min(1, z * 1.5);
        const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, 8);
        grd.addColorStop(0, `rgba(210,185,255,${alpha * 0.6})`);
        grd.addColorStop(1, "rgba(139,92,246,0)");
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx, sy, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,200,255,${alpha})`;
        ctx.fill();
      }

      // Atmosphere rim
      const rimGrad = ctx.createRadialGradient(cx, cy, r * 0.86, cx, cy, r + 2);
      rimGrad.addColorStop(0, "rgba(139,92,246,0)");
      rimGrad.addColorStop(0.5, "rgba(139,92,246,0.24)");
      rimGrad.addColorStop(1, "rgba(96,165,250,0.05)");
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
      ctx.fillStyle = rimGrad;
      ctx.fill();
      ctx.restore();

      rotRef.current += 0.003;
      rafRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(rafRef.current);
  }, [size]);

  return <canvas ref={canvasRef} style={{ display: "block" }} />;
}

const GLOBE_SIZE = 400;

export default function AIMarketInsightsTeaser() {
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes aiPulseRing  { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.08);opacity:.16} }
        @keyframes aiPulseRing2 { 0%,100%{transform:scale(1);opacity:.3} 50%{transform:scale(1.14);opacity:.07} }
        @keyframes aiPulseRing3 { 0%,100%{transform:scale(1);opacity:.14} 50%{transform:scale(1.2);opacity:.03} }
        @keyframes aiOrbit1 {
          from { transform: rotate(0deg)   translateX(218px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(218px) rotate(-360deg); }
        }
        @keyframes aiOrbit2 {
          from { transform: rotate(200deg) translateX(164px) rotate(-200deg); }
          to   { transform: rotate(560deg) translateX(164px) rotate(-560deg); }
        }
        @keyframes aiFloat1 { 0%,100%{transform:translateY(0) rotate(-1.5deg)} 50%{transform:translateY(-14px) rotate(-1.5deg)} }
        @keyframes aiFloat2 { 0%,100%{transform:translateY(0) rotate(1.2deg)}  50%{transform:translateY(-10px) rotate(1.2deg)} }
        @keyframes aiFloat3 { 0%,100%{transform:translateY(0) rotate(-1.2deg)} 50%{transform:translateY(-16px) rotate(-1.2deg)} }
        @keyframes aiFloat4 { 0%,100%{transform:translateY(0) rotate(1.8deg)}  50%{transform:translateY(-12px) rotate(1.8deg)} }
        @keyframes aiShimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes aiDotPulse {
          0%,100%{opacity:1;transform:scale(1);box-shadow:0 0 16px rgba(139,92,246,1),0 0 6px rgba(139,92,246,1)}
          50%{opacity:.5;transform:scale(1.5);box-shadow:0 0 28px rgba(139,92,246,.7)}
        }
        @keyframes aiGlobePulse {
          0%,100%{box-shadow:0 0 90px rgba(139,92,246,.5),0 0 220px rgba(139,92,246,.18),0 0 45px rgba(139,92,246,.35)}
          50%{box-shadow:0 0 130px rgba(139,92,246,.65),0 0 300px rgba(139,92,246,.26),0 0 65px rgba(139,92,246,.48)}
        }
        @keyframes aiMarquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .ai-card {
          transition: transform .32s cubic-bezier(.175,.885,.32,1.275), box-shadow .32s ease, border-color .32s ease;
          position: relative; overflow: hidden;
        }
        .ai-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,.11),transparent);
          pointer-events:none;
        }
        .ai-card-red    { border-left: 2.5px solid rgba(239,68,68,.55) !important; }
        .ai-card-amber  { border-left: 2.5px solid rgba(245,158,11,.5) !important; }
        .ai-card-purple { border-left: 2.5px solid rgba(139,92,246,.5) !important; }
        .ai-card-red:hover    { transform:translateY(-5px) !important; box-shadow:0 36px 80px rgba(0,0,0,.9),0 0 48px rgba(239,68,68,.22) !important; border-color:rgba(239,68,68,.6) !important; }
        .ai-card-amber:hover  { transform:translateY(-5px) !important; box-shadow:0 36px 80px rgba(0,0,0,.9),0 0 44px rgba(245,158,11,.2)  !important; border-color:rgba(245,158,11,.55) !important; }
        .ai-card-purple:hover { transform:translateY(-5px) !important; box-shadow:0 36px 80px rgba(0,0,0,.9),0 0 48px rgba(139,92,246,.26) !important; border-color:rgba(139,92,246,.55) !important; }
        @media (max-width:1100px) {
          .ai-main-grid { grid-template-columns:1fr !important; }
          .ai-side-cards { flex-direction:row !important; flex-wrap:wrap; justify-content:center; align-items:flex-start !important; }
          .ai-side-cards > * { max-width:300px !important; width:calc(50% - 10px) !important; min-width:260px; }
          .ai-orb-col { order:-1; }
        }
        @media (max-width:640px) {
          .ai-side-cards > * { width:100% !important; max-width:100% !important; }
        }
      `}</style>

      <section
        ref={sectionRef}
        id="ai-insights"
        style={{ backgroundColor: "#000000", padding: "148px 0 172px", position: "relative", overflow: "hidden" }}
      >
        {/* Background layers */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {/* Central glow behind globe */}
          <div style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-52%)",
            width: "900px", height: "900px",
            background: "radial-gradient(ellipse at center, rgba(139,92,246,0.17) 0%, rgba(59,130,246,0.06) 42%, transparent 68%)",
            filter: "blur(65px)",
          }} />
          <div style={{
            position: "absolute", top: "-110px", left: "50%", transform: "translateX(-50%)",
            width: "1300px", height: "750px",
            background: "radial-gradient(ellipse at center top, rgba(139,92,246,0.16) 0%, rgba(59,130,246,0.06) 42%, transparent 70%)",
            filter: "blur(80px)",
          }} />
          <div style={{
            position: "absolute", bottom: "-120px", left: "0%",
            width: "650px", height: "550px",
            background: "radial-gradient(ellipse at center, rgba(59,130,246,0.08) 0%, transparent 65%)",
            filter: "blur(100px)",
          }} />
          <div style={{
            position: "absolute", top: "8%", right: "-2%",
            width: "520px", height: "520px",
            background: "radial-gradient(ellipse at center, rgba(139,92,246,0.07) 0%, transparent 65%)",
            filter: "blur(75px)",
          }} />
        </div>

        {/* Dot-grid */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.11) 1px, transparent 1px)",
          backgroundSize: "36px 36px",
          maskImage: "radial-gradient(ellipse 72% 82% at 50% 50%, black 22%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 72% 82% at 50% 50%, black 22%, transparent 100%)",
        }} />

        {/* Edge fades */}
        <div style={{ position:"absolute",top:0,left:0,right:0,height:"130px",background:"linear-gradient(to bottom,rgba(0,0,0,.55),transparent)",pointerEvents:"none" }} />
        <div style={{ position:"absolute",bottom:0,left:0,right:0,height:"130px",background:"linear-gradient(to top,rgba(0,0,0,.55),transparent)",pointerEvents:"none" }} />

        <div style={{ maxWidth: "1260px", margin: "0 auto", padding: "0 24px", position: "relative", zIndex: 10 }}>

          {/* Badge */}
          <div style={{
            display: "flex", justifyContent: "center", marginBottom: "30px",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(22px)",
            transition: "opacity .7s ease, transform .7s ease",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "10px",
              padding: "8px 20px 8px 14px", borderRadius: "999px",
              background: "linear-gradient(135deg, rgba(139,92,246,0.14) 0%, rgba(59,130,246,0.08) 100%)",
              border: "1px solid rgba(139,92,246,0.32)", backdropFilter: "blur(18px)",
            }}>
              <span style={{
                width: "7px", height: "7px", borderRadius: "50%", background: "#8B5CF6", flexShrink: 0,
                animation: "aiDotPulse 2.2s ease-in-out infinite",
              }} />
              <span style={{
                fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.13em", textTransform: "uppercase",
                background: "linear-gradient(90deg, #A78BFA, #818CF8, #60A5FA)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
              }}>AI Intelligence · Pro Exclusive</span>
              <span style={{
                fontSize: "9px", fontWeight: 800, padding: "2px 7px", borderRadius: "5px",
                background: "rgba(139,92,246,0.18)", border: "1px solid rgba(139,92,246,0.35)",
                color: "#A78BFA", letterSpacing: "0.06em",
              }}>COMING SOON</span>
            </div>
          </div>

          {/* Headline */}
          <div style={{
            textAlign: "center", marginBottom: "22px",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)",
            transition: "opacity .75s ease .12s, transform .75s ease .12s",
          }}>
            <h2 style={{
              fontFamily: "'Space Grotesk', var(--font-space-grotesk), sans-serif",
              fontSize: "clamp(2.8rem, 6.5vw, 5.6rem)",
              fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.035em",
              color: "#F9FAFB", margin: 0,
            }}>
              Market News.{" "}
              <span style={{
                background: "linear-gradient(135deg, #C4B5FD 0%, #818CF8 30%, #60A5FA 60%, #A78BFA 100%)",
                backgroundSize: "200% auto",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                animation: "aiShimmer 6s linear infinite", display: "inline-block",
              }}>Decoded by AI.</span>
            </h2>
          </div>

          {/* Sub */}
          <div style={{
            textAlign: "center", maxWidth: "580px", margin: "0 auto 34px",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity .75s ease .24s, transform .75s ease .24s",
          }}>
            <p style={{ fontSize: "18px", lineHeight: 1.7, color: "#9CA3AF", margin: 0 }}>
              Reuters, Bloomberg & 6 more sources — rewritten by AI into{" "}
              <strong style={{ color: "#C4B5FD", fontWeight: 600 }}>clear if/then scenarios</strong>{" "}
              so you know exactly what every headline means for your open positions.
            </p>
          </div>

          {/* Sources marquee */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "68px",
            opacity: visible ? 1 : 0, transition: "opacity .7s ease .38s",
          }}>
            <span style={{ fontSize: "10px", color: "#374151", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Powered by</span>
            <div style={{ width: "100%", overflow: "hidden", position: "relative", maxWidth: "680px" }}>
              <div style={{ position:"absolute",left:0,top:0,bottom:0,width:"80px",zIndex:2,background:"linear-gradient(to right,#000,transparent)",pointerEvents:"none" }} />
              <div style={{ position:"absolute",right:0,top:0,bottom:0,width:"80px",zIndex:2,background:"linear-gradient(to left,#000,transparent)",pointerEvents:"none" }} />
              <div style={{ display:"flex", gap:"9px", animation:"aiMarquee 20s linear infinite", width:"max-content" }}>
                {[...Array(2)].flatMap(() =>
                  ["ForexLive","FXStreet","DailyFX","Reuters","Bloomberg","ForexFactory","Investing.com","Finnhub"].map((src, i) => (
                    <span key={src + i} style={{
                      fontSize: "11.5px", fontWeight: 600, padding: "5px 15px", borderRadius: "999px",
                      background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                      color: "#4B5563", whiteSpace: "nowrap",
                    }}>{src}</span>
                  ))
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{
                width: "6px", height: "6px", borderRadius: "50%", background: "#10B981",
                boxShadow: "0 0 10px rgba(16,185,129,.9)", animation: "aiDotPulse 2.5s ease-in-out infinite",
              }} />
              <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: 500 }}>Updated every 15 minutes</span>
            </div>
          </div>

          {/* 3-column grid */}
          <div className="ai-main-grid" style={{
            display: "grid", gridTemplateColumns: `1fr ${GLOBE_SIZE}px 1fr`,
            gap: "36px", alignItems: "center",
            opacity: visible ? 1 : 0, transition: "opacity 1.1s ease .5s",
          }}>

            {/* LEFT CARDS */}
            <div className="ai-side-cards" style={{ display:"flex", flexDirection:"column", gap:"18px", alignItems:"flex-end" }}>

              {/* Card 1: HIGH — Fed */}
              <div className="ai-card ai-card-red" style={{
                width:"100%", maxWidth:"318px", padding:"20px 20px 17px", borderRadius:"16px",
                background:"linear-gradient(150deg,rgba(14,6,24,.98) 0%,rgba(8,3,15,1) 100%)",
                border:"1px solid rgba(239,68,68,.23)", backdropFilter:"blur(28px)",
                boxShadow:"0 20px 56px rgba(0,0,0,.85),inset 0 0 0 .5px rgba(255,255,255,.04)",
                animation:"aiFloat1 6.5s ease-in-out infinite", cursor:"default",
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"11px" }}>
                  <span style={{
                    display:"inline-flex", alignItems:"center", gap:"5px",
                    fontSize:"9.5px", fontWeight:800, textTransform:"uppercase", letterSpacing:".1em",
                    color:"#EF4444", padding:"3px 9px", borderRadius:"6px",
                    background:"linear-gradient(90deg,rgba(239,68,68,.14),rgba(239,68,68,.07))",
                    border:"1px solid rgba(239,68,68,.25)",
                  }}>⚡ HIGH IMPACT</span>
                  <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                    <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#EF4444", opacity:.7, display:"inline-block" }} />
                    <span style={{ fontSize:"10px", color:"#4B5563" }}>Reuters · 2m</span>
                  </div>
                </div>
                <p style={{ fontSize:"13.5px", fontWeight:700, color:"#F3F4F6", margin:"0 0 6px", lineHeight:1.38 }}>
                  Fed Powell signals higher-for-longer — DXY surges past 106
                </p>
                <p style={{ fontSize:"10.5px", color:"#6B7280", lineHeight:1.65, margin:"0 0 12px" }}>
                  Rate-cut expectations pushed to Q4. Markets repriced across all major USD pairs.
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginBottom:"12px" }}>
                  {[
                    { cond:"DXY breaks 106.50", res:"EURUSD tests 1.0650 support" },
                    { cond:"10Y yields hold 4.5%+", res:"XAUUSD faces downward pressure" },
                  ].map(({ cond, res }) => (
                    <div key={cond} style={{
                      fontSize:"10.5px", padding:"7px 10px", borderRadius:"8px",
                      background:"linear-gradient(135deg,rgba(239,68,68,.08),rgba(239,68,68,.04))",
                      border:"1px solid rgba(239,68,68,.13)",
                    }}>
                      <div style={{ color:"#6B7280", marginBottom:"3px", fontSize:"10px" }}>if {cond}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                        <span style={{ color:"#EF4444", fontWeight:800, fontSize:"9px" }}>→</span>
                        <span style={{ color:"#FCA5A5", fontWeight:700 }}>{res}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                  {["DXY","EURUSD","XAUUSD"].map(s => (
                    <span key={s} style={{
                      fontSize:"9.5px", fontWeight:700, padding:"2px 8px", borderRadius:"5px",
                      background:"rgba(239,68,68,.09)", color:"#FCA5A5", border:"1px solid rgba(239,68,68,.16)",
                    }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Card 3: MEDIUM — Retail Sales */}
              <div className="ai-card ai-card-amber" style={{
                width:"100%", maxWidth:"295px", padding:"20px 20px 17px", borderRadius:"16px",
                background:"linear-gradient(150deg,rgba(14,6,24,.98) 0%,rgba(8,3,15,1) 100%)",
                border:"1px solid rgba(245,158,11,.19)", backdropFilter:"blur(28px)",
                boxShadow:"0 20px 56px rgba(0,0,0,.85),inset 0 0 0 .5px rgba(255,255,255,.04)",
                animation:"aiFloat3 5.8s ease-in-out infinite 1.1s", cursor:"default",
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"11px" }}>
                  <span style={{
                    display:"inline-flex", alignItems:"center", gap:"5px",
                    fontSize:"9.5px", fontWeight:800, textTransform:"uppercase", letterSpacing:".1em",
                    color:"#F59E0B", padding:"3px 9px", borderRadius:"6px",
                    background:"linear-gradient(90deg,rgba(245,158,11,.12),rgba(245,158,11,.06))",
                    border:"1px solid rgba(245,158,11,.2)",
                  }}>◉ MEDIUM</span>
                  <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                    <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#F59E0B", opacity:.7, display:"inline-block" }} />
                    <span style={{ fontSize:"10px", color:"#4B5563" }}>DailyFX · 18m</span>
                  </div>
                </div>
                <p style={{ fontSize:"13.5px", fontWeight:700, color:"#F3F4F6", margin:"0 0 6px", lineHeight:1.38 }}>
                  US Retail Sales beat — consumer resilience intact
                </p>
                <p style={{ fontSize:"10.5px", color:"#6B7280", lineHeight:1.65, margin:"0 0 12px" }}>
                  +0.5% MoM vs +0.3% expected. Spending signals no recession imminent.
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginBottom:"12px" }}>
                  <div style={{
                    fontSize:"10.5px", padding:"7px 10px", borderRadius:"8px",
                    background:"linear-gradient(135deg,rgba(245,158,11,.08),rgba(245,158,11,.04))",
                    border:"1px solid rgba(245,158,11,.13)",
                  }}>
                    <div style={{ color:"#6B7280", marginBottom:"3px", fontSize:"10px" }}>if SPX breaks 5,400</div>
                    <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                      <span style={{ color:"#F59E0B", fontWeight:800, fontSize:"9px" }}>→</span>
                      <span style={{ color:"#FDE68A", fontWeight:700 }}>risk-on boosts AUD, NZD vs USD</span>
                    </div>
                  </div>
                </div>
                <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                  {["USDJPY","GBPUSD","SPX"].map(s => (
                    <span key={s} style={{
                      fontSize:"9.5px", fontWeight:700, padding:"2px 8px", borderRadius:"5px",
                      background:"rgba(245,158,11,.08)", color:"#FDE68A", border:"1px solid rgba(245,158,11,.15)",
                    }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* CENTER: Globe */}
            <div className="ai-orb-col" style={{ display:"flex", justifyContent:"center", alignItems:"center" }}>
              <div style={{ position:"relative", width:`${GLOBE_SIZE}px`, height:`${GLOBE_SIZE}px` }}>
                <div style={{ position:"absolute", inset:"-92px", borderRadius:"50%", border:"1px solid rgba(139,92,246,.07)", animation:"aiPulseRing3 6s ease-in-out infinite 3s" }} />
                <div style={{ position:"absolute", inset:"-52px", borderRadius:"50%", border:"1px solid rgba(139,92,246,.15)", animation:"aiPulseRing2 4.5s ease-in-out infinite 1.8s" }} />
                <div style={{ position:"absolute", inset:"-20px", borderRadius:"50%", border:"1px solid rgba(139,92,246,.3)", animation:"aiPulseRing 3.4s ease-in-out infinite" }} />
                <div style={{
                  position:"absolute", inset:0, borderRadius:"50%",
                  border:"1px solid rgba(139,92,246,.62)", overflow:"hidden",
                  animation:"aiGlobePulse 4s ease-in-out infinite",
                }}>
                  {/* Specular highlight */}
                  <div style={{
                    position:"absolute", top:"7%", left:"11%", width:"36%", height:"30%",
                    background:"radial-gradient(ellipse at center,rgba(255,255,255,.09) 0%,transparent 70%)",
                    borderRadius:"50%", zIndex:2, pointerEvents:"none",
                  }} />
                  <GlobeCanvas size={GLOBE_SIZE} />
                </div>
                <div style={{ position:"absolute", top:"50%", left:"50%", width:0, height:0, animation:"aiOrbit1 10s linear infinite" }}>
                  <div style={{ width:"10px", height:"10px", borderRadius:"50%", background:"#8B5CF6", boxShadow:"0 0 20px rgba(139,92,246,1),0 0 8px rgba(139,92,246,1)", marginLeft:"-5px", marginTop:"-5px" }} />
                </div>
                <div style={{ position:"absolute", top:"50%", left:"50%", width:0, height:0, animation:"aiOrbit2 16s linear infinite" }}>
                  <div style={{ width:"6px", height:"6px", borderRadius:"50%", background:"#60A5FA", boxShadow:"0 0 16px rgba(96,165,250,1)", marginLeft:"-3px", marginTop:"-3px" }} />
                </div>
              </div>
            </div>

            {/* RIGHT CARDS */}
            <div className="ai-side-cards" style={{ display:"flex", flexDirection:"column", gap:"18px" }}>

              {/* Card 2: HIGH — CPI */}
              <div className="ai-card ai-card-red" style={{
                width:"100%", maxWidth:"318px", padding:"20px 20px 17px", borderRadius:"16px",
                background:"linear-gradient(150deg,rgba(14,6,24,.98) 0%,rgba(8,3,15,1) 100%)",
                border:"1px solid rgba(239,68,68,.23)", backdropFilter:"blur(28px)",
                boxShadow:"0 20px 56px rgba(0,0,0,.85),inset 0 0 0 .5px rgba(255,255,255,.04)",
                animation:"aiFloat2 7.2s ease-in-out infinite 1.5s", cursor:"default",
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"11px" }}>
                  <span style={{
                    display:"inline-flex", alignItems:"center", gap:"5px",
                    fontSize:"9.5px", fontWeight:800, textTransform:"uppercase", letterSpacing:".1em",
                    color:"#EF4444", padding:"3px 9px", borderRadius:"6px",
                    background:"linear-gradient(90deg,rgba(239,68,68,.14),rgba(239,68,68,.07))",
                    border:"1px solid rgba(239,68,68,.25)",
                  }}>⚡ HIGH IMPACT</span>
                  <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                    <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#EF4444", opacity:.7, display:"inline-block" }} />
                    <span style={{ fontSize:"10px", color:"#4B5563" }}>ForexLive · 7m</span>
                  </div>
                </div>
                <p style={{ fontSize:"13.5px", fontWeight:700, color:"#F3F4F6", margin:"0 0 6px", lineHeight:1.38 }}>
                  Core CPI beats at 3.6% — inflation not dead yet
                </p>
                <p style={{ fontSize:"10.5px", color:"#6B7280", lineHeight:1.65, margin:"0 0 12px" }}>
                  3.6% YoY vs 3.4% expected. USD spiked, rate-cut timeline pushed back sharply.
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginBottom:"12px" }}>
                  {[
                    { cond:"EURUSD breaks 1.0700", res:"next support at 1.0620" },
                    { cond:"Gold holds $2,300+", res:"safe-haven demand offsets USD" },
                  ].map(({ cond, res }) => (
                    <div key={cond} style={{
                      fontSize:"10.5px", padding:"7px 10px", borderRadius:"8px",
                      background:"linear-gradient(135deg,rgba(239,68,68,.08),rgba(239,68,68,.04))",
                      border:"1px solid rgba(239,68,68,.13)",
                    }}>
                      <div style={{ color:"#6B7280", marginBottom:"3px", fontSize:"10px" }}>if {cond}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                        <span style={{ color:"#EF4444", fontWeight:800, fontSize:"9px" }}>→</span>
                        <span style={{ color:"#FCA5A5", fontWeight:700 }}>{res}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                  {["EURUSD","GBPUSD","XAUUSD"].map(s => (
                    <span key={s} style={{
                      fontSize:"9.5px", fontWeight:700, padding:"2px 8px", borderRadius:"5px",
                      background:"rgba(239,68,68,.09)", color:"#FCA5A5", border:"1px solid rgba(239,68,68,.16)",
                    }}>{s}</span>
                  ))}
                </div>
              </div>

              {/* Card 4: NFP Preview */}
              <div className="ai-card ai-card-purple" style={{
                width:"100%", maxWidth:"295px", padding:"20px 20px 17px", borderRadius:"16px",
                background:"linear-gradient(150deg,rgba(14,6,24,.98) 0%,rgba(8,3,15,1) 100%)",
                border:"1px solid rgba(139,92,246,.21)", backdropFilter:"blur(28px)",
                boxShadow:"0 20px 56px rgba(0,0,0,.85),inset 0 0 0 .5px rgba(255,255,255,.04)",
                animation:"aiFloat4 6.8s ease-in-out infinite 2.4s", cursor:"default",
              }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"11px" }}>
                  <span style={{
                    display:"inline-flex", alignItems:"center", gap:"5px",
                    fontSize:"9.5px", fontWeight:800, textTransform:"uppercase", letterSpacing:".1em",
                    color:"#A78BFA", padding:"3px 9px", borderRadius:"6px",
                    background:"linear-gradient(90deg,rgba(139,92,246,.13),rgba(139,92,246,.06))",
                    border:"1px solid rgba(139,92,246,.22)",
                  }}>📅 NFP PREVIEW</span>
                  <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                    <span style={{ width:"5px", height:"5px", borderRadius:"50%", background:"#8B5CF6", opacity:.7, display:"inline-block" }} />
                    <span style={{ fontSize:"10px", color:"#4B5563" }}>ForexFactory · 1h</span>
                  </div>
                </div>
                <p style={{ fontSize:"13.5px", fontWeight:700, color:"#F3F4F6", margin:"0 0 6px", lineHeight:1.38 }}>
                  Non-Farm Payrolls today — expect 50–80 pip volatility
                </p>
                <p style={{ fontSize:"10.5px", color:"#6B7280", lineHeight:1.65, margin:"0 0 12px" }}>
                  Consensus at 185k. A ±30k surprise typically triggers major moves on USD pairs.
                </p>
                <div style={{ display:"flex", flexDirection:"column", gap:"5px", marginBottom:"12px" }}>
                  {[
                    { cond:"NFP > 215k", res:"USD strength, risk assets under pressure" },
                    { cond:"NFP < 155k", res:"rate-cut bets rise, DXY sells off" },
                  ].map(({ cond, res }) => (
                    <div key={cond} style={{
                      fontSize:"10.5px", padding:"7px 10px", borderRadius:"8px",
                      background:"linear-gradient(135deg,rgba(139,92,246,.08),rgba(139,92,246,.04))",
                      border:"1px solid rgba(139,92,246,.13)",
                    }}>
                      <div style={{ color:"#6B7280", marginBottom:"3px", fontSize:"10px" }}>if {cond}</div>
                      <div style={{ display:"flex", alignItems:"center", gap:"5px" }}>
                        <span style={{ color:"#8B5CF6", fontWeight:800, fontSize:"9px" }}>→</span>
                        <span style={{ color:"#C4B5FD", fontWeight:700 }}>{res}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", gap:"5px", flexWrap:"wrap" }}>
                  {["DXY","EURUSD","USDJPY"].map(s => (
                    <span key={s} style={{
                      fontSize:"9.5px", fontWeight:700, padding:"2px 8px", borderRadius:"5px",
                      background:"rgba(139,92,246,.1)", color:"#C4B5FD", border:"1px solid rgba(139,92,246,.17)",
                    }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div style={{
            textAlign:"center", marginTop:"96px",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity .75s ease 1s, transform .75s ease 1s",
          }}>
            <div style={{ display:"flex", justifyContent:"center", gap:"8px", marginBottom:"28px", flexWrap:"wrap" }}>
              {[
                { icon:"⚡", text:"Real-time impact scoring" },
                { icon:"🔗", text:"Correlated pair alerts" },
                { icon:"📊", text:"Event-driven if/then scenarios" },
              ].map(({ icon, text }) => (
                <span key={text} style={{
                  display:"inline-flex", alignItems:"center", gap:"6px",
                  fontSize:"11.5px", fontWeight:600, padding:"6px 14px", borderRadius:"999px",
                  background:"rgba(139,92,246,.08)", border:"1px solid rgba(139,92,246,.18)",
                  color:"#7C6FCD",
                }}>{icon} {text}</span>
              ))}
            </div>
            <Link
              href="/register"
              style={{
                display:"inline-flex", alignItems:"center", gap:"10px",
                padding:"18px 50px", borderRadius:"14px",
                background:"linear-gradient(135deg,#7C3AED 0%,#8B5CF6 50%,#6D28D9 100%)",
                color:"#F9FAFB", fontSize:"17px", fontWeight:700,
                textDecoration:"none",
                boxShadow:"0 12px 40px rgba(139,92,246,.55),0 0 0 1px rgba(139,92,246,.3)",
                transition:"transform .22s ease, box-shadow .22s ease",
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.transform = "translateY(-3px) scale(1.02)";
                el.style.boxShadow = "0 24px 60px rgba(139,92,246,.72),0 0 0 1px rgba(139,92,246,.5)";
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLAnchorElement;
                el.style.transform = "";
                el.style.boxShadow = "0 12px 40px rgba(139,92,246,.55),0 0 0 1px rgba(139,92,246,.3)";
              }}
            >
              Get Early Access
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <path d="M4 10h12M11 5l5 5-5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <p style={{ fontSize:"12.5px", color:"#374151", marginTop:"16px" }}>
              Launching Q3 2026 &nbsp;·&nbsp; Exclusive to Pro &nbsp;·&nbsp; No credit card required
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
