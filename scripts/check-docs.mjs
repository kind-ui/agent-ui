#!/usr/bin/env node
// Serves the docs' static export as a plain file server would (a folder serves its index.html, no rewrites) and
// opens a few pages, failing on any page error or console error, such as a hydration mismatch.
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const out = join(dirname(fileURLToPath(import.meta.url)), "../apps/docs/out");
const origin = "http://127.0.0.1:4330";
const pages = [
  "/",
  "/docs/",
  "/docs/components/step/",
  "/docs/components/composer/",
  "/docs/showcase/agent-activity/",
];
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

function serve() {
  const server = createServer((request, response) => {
    let file = join(out, decodeURIComponent(new URL(request.url, origin).pathname));
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!file.startsWith(out) || !existsSync(file)) {
      response.statusCode = 404;
      return response.end();
    }
    response.setHeader("content-type", types[extname(file)] ?? "text/plain");
    response.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(4330, "127.0.0.1", () => resolve(server)));
}

async function check() {
  if (!existsSync(out)) throw new Error("no docs export; run `npm run build:docs` first");
  const server = await serve();
  const browser = await chromium.launch();
  const errors = [];
  try {
    for (const path of pages) {
      const page = await browser.newPage();
      page.on("pageerror", (error) => errors.push(`${path}: ${error.message}`));
      page.on(
        "console",
        (message) => message.type() === "error" && errors.push(`${path}: ${message.text()}`),
      );
      const response = await page.goto(origin + path, { waitUntil: "networkidle" });
      if (!response.ok()) errors.push(`${path}: ${response.status()}`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  if (errors.length) throw new Error(errors.join("\n  "));
  console.log(`opened ${pages.length} docs pages with no errors`);
}

check().catch((error) => {
  console.error(`check-docs: ${error.message}`);
  process.exit(1);
});
