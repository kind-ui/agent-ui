#!/usr/bin/env node
// Fails the release when an item name is already taken in the shared @kind-ui namespace on kindui.dev
// by a charts item, meaning a live item our previous release didn't ship (spec §9.6 "Collisions").
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import catalog from "../registry/catalog.mjs";

const LIVE_CATALOG = "https://kindui.dev/r/registry.json";

/** Our item names that a live item not from our previous release already uses. */
export function findCollisions(live, previous, ours) {
  const theirs = new Set(live.items.map(({ name }) => name).filter((name) => !previous.includes(name)));
  return ours.filter((name) => theirs.has(name));
}

/** The live catalog, empty while kindui.dev serves none (404). */
export async function liveCatalog(response) {
  if (response.status === 404) return { items: [] };
  if (!response.ok) throw new Error(`${LIVE_CATALOG}: ${response.status}`);
  return response.json();
}

/** Item names in the latest GitHub release's site asset, or none before the first release with one. */
function previousNames() {
  const gh = (args) => execFileSync("gh", args, { encoding: "utf8" });
  const [latest] = JSON.parse(
    gh(["release", "list", "--limit", "1", "--exclude-drafts", "--json", "tagName"]),
  );
  if (!latest) return [];
  const { assets } = JSON.parse(gh(["release", "view", latest.tagName, "--json", "assets"]));
  const site = assets.find(({ name }) => /^agent-ui-site-.+\.tar\.gz$/.test(name));
  if (!site) return [];
  const dir = mkdtempSync(join(tmpdir(), "agent-ui-site-"));
  try {
    gh(["release", "download", latest.tagName, "--pattern", site.name, "--dir", dir]);
    const registry = execFileSync("tar", ["-xzOf", join(dir, site.name), "r/registry.json"], {
      encoding: "utf8",
    });
    return JSON.parse(registry).items.map(({ name }) => name);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const response = await fetch(LIVE_CATALOG, { signal: AbortSignal.timeout(30_000) });
  const collisions = findCollisions(
    await liveCatalog(response),
    previousNames(),
    catalog.items.map(({ name }) => name),
  );
  if (collisions.length) {
    console.error(`already in the @kind-ui namespace on kindui.dev: ${collisions.join(", ")}`);
    process.exit(1);
  }
  console.log(`no collisions with ${LIVE_CATALOG}`);
}
