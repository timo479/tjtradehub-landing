import Link from "next/link";
import Image from "next/image";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{ backgroundColor: "#000000" }}
    >
      <div className="w-full" style={{ maxWidth: "420px" }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 justify-center mb-10">
          <div style={{ perspective: "150px" }}>
            <div className="logo-rotate" style={{ width: 48, height: 48, position: "relative", transformStyle: "preserve-3d" }}>
              {Array.from({ length: 16 }).map((_, i) => (
                <Image
                  key={i}
                  src="/logo-tj-transparent.png"
                  alt={i === 0 ? "TJ TradeHub Logo" : ""}
                  width={48}
                  height={48}
                  className="logo-layer object-contain"
                  style={{ transform: `translateZ(${i * 0.5}px)`, opacity: i === 15 ? 1 : 0.6 }}
                  priority={i === 0}
                />
              ))}
            </div>
          </div>
          <span
            className="font-semibold text-lg tracking-tight"
            style={{ color: "#F9FAFB", fontFamily: "'Space Grotesk', sans-serif" }}
          >
            TJ TradeHub
          </span>
        </Link>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            backgroundColor: "#111827",
            border: "1px solid #1F2937",
          }}
        >
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: "#F9FAFB" }}
          >
            {title}
          </h1>
          <p className="text-sm mb-8" style={{ color: "#9CA3AF" }}>
            {subtitle}
          </p>

          {children}
        </div>
      </div>
    </div>
  );
}
