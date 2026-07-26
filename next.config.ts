import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname
  },
  images: {
    formats: ["image/avif", "image/webp"],
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
      { protocol: "https", hostname: "*.supabase.co" }
    ]
  },
  experimental: {
    serverActions: { bodySizeLimit: "1mb" }
  }
};

export default config;
