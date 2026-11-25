import type { NextConfig } from "next";

const dev = process.env.NODE_ENV === "development";

const nextConfig: NextConfig = {
  // This app sits inside the agent-ui repository but installs on its own.
  turbopack: { root: import.meta.dirname },
  poweredByHeader: false,
  async headers() {
    // The page talks only to this site and, with a pasted key, to AI Gateway. libfx compiles WebAssembly.
    const csp = [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      `connect-src 'self' https://ai-gateway.vercel.sh${dev ? " http://localhost:* ws://localhost:*" : ""}`,
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
