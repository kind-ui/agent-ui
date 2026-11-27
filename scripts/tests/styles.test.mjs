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
    "fg muted surface hover selected current bubble scrim border ring focus shadow accent accent-hover on-accent on-status on-warning success warning warning-text danger".split(
      " ",
    );
  for (const token of [...colors.map((name) => `--kind-color-${name}`), "--kind-radius", "--kind-font-mono"])
    assert.match(theme.body, new RegExp(`${token}:`), token);
});

/** An `oklch(L C H / A)` color as gamma sRGB channels and alpha. */
function srgb([L, C, H, A = 1]) {
  const h = (H * Math.PI) / 180;
  const [x, y] = [C * Math.cos(h), C * Math.sin(h)];
  const l = (L + 0.3963377774 * x + 0.2158037573 * y) ** 3;
  const m = (L - 0.1055613458 * x - 0.0638541728 * y) ** 3;
  const s = (L - 0.0894841775 * x - 1.291485548 * y) ** 3;
  const gamma = (v) => {
    const c = Math.min(1, Math.max(0, v));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  };
  return {
    rgb: [
      gamma(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
      gamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
      gamma(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
    ],
    alpha: A,
  };
}

/** Colors painted in order, each over the ones before it, as a browser composites them. */
function paint(...layers) {
  return layers.map(srgb).reduce((under, { rgb, alpha }) => ({
    rgb: rgb.map((v, i) => v * alpha + under.rgb[i] * (1 - alpha)),
    alpha: 1,
  })).rgb;
}

function contrast(a, b) {
  const luminance = (rgb) => {
    const [r, g, bl] = rgb.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [high, low] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (high + 0.05) / (low + 0.05);
}

/** A `light-dark()` color token as its light and dark `oklch` values, alpha included. */
function scheme(name) {
  const theme = statements.find(({ prelude }) => /^@theme\s+default$/.test(prelude)).body;
  const value = theme.match(new RegExp(`--kind-color-${name}:\\s*light-dark\\(([^;]+)\\);`))?.[1];
  assert.ok(value, `--kind-color-${name} isn't light-dark(oklch(…), oklch(…))`);
  const colors = [...value.matchAll(/oklch\(([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/g)].map((match) =>
    match.slice(1, match[4] ? 5 : 4).map(Number),
  );
  assert.equal(colors.length, 2, name);
  return { light: colors[0], dark: colors[1] };
}

/** Every fill a mark or text sits on: the canvas, the surface, and each state fill over the surface. */
const fills = (color) => ({
  canvas: [color("canvas")],
  surface: [color("surface")],
  bubble: [color("surface"), color("bubble")],
  hover: [color("surface"), color("hover")],
  pressed: [color("surface"), color("pressed")],
  selected: [color("surface"), color("selected")],
  current: [color("surface"), color("current")],
});

test("marks and focus rings reach 3:1, and muted and accent text 4.5:1, on every fill", () => {
  for (const mode of ["light", "dark"]) {
    const color = (name) => scheme(name)[mode];
    for (const [fill, layers] of Object.entries(fills(color))) {
      const under = paint(...layers);
      const on = (name) => paint(...layers, color(name));
      for (const mark of ["focus", "ring", "warning", "danger", "success", "accent"])
        assert.ok(
          contrast(on(mark), under) >= 3,
          `${mode} ${mark} on ${fill}: ${contrast(on(mark), under).toFixed(2)}`,
        );
      for (const text of ["muted", "accent", "warning-text"])
        assert.ok(
          contrast(on(text), under) >= 4.5,
          `${mode} ${text} text on ${fill}: ${contrast(on(text), under).toFixed(2)}`,
        );
    }
    assert.ok(
      contrast(paint(color("primary-fg")), paint(color("primary"))) >= 4.5,
      `${mode} primary label on its fill`,
    );
  }
});

test("state fills read apart from the surface, and selected from hover", () => {
  for (const mode of ["light", "dark"]) {
    const fill = Object.fromEntries(
      Object.entries(fills((name) => scheme(name)[mode])).map(([name, layers]) => [name, paint(...layers)]),
    );
    for (const state of ["hover", "selected", "current", "bubble"])
      assert.ok(contrast(fill[state], fill.surface) >= 1.1, `${mode} ${state} on surface`);
    assert.ok(contrast(fill.selected, fill.hover) >= 1.02, `${mode} selected against hover`);
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

// Text fields show focus with their caret and at most a border shift, never a ring (styles decisions.md).
const TEXT_FIELD = /(?<![\w-])(?:input|textarea)(?![\w-])|editor|contenteditable/;

/** Every declaration in a stylesheet with the selectors of the blocks it sits in, outermost first. */
function declarations(text) {
  const found = [];
  const selectors = [];
  let buffer = "";
  for (const char of text) {
    if (char === "{") {
      selectors.push(buffer.trim());
      buffer = "";
    } else if (char === "}" || char === ";") {
      if (buffer.trim()) found.push({ selectors: [...selectors], declaration: buffer.trim() });
      if (char === "}") selectors.pop();
      buffer = "";
    } else buffer += char;
  }
  return found;
}

test("focus rings go through --kind-focus-ring, under :focus-visible only, and never on a text field", () => {
  for (const name of stylesheets) {
    const text = withoutComments(readFileSync(new URL(`styles/${name}`, source), "utf8"));
    for (const [declaration] of text.matchAll(
      /outline(?:-color)?\s*:[^;]*--kind-color-(?:ring|focus)[^;]*;/g,
    ))
      assert.fail(`${name}: ${declaration} (use var(--kind-focus-ring))`);
    for (const { selectors, declaration } of declarations(text)) {
      if (
        !/^(?:outline|box-shadow)\s*:.*(?:--kind-focus-ring\b|--kind-color-(?:ring|focus)\b)/s.test(
          declaration,
        )
      )
        continue;
      const chain = selectors.join(" ");
      assert.match(chain, /:focus-visible/, `${name}: ${chain} draws a ring outside :focus-visible`);
      assert.doesNotMatch(
        chain,
        TEXT_FIELD,
        `${name}: ${chain} rings a text field; shift its border instead`,
      );
    }
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

test("render files draw keyboard focus with the ring token and never outline-none, which hides a focus-visible ring in Tailwind v4", () => {
  for (const layer of ["react", "web"]) {
    for (const name of readdirSync(new URL(`${layer}/`, source), { recursive: true })) {
      if (!/\.tsx?$/.test(name)) continue;
      const text = readFileSync(new URL(`${layer}/${name}`, source), "utf8");
      assert.doesNotMatch(text, /(?:^|[\s":])outline-none\b/m, `${layer}/${name} (use outline-hidden)`);
      assert.doesNotMatch(
        text,
        /outline-\[(?:color:)?var\(--kind-color-(?:ring|focus)\)\]/,
        `${layer}/${name} (use [outline:var(--kind-focus-ring)])`,
      );
      for (const [utility] of text.matchAll(/[^\s"`]*\[outline:var\(--kind-focus-ring\)\]/g)) {
        assert.match(utility, /focus-visible[:\]>]/, `${layer}/${name}: ${utility} (keyboard focus only)`);
        assert.doesNotMatch(utility, TEXT_FIELD, `${layer}/${name}: ${utility} rings a text field`);
      }
      assert.doesNotMatch(
        text,
        /(?:^|[\s"`:\]])(?:focus|focus-within):(?:outline|ring|shadow)/m,
        `${layer}/${name} (draw focus under focus-visible:)`,
      );
    }
  }
});

/** Each block's declarations, keyed by the selectors it sits in. */
function blocks(text) {
  const found = new Map();
  for (const { selectors, declaration } of declarations(text)) {
    const key = selectors.join(" ");
    found.set(key, [...(found.get(key) ?? []), declaration]);
  }
  return found;
}

// Rows, list items, chips in a strip and scrollers sit inside something that can clip them.
const CLIPPED = /"[\w-]*(?:row|item|cell|option|segment|line|frame|chip|viewport|list|entry)"/;

test("rings on rows, items and scrollers draw inside the element, where no ancestor clips them", () => {
  for (const name of stylesheets) {
    const text = withoutComments(readFileSync(new URL(`styles/${name}`, source), "utf8"));
    for (const [chain, list] of blocks(text)) {
      if (!list.some((declaration) => declaration.includes("var(--kind-focus-ring)")) || !CLIPPED.test(chain))
        continue;
      const offset = list.find((declaration) => declaration.startsWith("outline-offset"));
      assert.match(
        offset ?? "",
        /--kind-focus-offset-inset/,
        `${name}: ${chain} (use --kind-focus-offset-inset)`,
      );
    }
  }
});

// A component places a shared control; the control owns its look (docs/design-principles.md "System").
const SHARED = /\[data-kind-(?:button|icon-button|trigger|badge|popup|dialog|dialog-title|scrim|code)\b/;
const LAYOUT =
  /^(?:margin|margin-[\w-]+|align-self|justify-self|place-self|order|flex|flex-[\w-]+|grid-[\w-]+|inline-size|min-inline-size|max-inline-size|width|min-width|max-width|position|inset|inset-[\w-]+|top|right|bottom|left|z-index|visibility|display|--[\w-]+)\s*:/;

test("component stylesheets place shared controls but don't restyle them", () => {
  for (const name of stylesheets) {
    if (name === "controls.css") continue;
    const text = withoutComments(readFileSync(new URL(`styles/${name}`, source), "utf8"));
    for (const { selectors, declaration } of declarations(text)) {
      if (!SHARED.test(selectors.at(-1) ?? "")) continue;
      assert.match(
        declaration,
        LAYOUT,
        `${name}: ${selectors.join(" ")} { ${declaration} } (pick a variant or size)`,
      );
    }
  }
});
