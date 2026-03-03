"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      style={{ backgroundColor: "#0B0F1A", borderBottom: "1px solid #1F2937" }}
      className="fixed top-0 left-0 right-0 z-50 h-20"
    >
      <div
        className="mx-auto flex items-center justify-between h-full px-6"
        style={{ maxWidth: "1200px" }}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo-3d.png"
            alt="TJ TradeHub Logo"
            width={40}
            height={40}
            className="object-contain"
          />
          <span
            className="font-semibold text-lg tracking-tight"
            style={{ color: "#F9FAFB" }}
          >
            TJ TradeHub
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {["Features", "Pricing", "About"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: "#9CA3AF" }}
              onMouseEnter={(e) =>
                ((e.target as HTMLAnchorElement).style.color = "#F9FAFB")
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLAnchorElement).style.color = "#9CA3AF")
              }
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: "#9CA3AF" }}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center px-5 py-2.5 text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: "#8B5CF6",
              color: "#F9FAFB",
              borderRadius: "14px",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.filter =
                "brightness(1.08)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.filter = "none")
            }
          >
            Start Free Trial
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          <span
            className="block w-5 h-0.5 transition-all duration-200"
            style={{ backgroundColor: "#F9FAFB" }}
          />
          <span
            className="block w-5 h-0.5 transition-all duration-200"
            style={{ backgroundColor: "#F9FAFB" }}
          />
          <span
            className="block w-5 h-0.5 transition-all duration-200"
            style={{ backgroundColor: "#F9FAFB" }}
          />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="md:hidden px-6 pb-4 flex flex-col gap-4"
          style={{
            backgroundColor: "#0B0F1A",
            borderTop: "1px solid #1F2937",
          }}
        >
          {["Features", "Pricing", "About"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium py-2"
              style={{ color: "#9CA3AF" }}
              onClick={() => setMenuOpen(false)}
            >
              {item}
            </a>
          ))}
          <Link
            href="/login"
            className="text-sm font-medium py-2"
            style={{ color: "#9CA3AF" }}
            onClick={() => setMenuOpen(false)}
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold"
            style={{
              backgroundColor: "#8B5CF6",
              color: "#F9FAFB",
              borderRadius: "14px",
            }}
            onClick={() => setMenuOpen(false)}
          >
            Start Free Trial
          </Link>
        </div>
      )}
    </header>
  );
}
