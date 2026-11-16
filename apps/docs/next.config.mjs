import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_DOCS_BASE_PATH ?? "",
  // Writes `docs/step/index.html`, not `docs/step.html`, so a plain static host serves each page at the path it
  // was rendered for. Served as `docs/step.html`, the client's pathname matched no page and hydration failed (#418).
  trailingSlash: true,
  reactStrictMode: true,
  // The registry's render files import `./name.js` for `name.tsx`, which Turbopack doesn't map, so the docs build
  // with webpack (`--webpack`).
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return webpackConfig;
  },
};

export default withMDX(config);
