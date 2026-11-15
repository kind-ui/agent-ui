import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const css = readFileSync(
  new URL("../../packages/agent-ui/src/styles/agent-ui.css", import.meta.url),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//g, "");

/** The file's top-level statements, each with the body of its block when it has one. */
function topLevel(source) {
  const statements = [];
  let depth = 0;
  let start = 0;
  let open = 0;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === "{" && depth++ === 0) open = i;
    else if (char === "}" && --depth === 0) {
      statements.push({ prelude: source.slice(start, open).trim(), body: source.slice(open + 1, i) });
      start = i + 1;
    } else if (char === ";" && depth === 0) {
      statements.push({ prelude: source.slice(start, i).trim() });
      start = i + 1;
    }
  }
  return statements;
}

const statements = topLevel(css);

test("styles.css holds only imports, @theme and @source", () => {
  for (const { prelude } of statements) assert.match(prelude, /^@(import|theme|source)\b/, prelude);
});

test("theme tokens are declared under @theme default", () => {
  const theme = statements.find(({ prelude }) => /^@theme\s+default$/.test(prelude));
  assert.ok(theme, "no @theme default block");
  for (const token of [
    ...["surface", "muted", "border", "accent", "danger", "success", "warning"].map(
      (name) => `--kind-color-${name}`,
    ),
    "--kind-radius",
    "--kind-font-mono",
  ])
    assert.match(theme.body, new RegExp(`${token}:`), token);
});
