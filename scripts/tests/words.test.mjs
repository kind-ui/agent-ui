import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { WORDS } from "@kind-ui/agent-ui/core";

const src = new URL("../../packages/agent-ui/src/", import.meta.url);
const words = new Set(Object.values(WORDS));

// Comments may quote the words; only code may not.
const code = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/^\s*\/\/.*$/gm, "");

test("the shared words are written only in core/words.ts (Wave 7 spec §2)", () => {
  const files = readdirSync(src, { recursive: true, encoding: "utf8" }).filter(
    (file) => /\.(ts|tsx|svelte|vue)$/.test(file) && file !== "core/words.ts",
  );
  const found = [];
  for (const file of files) {
    const text = code(readFileSync(new URL(file, src), "utf8"));
    // String literals, templates without placeholders, and text between tags or blocks, on one line or several.
    for (const match of text.matchAll(/"([^"\n]+)"|'([^'\n]+)'|`([^`$]+)`|>([^<>{}]+)<|}([^<>{}]+){/g)) {
      const literal = match.slice(1).find(Boolean)?.trim();
      if (literal && words.has(literal)) found.push(`${file}: ${literal}`);
    }
  }
  assert.deepEqual(found, []);
});
