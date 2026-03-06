"use client";
import { useEffect, useRef } from "react";

export default function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const onResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);

    type Segment = {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
      alpha: number;
    };

    const segments: Segment[] = [];
    let lastX = 0;
    let lastY = 0;
    let initialized = false;

    const onMouseMove = (e: MouseEvent) => {
      if (!initialized) {
        lastX = e.clientX;
        lastY = e.clientY;
        initialized = true;
        return;
      }

      const dy = e.clientY - lastY;
      const color = dy <= 0 ? "0, 230, 80" : "220, 30, 30";

      // Nur kurze Segmente – lange überspringen
      const dist = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      if (dist > 20) {
        lastX = e.clientX;
        lastY = e.clientY;
        return;
      }

      segments.push({
        x1: lastX,
        y1: lastY,
        x2: e.clientX,
        y2: e.clientY,
        color,
        alpha: 0.5,
      });

      lastX = e.clientX;
      lastY = e.clientY;

      // Keep trail length limited
      if (segments.length > 60) segments.splice(0, segments.length - 60);
    };

    window.addEventListener("mousemove", onMouseMove);

    let animId: number;
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = segments.length - 1; i >= 0; i--) {
        const s = segments[i];
        s.alpha -= 0.04;

        if (s.alpha <= 0) {
          segments.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.strokeStyle = `rgba(${s.color}, ${s.alpha * 0.5})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = `rgba(${s.color}, ${s.alpha * 0.3})`;
        ctx.shadowBlur = 4;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 9999,
      }}
    />
  );
}
