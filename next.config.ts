import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A stray lockfile higher up the
  // tree otherwise makes Next infer the wrong root for module resolution.
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
