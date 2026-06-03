"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

interface Props {
  userName: string;
  onComplete: () => void;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  size: number; opacity: number;
  color: string;
  life: number; maxLife: number;
  type: "star" | "burst";
  twinkleOffset: number;
}

const COLORS = [
  "#8B5CF6", "#A78BFA", "#C4B5FD",
  "#6366F1", "#818CF8",
  "#3B82F6", "#60A5FA",
  "#ffffff", "#E0E7FF",
];

export default function WelcomeScreen({ userName, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const burstFiredRef = useRef(false);
  const tickRef = useRef(0);

  const [logoVisible, setLogoVisible] = useState(false);
  const [logoPulsing, setLogoPulsing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showName, setShowName] = useState(false);
  const [showDivider, setShowDivider] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [done, setDone] = useState(false);

  const firstName = userName.split(" ")[0] || userName;

  const fireBurst = useCallback(() => {
    if (burstFiredRef.current) return;
    burstFiredRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 - 90;

    for (let i = 0; i < 100; i++) {
      const angle = (Math.PI * 2 * i) / 100 + (Math.random() - 0.5) * 0.5;
      const speed = 1.8 + Math.random() * 5.5;
      const life = Math.floor(55 + Math.random() * 75);
      particlesRef.current.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.8,
        size: 1 + Math.random() * 3.8,
        opacity: 0.6 + Math.random() * 0.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        life, maxLife: life,
        type: "burst",
        twinkleOffset: 0,
      });
    }
  }, []);

  const handleExit = useCallback(() => {
    if (exiting || done) return;
    setExiting(true);
    setTimeout(() => { setDone(true); onComplete(); }, 950);
  }, [exiting, done, onComplete]);

  // Timeline
  useEffect(() => {
    const t: ReturnType<typeof setTimeout>[] = [];
    t.push(setTimeout(() => setLogoVisible(true),   400));
    t.push(setTimeout(() => setLogoPulsing(true),   1900));
    t.push(setTimeout(() => fireBurst(),             2050));
    t.push(setTimeout(() => setShowWelcome(true),    2350));
    t.push(setTimeout(() => setShowName(true),       3100));
    t.push(setTimeout(() => setShowDivider(true),    3450));
    t.push(setTimeout(() => setShowSub(true),        3750));
    t.push(setTimeout(() => setShowHint(true),       5300));
    t.push(setTimeout(() => handleExit(),            6600));
    return () => t.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Canvas: stars + burst
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    particlesRef.current = Array.from({ length: 140 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      size: 0.3 + Math.random() * 1.8,
      opacity: 0.06 + Math.random() * 0.42,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      life: -1, maxLife: -1,
      type: "star" as const,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    function loop() {
      const ctx = canvas!.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      tickRef.current++;
      const tick = tickRef.current;
      const W = canvas!.width;
      const H = canvas!.height;
      const alive: Particle[] = [];

      for (const p of particlesRef.current) {
        if (p.type === "star") {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
          if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
          const tw = 0.2 + 0.5 * Math.abs(Math.sin(tick * 0.022 + p.twinkleOffset));
          ctx.globalAlpha = p.opacity * tw;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          alive.push(p);
        } else {
          p.life--;
          if (p.life <= 0) continue;
          p.x += p.vx; p.y += p.vy;
          p.vy += 0.032;
          p.vx *= 0.984; p.vy *= 0.984;
          const ratio = p.life / p.maxLife;
          if (p.size > 2) { ctx.shadowColor = p.color; ctx.shadowBlur = 7; }
          ctx.globalAlpha = p.opacity * ratio * ratio;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * Math.max(0.25, ratio), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          alive.push(p);
        }
      }

      ctx.globalAlpha = 1;
      particlesRef.current = alive;
      animRef.current = requestAnimationFrame(loop);
    }

    loop();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // Key to skip
  useEffect(() => {
    const fn = () => handleExit();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [handleExit]);

  if (done) return null;

  const welcomeChars = "Welcome,".split("");

  return (
    <>
      <style>{`
        @keyframes ws-letterIn {
          from { opacity:0; transform:translateY(20px); filter:blur(9px); }
          to   { opacity:1; transform:translateY(0);    filter:blur(0);   }
        }
        @keyframes ws-logoPulse {
          0%,100% {
            filter: drop-shadow(0 0 22px rgba(139,92,246,.55))
                    drop-shadow(0 0 50px rgba(99,102,241,.22));
          }
          50% {
            filter: drop-shadow(0 0 46px rgba(139,92,246,.90))
                    drop-shadow(0 0 90px rgba(99,102,241,.38))
                    drop-shadow(0 0 14px rgba(167,139,250,.70));
          }
        }
        @keyframes ws-orb1 {
          0%,100% { transform:translate(0,0) scale(1); }
          33%     { transform:translate(45px,-28px) scale(1.07); }
          66%     { transform:translate(-22px,18px) scale(0.93); }
        }
        @keyframes ws-orb2 {
          0%,100% { transform:translate(0,0) scale(1); }
          40%     { transform:translate(-32px,24px) scale(1.10); }
          72%     { transform:translate(20px,-14px) scale(0.91); }
        }
        @keyframes ws-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes ws-hintPulse {
          0%,100% { opacity:.38; }
          50%     { opacity:.60; }
        }
      `}</style>

      <div
        onClick={handleExit}
        style={{
          position: "fixed", inset: 0, zIndex: 99999,
          backgroundColor: "#03030c",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          cursor: "pointer", overflow: "hidden",
          userSelect: "none",
          opacity: exiting ? 0 : 1,
          transition: exiting ? "opacity 0.95s cubic-bezier(0.4,0,0.2,1)" : "none",
        }}
      >
        {/* Central radial glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 55% 45% at 50% 38%, rgba(109,40,217,0.09) 0%, transparent 70%)",
        }} />

        {/* Floating orb 1 */}
        <div style={{
          position: "absolute", top: "12%", left: "8%",
          width: 640, height: 640, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(109,40,217,0.09) 0%, transparent 65%)",
          animation: "ws-orb1 9s ease-in-out infinite",
        }} />

        {/* Floating orb 2 */}
        <div style={{
          position: "absolute", bottom: "8%", right: "6%",
          width: 520, height: 520, borderRadius: "50%", pointerEvents: "none",
          background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)",
          animation: "ws-orb2 12s ease-in-out infinite",
        }} />

        {/* Particle canvas */}
        <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

        {/* Main content */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>

          {/* Logo */}
          <div style={{
            marginBottom: 48,
            opacity: logoVisible ? 1 : 0,
            transform: logoVisible ? "scale(1)" : "scale(0.5)",
            transition: "opacity 1.15s cubic-bezier(0.34,1.56,0.64,1), transform 1.15s cubic-bezier(0.34,1.56,0.64,1)",
            ...(logoPulsing
              ? { animation: "ws-logoPulse 3s ease-in-out infinite" }
              : logoVisible
                ? { filter: "drop-shadow(0 0 22px rgba(139,92,246,.55)) drop-shadow(0 0 50px rgba(99,102,241,.22))" }
                : {}
            ),
          }}>
            <Image
              src="/logo-tj-transparent.png"
              alt="TJ TradeHub"
              width={160}
              height={160}
              priority
              draggable={false}
            />
          </div>

          {/* Text */}
          <div style={{ textAlign: "center" }}>

            {/* "Welcome," */}
            <div style={{
              fontSize: 13, fontWeight: 500,
              letterSpacing: "0.24em", textTransform: "uppercase",
              color: "#6B7280", marginBottom: 14, height: 20,
            }}>
              {showWelcome && welcomeChars.map((ch, i) => (
                <span key={i} style={{
                  display: "inline-block",
                  animation: `ws-letterIn 0.52s cubic-bezier(0.34,1.56,0.64,1) ${i * 50}ms both`,
                }}>
                  {ch}
                </span>
              ))}
            </div>

            {/* Name */}
            <div style={{
              fontSize: "clamp(52px, 8vw, 88px)",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1,
              marginBottom: 22,
              opacity: showName ? 1 : 0,
              transform: showName ? "translateY(0) scale(1)" : "translateY(32px) scale(0.94)",
              transition: "opacity 0.75s cubic-bezier(0.34,1.56,0.64,1), transform 0.75s cubic-bezier(0.34,1.56,0.64,1)",
              background: "linear-gradient(115deg, #F9FAFB 0%, #E0E7FF 25%, #C4B5FD 50%, #A78BFA 75%, #8B5CF6 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              ...(showName ? { animation: "ws-shimmer 5s linear infinite" } : {}),
            }}>
              {firstName}
            </div>

            {/* Divider line */}
            <div style={{
              margin: "0 auto 22px",
              height: 1,
              width: 110,
              background: "linear-gradient(90deg, transparent, #8B5CF6, #A78BFA, transparent)",
              transformOrigin: "center",
              transform: showDivider ? "scaleX(1)" : "scaleX(0)",
              transition: "transform 0.75s cubic-bezier(0.4,0,0.2,1)",
            }} />

            {/* "to TJ TradeHub" */}
            <div style={{
              fontSize: 13, fontWeight: 400,
              letterSpacing: "0.20em", textTransform: "uppercase",
              color: "#4B5563",
              opacity: showSub ? 1 : 0,
              transform: showSub ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.65s, transform 0.65s",
            }}>
              to TJ TradeHub
            </div>
          </div>
        </div>

        {/* Skip hint */}
        <div style={{
          position: "absolute", bottom: 38,
          fontSize: 11, color: "#4B5563",
          letterSpacing: "0.13em", textTransform: "uppercase",
          opacity: showHint ? 1 : 0,
          transition: "opacity 0.9s",
          animation: showHint ? "ws-hintPulse 2.5s ease-in-out infinite" : undefined,
        }}>
          Click anywhere to continue
        </div>
      </div>
    </>
  );
}
