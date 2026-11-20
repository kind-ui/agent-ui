import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// The project draws no sparkle icon anywhere: not an icon name, an emoji or a symbol.
const repoRoot = new URL("../../", import.meta.url);
const sparkle = /sparkl|auto_awesome|[\u2726\u2727\u2728\u2747\u2748\u{1F31F}\u{1F4AB}]/iu;
// Prose that states the rule, and this test.
const skipped =
  /^(AGENTS\.md|docs\/superpowers\/|docs\/design-principles\.md$|\.agents\/|scripts\/tests\/no-sparkle\.test\.mjs$)/;
const binary = /\.(png|jpe?g|gif|webp|ico|woff2?|ttf|otf)$/i;

test("no file draws a sparkle icon", () => {
  const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], {
    cwd: repoRoot,
    encoding: "utf8",
  })
    .split("\n")
    .filter((file) => file && file !== "package-lock.json" && !skipped.test(file) && !binary.test(file));
  const found = files.filter((file) => {
    try {
      return sparkle.test(readFileSync(new URL(file, repoRoot), "utf8"));
    } catch {
      return false;
    }
  });
  assert.deepEqual(found, []);
});
