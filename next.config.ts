// @ts-ignore - JBOX managed JavaScript helper
import __withJboxAssets from "./jbox.asset-redirects.cjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: false,
  // Allow preview subdomains for Keystone preview system
  allowedDevOrigins: [
    "preview.localhost",
    "*.preview.localhost",
    "preview.jboxai.com",
    "*.preview.jboxai.com",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default __withJboxAssets(nextConfig);
