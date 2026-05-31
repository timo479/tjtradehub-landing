"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number; y: number; r: number;
  baseOpacity: number; opacity: number;
  twinkleSpeed: number; twinkleOffset: number;
}

interface Orb {
  x: number; y: number;
  rx: number; ry: number;
  color: string;
  opacity: number;
  driftX: number; driftY: number;
  pulseSpeed: number; pulseOffset: number;
}

export default function HeroBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0, H = 0;
    let stars: Star[] = [];
    let orbs: Orb[] = [];

    function resize() {
      W = canvas!.offsetWidth;
      H = canvas!.offsetHeight;
      canvas!.width = W;
      canvas!.height = H;
      init();
    }

    function init() {
      // Stars
      stars = Array.from({ length: 180 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.1 + 0.2,
        baseOpacity: Math.random() * 0.5 + 0.15,
        opacity: 0,
        twinkleSpeed: Math.random() * 0.008 + 0.003,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));

      // Nebula orbs
      orbs = [
        { x: W * 0.18, y: H * 0.30, rx: W * 0.32, ry: H * 0.50, color: "139,92,246",  opacity: 0.13, driftX: 0.018, driftY: 0.010, pulseSpeed: 0.0007, pulseOffset: 0 },
        { x: W * 0.82, y: H * 0.28, rx: W * 0.28, ry: H * 0.44, color: "99,102,241",  opacity: 0.10, driftX:-0.014, driftY: 0.012, pulseSpeed: 0.0009, pulseOffset: 1.2 },
        { x: W * 0.50, y: H * 0.65, rx: W * 0.35, ry: H * 0.40, color: "167,139,250", opacity: 0.07, driftX: 0.010, driftY:-0.008, pulseSpeed: 0.0006, pulseOffset: 2.4 },
        { x: W * 0.72, y: H * 0.75, rx: W * 0.20, ry: H * 0.30, color: "79,70,229",   opacity: 0.08, driftX:-0.012, driftY:-0.010, pulseSpeed: 0.0010, pulseOffset: 0.8 },
        { x: W * 0.30, y: H * 0.72, rx: W * 0.22, ry: H * 0.32, color: "124,58,237",  opacity: 0.07, driftX: 0.014, driftY: 0.006, pulseSpeed: 0.0008, pulseOffset: 3.1 },
      ];
    }

    let t = 0;
    function draw() {
      t++;
      ctx!.clearRect(0, 0, W, H);

      // ── Nebula orbs ──
      for (const orb of orbs) {
        const pulse = 1 + 0.12 * Math.sin(t * orb.pulseSpeed + orb.pulseOffset);
        const px = orb.x + Math.sin(t * orb.driftX) * W * 0.04;
        const py = orb.y + Math.cos(t * orb.driftY) * H * 0.04;
        const grd = ctx!.createRadialGradient(px, py, 0, px, py, orb.rx * pulse);
        grd.addColorStop(0,   `rgba(${orb.color},${orb.opacity * 1.6})`);
        grd.addColorStop(0.4, `rgba(${orb.color},${orb.opacity * 0.7})`);
        grd.addColorStop(1,   `rgba(${orb.color},0)`);
        ctx!.save();
        ctx!.scale(1, orb.ry / orb.rx);
        ctx!.fillStyle = grd;
        ctx!.beginPath();
        ctx!.arc(px, py * (orb.rx / orb.ry), orb.rx * pulse, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }

      // ── Stars ──
      for (const s of stars) {
        s.opacity = s.baseOpacity * (0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset));
        ctx!.save();
        // Tiny glow on brighter stars
        if (s.r > 0.9) {
          const g = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3.5);
          g.addColorStop(0, `rgba(200,185,255,${s.opacity * 0.6})`);
          g.addColorStop(1, `rgba(200,185,255,0)`);
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.arc(s.x, s.y, s.r * 3.5, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.globalAlpha = s.opacity;
        ctx!.fillStyle = s.r > 0.8 ? "#E0D9FF" : "#A78BFA";
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
      }

      // ── Light beams from corners ──
      drawBeam(ctx!, 0,   0,   320, 240, "139,92,246", 0.055 + 0.015 * Math.sin(t * 0.004));
      drawBeam(ctx!, W,   0,   W - 300, 220, "99,102,241", 0.050 + 0.015 * Math.sin(t * 0.005 + 1));
      drawBeam(ctx!, 0,   H,   280, H - 200, "124,58,237", 0.040 + 0.010 * Math.sin(t * 0.003 + 2));
      drawBeam(ctx!, W,   H,   W - 260, H - 180, "99,102,241", 0.038 + 0.010 * Math.sin(t * 0.006 + 3));

      // ── Subtle abstract lines ──
      ctx!.save();
      ctx!.globalAlpha = 0.07;
      ctx!.strokeStyle = "#8B5CF6";
      ctx!.lineWidth = 0.6;
      const lines = [
        [0, H * 0.28, W * 0.42, 0],
        [W, H * 0.22, W * 0.60, 0],
        [0, H * 0.58, W * 0.28, H],
        [W, H * 0.62, W * 0.72, H],
        [W * 0.20, 0, W * 0.45, H],
        [W * 0.78, 0, W * 0.55, H],
      ];
      for (const [x1, y1, x2, y2] of lines) {
        ctx!.beginPath();
        ctx!.moveTo(x1, y1);
        ctx!.lineTo(x2, y2);
        ctx!.stroke();
      }
      ctx!.restore();

      rafRef.current = requestAnimationFrame(draw);
    }

    function drawBeam(
      c: CanvasRenderingContext2D,
      x1: number, y1: number, x2: number, y2: number,
      color: string, alpha: number
    ) {
      const grd = c.createLinearGradient(x1, y1, x2, y2);
      grd.addColorStop(0,   `rgba(${color},${alpha})`);
      grd.addColorStop(0.5, `rgba(${color},${alpha * 0.4})`);
      grd.addColorStop(1,   `rgba(${color},0)`);
      const angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
      const spread = 90;
      c.save();
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2 + Math.cos(angle) * spread, y2 + Math.sin(angle) * spread);
      c.lineTo(x2 - Math.cos(angle) * spread, y2 - Math.sin(angle) * spread);
      c.closePath();
      c.fillStyle = grd;
      c.fill();
      c.restore();
    }

    resize();
    draw();

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}
