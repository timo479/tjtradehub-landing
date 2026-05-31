"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number; y: number; r: number;
  baseOpacity: number;
  twinkleSpeed: number; twinkleOffset: number;
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
    let t = 0;

    interface Shoot { x:number;y:number;vx:number;vy:number;life:number;maxLife:number }
    let shoots: Shoot[] = [];
    let nextShoot = 120 + Math.random() * 300;

    function resize() {
      W = canvas!.offsetWidth;
      H = canvas!.offsetHeight;
      canvas!.width = W;
      canvas!.height = H;
      stars = Array.from({ length: 180 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.pow(Math.random(), 2.2) * 1.4 + 0.15,
        baseOpacity: Math.random() * 0.55 + 0.1,
        twinkleSpeed: Math.random() * 0.009 + 0.002,
        twinkleOffset: Math.random() * Math.PI * 2,
      }));
    }

    function drawStars() {
      for (const s of stars) {
        const op = s.baseOpacity * (0.45 + 0.55 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset));
        if (s.r > 0.9) {
          const g = ctx!.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4.5);
          g.addColorStop(0, `rgba(210,200,255,${op * 0.5})`);
          g.addColorStop(1, `rgba(210,200,255,0)`);
          ctx!.fillStyle = g;
          ctx!.beginPath();
          ctx!.arc(s.x, s.y, s.r * 4.5, 0, Math.PI * 2);
          ctx!.fill();
        }
        ctx!.globalAlpha = op;
        ctx!.fillStyle = s.r > 1.0 ? "#EDE8FF" : "#9B8EC4";
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1;
      }
    }

    function drawBeams() {
      const beams = [
        { x1: 0,   y1: 0,   x2: W * 0.38, y2: H * 0.50, r: 120, g: 60,  b: 240, a: 0.045 },
        { x1: W,   y1: 0,   x2: W * 0.62, y2: H * 0.45, r: 88,  g: 52,  b: 220, a: 0.038 },
        { x1: 0,   y1: H,   x2: W * 0.30, y2: H * 0.52, r: 100, g: 40,  b: 210, a: 0.030 },
        { x1: W,   y1: H,   x2: W * 0.70, y2: H * 0.55, r: 80,  g: 60,  b: 230, a: 0.028 },
      ];
      for (const [i, b] of beams.entries()) {
        const pulse = b.a + 0.015 * Math.sin(t * 0.004 + i * 1.4);
        const grd = ctx!.createLinearGradient(b.x1, b.y1, b.x2, b.y2);
        grd.addColorStop(0,   `rgba(${b.r},${b.g},${b.b},${pulse})`);
        grd.addColorStop(0.55,`rgba(${b.r},${b.g},${b.b},${pulse * 0.25})`);
        grd.addColorStop(1,   `rgba(${b.r},${b.g},${b.b},0)`);
        const ang = Math.atan2(b.y2 - b.y1, b.x2 - b.x1) + Math.PI / 2;
        const sp = 110;
        ctx!.beginPath();
        ctx!.moveTo(b.x1, b.y1);
        ctx!.lineTo(b.x2 + Math.cos(ang) * sp, b.y2 + Math.sin(ang) * sp);
        ctx!.lineTo(b.x2 - Math.cos(ang) * sp, b.y2 - Math.sin(ang) * sp);
        ctx!.closePath();
        ctx!.fillStyle = grd;
        ctx!.fill();
      }
    }

    function drawShoots() {
      if (t > nextShoot && shoots.length < 2) {
        const angle = (Math.random() * 25 + 15) * Math.PI / 180;
        shoots.push({
          x: Math.random() * W * 0.75, y: Math.random() * H * 0.45,
          vx: Math.cos(angle) * 9, vy: Math.sin(angle) * 9,
          life: 0, maxLife: 50 + Math.random() * 20,
        });
        nextShoot = t + 250 + Math.random() * 500;
      }
      shoots = shoots.filter(s => s.life < s.maxLife);
      for (const s of shoots) {
        const prog = s.life / s.maxLife;
        const alpha = prog < 0.2 ? prog / 0.2 : 1 - (prog - 0.2) / 0.8;
        const tailLen = 70;
        const grd = ctx!.createLinearGradient(
          s.x - s.vx * (tailLen / 9), s.y - s.vy * (tailLen / 9),
          s.x, s.y
        );
        grd.addColorStop(0, `rgba(220,210,255,0)`);
        grd.addColorStop(1, `rgba(220,210,255,${alpha * 0.75})`);
        ctx!.save();
        ctx!.strokeStyle = grd;
        ctx!.lineWidth = 1.1;
        ctx!.beginPath();
        ctx!.moveTo(s.x - s.vx * (tailLen / 9), s.y - s.vy * (tailLen / 9));
        ctx!.lineTo(s.x, s.y);
        ctx!.stroke();
        ctx!.globalAlpha = alpha * 0.9;
        ctx!.fillStyle = "#F0ECFF";
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, 1.3, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.restore();
        s.x += s.vx; s.y += s.vy; s.life++;
      }
    }

    function drawVignette() {
      const g = ctx!.createRadialGradient(W * .5, H * .45, H * .05, W * .5, H * .45, W * .85);
      g.addColorStop(0,   "rgba(0,0,0,0)");
      g.addColorStop(0.6, "rgba(0,0,0,0.3)");
      g.addColorStop(1,   "rgba(0,0,0,0.85)");
      ctx!.fillStyle = g;
      ctx!.fillRect(0, 0, W, H);
    }

    function tick() {
      t++;
      ctx!.clearRect(0, 0, W, H);
      drawBeams();
      drawStars();
      drawShoots();
      drawVignette();
      rafRef.current = requestAnimationFrame(tick);
    }

    resize();
    tick();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => { cancelAnimationFrame(rafRef.current); ro.disconnect(); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0, pointerEvents: "none" }}
    />
  );
}
