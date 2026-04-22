import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  basePath: "/master",
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
