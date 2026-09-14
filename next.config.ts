import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from Vercel Blob and any Neon/external sources
  images: {
    remotePatterns: [
      {
        // Vercel Blob storage
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        // Any https image (permissive for Phase 1 — tighten in production if needed)
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // Silence the next-auth peer dep warning (we use it as session lib only)
  experimental: {},
};

export default nextConfig;
