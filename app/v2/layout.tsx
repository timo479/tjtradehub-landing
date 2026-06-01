import type { Metadata } from "next";
import SmoothScroll from "@/components/v2/SmoothScroll";
import NavV2 from "@/components/v2/NavV2";
import "./v2.css";

export const metadata: Metadata = {
  title: "TJ TradeHub — Trade with edge.",
  description: "The trading journal built for traders who treat trading like a business.",
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return (
    <SmoothScroll>
      <NavV2 />
      <div className="v2-root bg-black text-white antialiased selection:bg-violet-500/40">
        {children}
      </div>
    </SmoothScroll>
  );
}
