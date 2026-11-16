#!/usr/bin/env node
// Serves the docs' static export as a plain file server would (a folder serves its index.html, no rewrites) and
// opens every page, failing on any page error or console error, such as a hydration mismatch.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const out = join(dirname(fileURLToPath(import.meta.url)), "../apps/docs/out");
const origin = "http://127.0.0.1:4330";
const basePath = process.env.NEXT_PUBLIC_DOCS_BASE_PATH ?? "";
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

// Every page: the export writes each one as a folder with an index.html.
const pagesIn = (dir) =>
  readdirSync(dir, { recursive: true })
    .filter(
      (file) => file.endsWith("index.html") && !file.startsWith("404") && !file.startsWith("_not-found"),
    )
    .map((file) => `/${dirname(file)}/`.replace("/./", "/"))
    .sort();

function fileFor(url) {
  const { pathname } = new URL(url, origin);
  const path = pathname.startsWith(basePath) ? pathname.slice(basePath.length) : pathname;
  try {
    const file = join(out, decodeURIComponent(path));
    return existsSync(file) && statSync(file).isDirectory() ? join(file, "index.html") : file;
  } catch {
    return undefined;
  }
}

function serve() {
  const server = createServer((request, response) => {
    const file = fileFor(request.url);
    if (!file?.startsWith(out) || !existsSync(file)) {
      response.statusCode = 404;
      return response.end();
    }
    response.setHeader("content-type", types[extname(file)] ?? "text/plain");
    response.end(readFileSync(file));
  });
  return new Promise((resolve, reject) => {
    server.once("error", (error) =>
      reject(error.code === "EADDRINUSE" ? new Error("port 4330 is in use") : error),
    );
    server.listen(4330, "127.0.0.1", () => resolve(server));
  });
}

async function check() {
  if (!existsSync(out)) throw new Error("no docs export; run `npm run build:docs` first");
  const pages = pagesIn(out);
  const server = await serve();
  const browser = await chromium.launch();
  const errors = [];
  try {
    for (const path of pages) {
      const page = await browser.newPage();
      page.on("pageerror", (error) => errors.push(`${path}: ${error.message}`));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(`${path}: ${message.text()} ${message.location().url}`);
      });
      const response = await page.goto(origin + basePath + path, { waitUntil: "networkidle" });
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
