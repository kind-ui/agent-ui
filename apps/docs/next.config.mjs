import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_DOCS_BASE_PATH ?? "",
  reactStrictMode: true,
  // The registry's render files import `./name.js` for `name.tsx`, which Turbopack doesn't map, so the docs build
  // with webpack (`--webpack`).
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = { ".js": [".ts", ".tsx", ".js"] };
    return webpackConfig;
  },
};

export default withMDX(config);
