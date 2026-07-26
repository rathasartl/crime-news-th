import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    remotePatterns: [
      { protocol: "https", hostname: "www.khaosod.co.th" },
      { protocol: "https", hostname: "khaosod.co.th" },
      { protocol: "https", hostname: "www.prachachat.net" },
      { protocol: "https", hostname: "prachachat.net" },
      { protocol: "https", hostname: "thestandard.co" },
      { protocol: "https", hostname: "www.thestandard.co" },
      { protocol: "https", hostname: "www.brighttv.co.th" },
      { protocol: "https", hostname: "brighttv.co.th" },
      { protocol: "https", hostname: "www.innnews.co.th" },
      { protocol: "https", hostname: "innnews.co.th" },
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "https", hostname: "www.bbc.com" },
      { protocol: "https", hostname: "bbc.com" },
      { protocol: "https", hostname: "www.theguardian.com" },
      { protocol: "https", hostname: "theguardian.com" },
      { protocol: "https", hostname: "www.nytimes.com" },
      { protocol: "https", hostname: "nytimes.com" },
      { protocol: "https", hostname: "www.aljazeera.com" },
      { protocol: "https", hostname: "aljazeera.com" },
      { protocol: "https", hostname: "abcnews.go.com" },
      { protocol: "https", hostname: "www.cbsnews.com" },
      { protocol: "https", hostname: "cbsnews.com" }
    ]
  },
  experimental: {
    serverActions: { bodySizeLimit: "1mb" },
    optimizePackageImports: ["@supabase/supabase-js"]
  },
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" }
        ]
      },
      {
        source: "/_next/image/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, immutable" }
        ]
      },
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300"
          }
        ]
      },
      {
        source: "/categories",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=300"
          }
        ]
      }
    ];
  }
};

export default config;
