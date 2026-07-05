import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Transpile the shared workspace package so Next.js can handle its TypeScript
  transpilePackages: ["@todo-app/shared"],

  // Strict mode for catching potential issues early
  reactStrictMode: true,

  // Optimise images from external sources if needed in the future
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
