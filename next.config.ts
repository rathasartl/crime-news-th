import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname
  },
  experimental: {
    serverActions: { bodySizeLimit: "1mb" }
  }
};

export default config;
