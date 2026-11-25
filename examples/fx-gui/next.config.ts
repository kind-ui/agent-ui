import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This app sits inside the agent-ui repository but installs on its own.
  turbopack: { root: import.meta.dirname },
};

export default nextConfig;
