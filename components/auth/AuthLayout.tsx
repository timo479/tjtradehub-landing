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
      style={{ backgroundColor: "#0B0F1A" }}
    >
      <div className="w-full" style={{ maxWidth: "420px" }}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 justify-center mb-10">
          <Image
            src="/logo-3d.png"
            alt="TJ TradeHub Logo"
            width={36}
            height={36}
            className="object-contain"
          />
          <span
            className="font-semibold text-lg tracking-tight"
            style={{ color: "#F9FAFB" }}
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
