"use client";

import { useEffect, useRef } from "react";

export default function PreviewClient() {
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    let W = 0, H = 0, t = 0;

    interface Star { x:number;y:number;r:number;base:number;speed:number;phase:number }
    let stars: Star[] = [];

    interface Shoot { x:number;y:number;vx:number;vy:number;life:number;maxLife:number }
    let shoots: Shoot[] = [];
    let nextShoot = 120 + Math.random() * 300;

    function resize() {
      W = c.offsetWidth; H = c.offsetHeight;
      c.width = W * devicePixelRatio; c.height = H * devicePixelRatio;
      ctx.scale(devicePixelRatio, devicePixelRatio);
      stars = Array.from({ length: 220 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.pow(Math.random(), 2.2) * 1.5 + 0.15,
        base: Math.random() * 0.55 + 0.1,
        speed: Math.random() * 0.009 + 0.002,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    function drawStars() {
      for (const s of stars) {
        const op = s.base * (0.45 + 0.55 * Math.sin(t * s.speed + s.phase));
        if (s.r > 0.9) {
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4.5);
          g.addColorStop(0, `rgba(210,200,255,${op * 0.5})`);
          g.addColorStop(1, `rgba(210,200,255,0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = op;
        ctx.fillStyle = s.r > 1.0 ? "#EDE8FF" : "#9B8EC4";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    function drawBeams() {
      const beams = [
        { x1: 0, y1: 0,   x2: W * 0.38, y2: H * 0.50, r: 120, g: 60,  b: 240, a: 0.045 },
        { x1: W, y1: 0,   x2: W * 0.62, y2: H * 0.45, r: 88,  g: 52,  b: 220, a: 0.038 },
        { x1: 0, y1: H,   x2: W * 0.30, y2: H * 0.52, r: 100, g: 40,  b: 210, a: 0.030 },
        { x1: W, y1: H,   x2: W * 0.70, y2: H * 0.55, r: 80,  g: 60,  b: 230, a: 0.028 },
      ];
      for (const [i, b] of beams.entries()) {
        const pulse = b.a + 0.015 * Math.sin(t * 0.004 + i * 1.4);
        const grd = ctx.createLinearGradient(b.x1, b.y1, b.x2, b.y2);
        grd.addColorStop(0,    `rgba(${b.r},${b.g},${b.b},${pulse})`);
        grd.addColorStop(0.55, `rgba(${b.r},${b.g},${b.b},${pulse * 0.25})`);
        grd.addColorStop(1,    `rgba(${b.r},${b.g},${b.b},0)`);
        const ang = Math.atan2(b.y2 - b.y1, b.x2 - b.x1) + Math.PI / 2;
        const sp = 110;
        ctx.beginPath();
        ctx.moveTo(b.x1, b.y1);
        ctx.lineTo(b.x2 + Math.cos(ang) * sp, b.y2 + Math.sin(ang) * sp);
        ctx.lineTo(b.x2 - Math.cos(ang) * sp, b.y2 - Math.sin(ang) * sp);
        ctx.closePath();
        ctx.fillStyle = grd;
        ctx.fill();
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
        const grd = ctx.createLinearGradient(
          s.x - s.vx * 8, s.y - s.vy * 8, s.x, s.y
        );
        grd.addColorStop(0, `rgba(220,210,255,0)`);
        grd.addColorStop(1, `rgba(220,210,255,${alpha * 0.75})`);
        ctx.save();
        ctx.strokeStyle = grd;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(s.x - s.vx * 8, s.y - s.vy * 8);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
        ctx.globalAlpha = alpha * 0.9;
        ctx.fillStyle = "#F0ECFF";
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        s.x += s.vx; s.y += s.vy; s.life++;
      }
    }

    function drawVignette() {
      const g = ctx.createRadialGradient(W * .5, H * .45, H * .05, W * .5, H * .45, W * .85);
      g.addColorStop(0,   "rgba(0,0,0,0)");
      g.addColorStop(0.6, "rgba(0,0,0,0.3)");
      g.addColorStop(1,   "rgba(0,0,0,0.85)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    function tick() {
      t++;
      ctx.clearRect(0, 0, W, H);
      drawBeams();
      drawStars();
      drawShoots();
      drawVignette();
      raf.current = requestAnimationFrame(tick);
    }

    resize();
    tick();
    const ro = new ResizeObserver(() => { ctx.setTransform(1,0,0,1,0,0); resize(); });
    ro.observe(c);
    return () => { cancelAnimationFrame(raf.current); ro.disconnect(); };
  }, []);

  return (
    <div style={{ background: "#000", width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}>
      <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
    </div>
  );
}
