import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";

const source = new URL("../../packages/agent-ui/src/", import.meta.url);
const withoutComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, "");
const css = withoutComments(readFileSync(new URL("styles/agent-ui.css", source), "utf8"));

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
  assert.equal(depth, 0, "unbalanced braces");
  assert.equal(source.slice(start).trim(), "", "text after the last statement");
  return statements;
}

const statements = topLevel(css);

test("styles.css holds only imports, @theme and @source", () => {
  for (const { prelude } of statements) assert.match(prelude, /^@(import|theme|source)\b/, prelude);
});

test("theme tokens are declared under @theme default", () => {
  const theme = statements.find(({ prelude }) => /^@theme\s+default$/.test(prelude));
  assert.ok(theme, "no @theme default block");
  const colors =
    "fg muted surface hover selected current bubble scrim border ring shadow accent accent-hover on-accent on-status on-warning success warning danger".split(
      " ",
    );
  for (const token of [...colors.map((name) => `--kind-color-${name}`), "--kind-radius", "--kind-font-mono"])
    assert.match(theme.body, new RegExp(`${token}:`), token);
});

/** WCAG contrast of two `oklch(L C H)` colors, through OKLab and linear sRGB. */
function contrast(a, b) {
  const luminance = ([L, C, H]) => {
    const h = (H * Math.PI) / 180;
    const [x, y] = [C * Math.cos(h), C * Math.sin(h)];
    const l = (L + 0.3963377774 * x + 0.2158037573 * y) ** 3;
    const m = (L - 0.1055613458 * x - 0.0638541728 * y) ** 3;
    const s = (L - 0.0894841775 * x - 1.291485548 * y) ** 3;
    const clamp = (v) => Math.min(1, Math.max(0, v));
    const r = clamp(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s);
    const g = clamp(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s);
    const bl = clamp(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s);
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [high, low] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (high + 0.05) / (low + 0.05);
}

/** A `light-dark()` color token as its light and dark `oklch` triples. */
function scheme(name) {
  const theme = statements.find(({ prelude }) => /^@theme\s+default$/.test(prelude)).body;
  const value = theme.match(new RegExp(`--kind-color-${name}:\\s*light-dark\\(([^;]+)\\);`))?.[1];
  assert.ok(value, `--kind-color-${name} isn't light-dark(oklch(…), oklch(…))`);
  const colors = [...value.matchAll(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)/g)].map((match) =>
    match.slice(1).map(Number),
  );
  assert.equal(colors.length, 2, name);
  return { light: colors[0], dark: colors[1] };
}

test("marks and focus rings reach 3:1, and muted and accent text 4.5:1, on every fill", () => {
  for (const mode of ["light", "dark"]) {
    const color = (name) => scheme(name)[mode];
    for (const fill of ["surface", "hover", "selected", "current"]) {
      for (const mark of ["ring", "warning", "danger", "success", "accent"])
        assert.ok(contrast(color(mark), color(fill)) >= 3, `${mode} ${mark} on ${fill}`);
      for (const text of ["muted", "accent"])
        assert.ok(contrast(color(text), color(fill)) >= 4.5, `${mode} ${text} text on ${fill}`);
    }
  }
});

test("selected and current read apart from the surface and from hover", () => {
  for (const mode of ["light", "dark"]) {
    const color = (name) => scheme(name)[mode];
    for (const state of ["selected", "current"]) {
      assert.ok(contrast(color(state), color("surface")) >= 1.2, `${mode} ${state} on surface`);
      assert.ok(contrast(color(state), color("hover")) >= 1.1, `${mode} ${state} against hover`);
    }
    assert.notDeepEqual(color("selected"), color("current"), `${mode} selected and current`);
  }
});

const stylesheets = readdirSync(new URL("styles/", source)).filter(
  (name) => name.endsWith(".css") && name !== "agent-ui.css",
);

test("component stylesheets size text from the type scale", () => {
  for (const name of stylesheets) {
    const text = withoutComments(readFileSync(new URL(`styles/${name}`, source), "utf8"));
    for (const [declaration] of text.matchAll(/(?:font-size|font|--[\w-]*font-size)\s*:[^;]*;/g))
      assert.doesNotMatch(
        declaration,
        /\d(?:px|rem)\b/,
        `${name}: ${declaration} (use a --kind-text-* token)`,
      );
  }
});

test("focus rings go through --kind-focus-ring", () => {
  for (const name of stylesheets) {
    const text = withoutComments(readFileSync(new URL(`styles/${name}`, source), "utf8"));
    for (const [declaration] of text.matchAll(/outline(?:-color)?\s*:[^;]*--kind-color-ring[^;]*;/g))
      assert.fail(`${name}: ${declaration} (use var(--kind-focus-ring))`);
    for (const [block] of text.matchAll(/\{[^{}]*\}/g)) {
      if (!block.includes("var(--kind-focus-ring")) continue;
      for (const [offset] of block.matchAll(/outline-offset\s*:[^;]*;/g))
        assert.match(
          offset,
          /var\(--kind-focus-offset(?:-inset)?\)/,
          `${name}: ${offset} (use a --kind-focus-offset token)`,
        );
    }
  }
});

test("render files draw focus with the ring token and never outline-none, which hides a focus-visible ring in Tailwind v4", () => {
  for (const layer of ["react", "web"]) {
    for (const name of readdirSync(new URL(`${layer}/`, source), { recursive: true })) {
      if (!/\.tsx?$/.test(name)) continue;
      const text = readFileSync(new URL(`${layer}/${name}`, source), "utf8");
      assert.doesNotMatch(text, /(?:^|[\s":])outline-none\b/m, `${layer}/${name} (use outline-hidden)`);
      assert.doesNotMatch(
        text,
        /outline-\[(?:color:)?var\(--kind-color-ring\)\]/,
        `${layer}/${name} (use [outline:var(--kind-focus-ring)])`,
      );
    }
  }
});
