import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://s3.tradingview.com https://www.tradingview.com https://analytics.tiktok.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
      "connect-src 'self' https://tjtradehub.com https://www.tjtradehub.com https://*.supabase.co https://api.stripe.com https://*.tradingview.com https://query1.finance.yahoo.com https://query2.finance.yahoo.com https://api.allorigins.win https://analytics.tiktok.com https://*.tiktokw.us https://*.tiktok.com",
      "frame-src 'self' https://*.tradingview.com https://s3.tradingview.com",
      "worker-src 'self' blob:",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "tjtradehub.com" }],
        destination: "https://www.tjtradehub.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
