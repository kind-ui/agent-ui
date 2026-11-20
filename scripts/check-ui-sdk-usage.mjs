#!/usr/bin/env node
// Fails when a component bypasses UI SDK (spec §2 "Building on UI SDK").
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const specPath = join(repoRoot, "docs/superpowers/specs/2026-11-14-agent-ui-design.md");

// `scrollTo(` and `scrollTop` must not match UI SDK APIs such as `createStickToBottom().scrollToBottom()`.
const matches = (source, pattern) =>
  pattern instanceof RegExp
    ? pattern.exec(source)?.[0]
    : pattern === "scrollTo"
      ? /\bscrollTo\s*\(/.test(source)
      : pattern === "scrollTop"
        ? /\bscrollTop\b/.test(source)
        : source.includes(pattern);

const CORE_EXEMPT_DIRS = new Set(["motion", "markdown"]);
const RENDER_FORBIDDEN = [
  "addEventListener",
  "onKeyDown",
  "onKeyUp",
  "tabIndex",
  "tabindex",
  ".focus(",
  "scrollTo",
  "scrollTop",
  "role=",
  "role:",
  'setAttribute("aria-',
];
const SHARED_FORBIDDEN = [
  "addEventListener",
  "tabIndex",
  "tabindex",
  ".focus(",
  "scrollTo",
  "scrollTop",
  "scrollIntoView",
  "role=",
  "role:",
  'setAttribute("aria-',
];
// Each render layer: its files, the framework spelling of hand-written behavior, and the packages it must not import.
const RENDER_LAYERS = [
  { layer: "react", files: /\.tsx$/, partsFrom: "@ui-sdk/react/primitive", forbidden: RENDER_FORBIDDEN },
  { layer: "web", files: /\.ts$/, partsFrom: "@ui-sdk/web", forbidden: RENDER_FORBIDDEN },
  {
    layer: "vue",
    files: /\.ts$/,
    shape: "Vue render files are .ts",
    forbidden: [
      ...SHARED_FORBIDDEN,
      /\bon(Key|Focus|Blur)\w*(?=\s*:)/,
      /(@|v-on:)(key(down|up)|focus(in|out)?|blur)\b/,
    ],
  },
  {
    layer: "svelte",
    files: /\.(ts|svelte)$/,
    shape: "Svelte render files are .ts or .svelte",
    // A component is its folder: `index.ts` and its `.svelte` parts count together.
    unit: (file) => file.slice(0, file.lastIndexOf("/")),
    forbidden: [
      ...SHARED_FORBIDDEN,
      /\{\s*on(key(down|up)|focus(in|out)?|blur)\s*\}/,
      /\bon(key(down|up)|focus(in|out)?|blur)=/,
      /\{@attach[^}]*focus/,
    ],
  },
  {
    layer: "solid",
    files: /\.tsx$/,
    shape: "Solid render files are .tsx",
    forbidden: [
      ...SHARED_FORBIDDEN,
      /\bon(Key(Down|Up)|Focus(In|Out)?|Blur)\b/,
      /\bon:(key(down|up)|focus(in|out)?|blur)\b/,
    ],
  },
];
const LAYER_PACKAGES = ["react", "react-dom", "vue", "svelte", "solid-js", "@solidjs/web", "ai"];
const OWN_PACKAGES = {
  react: ["react", "react-dom"],
  vue: ["vue"],
  svelte: ["svelte"],
  solid: ["solid-js", "@solidjs/web"],
};
// Kind class helpers pass UI SDK parts through; React's is a `.ts` file, which its layer doesn't scan.
const RENDER_EXEMPT = new Set(["src/vue/internal/kind-class.ts", "src/svelte/internal/kind-class.ts"]);
const KIND_CLASS = "/internal/kind-class.ts";
const CORE_FORBIDDEN = [
  "addEventListener",
  ".focus(",
  "scrollTo",
  "scrollTop",
  "tabindex",
  'setAttribute("role"',
  'setAttribute("aria-',
];

/** Reads the "Exception" column of the spec §2 "Building on UI SDK" table. */
export function specExceptions(markdown = readFileSync(specPath, "utf8")) {
  const start = markdown.indexOf("### Building on UI SDK");
  if (start === -1) throw new Error(`${specPath}: missing "### Building on UI SDK" section`);
  const end = markdown.indexOf("\n### ", start + 1);
  const section = markdown.slice(start, end === -1 ? undefined : end);
  const rows = section.split("\n").filter((line) => line.trim().startsWith("|"));
  const cells = rows.map((row) => row.trim().slice(1).split(" | ")[0].trim());
  const header = cells.indexOf("Exception");
  if (header === -1) throw new Error(`${specPath}: missing exception table`);
  return new Set(cells.slice(header + 1).filter((cell) => !/^-+$/.test(cell)));
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
}

/**
 * The selectors that reach a status mark: `[data-status-mark]`, and the part attribute and `data-slot` of every core
 * slot that writes it.
 */
function statusMarkSelectors(coreDir) {
  const selectors = new Set(["[data-status-mark]"]);
  for (const path of walk(coreDir).filter((f) => f.endsWith(".ts"))) {
    const source = stripComments(readFileSync(path, "utf8"));
    const component = relative(coreDir, dirname(path)).split(sep)[0];
    for (const { index } of source.matchAll(/["']data-status-mark["']\s*:/g)) {
      const before = source.slice(0, index);
      const slotAt = before.search(
        /["']?[\w-]+["']?\s*:\s*slot(<[^(]*>)?\(\{(?![\s\S]*\bslot(<[^(]*>)?\(\{)/,
      );
      const slot = slotAt === -1 ? undefined : /["']?([\w-]+)["']?\s*:/.exec(before.slice(slotAt))?.[1];
      const own = before.slice(slotAt === -1 ? 0 : slotAt);
      for (const [, name, value] of own.matchAll(/["']data-([\w-]+-part)["']\s*:\s*["']([\w-]+)["']/g)) {
        selectors.add(`[data-${name}="${value}"]`);
      }
      if (slot && component && path.endsWith(`${component}/${component}.ts`)) {
        selectors.add(`[data-slot="kind-${component}-${slot}"]`);
      }
    }
  }
  return [...selectors];
}

const MARK_PROPERTIES = /^(mask(-[\w-]+)?|width|height|inline-size|block-size|min-width|min-height)$/;

/** Each declaration with the selectors of the rules it sits in, outermost first. */
function declarations(css) {
  const found = [];
  const stack = [];
  let text = "";
  for (const char of css.replace(/\/\*[\s\S]*?\*\//g, "")) {
    if (char === "{") {
      stack.push(text.trim());
      text = "";
    } else if (char === "}") {
      const rest = text.trim();
      if (rest) found.push({ rules: [...stack], declaration: rest });
      stack.pop();
      text = "";
    } else if (char === ";") {
      found.push({ rules: [...stack], declaration: text.trim() });
      text = "";
    } else {
      text += char;
    }
  }
  return found;
}

const camelCase = (name) => name.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const importsFrom = (source, name, specifier) =>
  new RegExp(`import\\s*\\{[^}]*\\b${name}\\b[^}]*\\}\\s*from\\s*["']${specifier}["']`).test(source);

/**
 * @param {string} root package root containing `src/`
 * @param {Record<string, string>} exceptions file path (relative to root) → spec exception cell
 * @returns {string[]} errors
 */
export function checkUiSdkUsage(root, exceptions) {
  const errors = [];
  const rel = (path) => relative(root, path).split(sep).join("/");
  const coreDir = join(root, "src/core");

  // Rule 1: one definePrimitive per core component.
  if (existsSync(coreDir)) {
    for (const name of readdirSync(coreDir)) {
      if (CORE_EXEMPT_DIRS.has(name) || !statSync(join(coreDir, name)).isDirectory()) continue;
      const file = `src/core/${name}/${name}.ts`;
      const path = join(root, file);
      const source = existsSync(path) ? stripComments(readFileSync(path, "utf8")) : "";
      const calls = source.match(/\bdefinePrimitive\s*(<[^>]*>)?\s*\(/g) ?? [];
      const exported = new RegExp(
        `export\\s+const\\s+${camelCase(name)}Primitive\\b[^=]*=\\s*definePrimitive\\b`,
      ).test(source);
      if (!importsFrom(source, "definePrimitive", "@ui-sdk/core") || calls.length !== 1 || !exported) {
        errors.push(`${file}: component must be defined with definePrimitive`);
      }
    }
  }

  // Rules 2 and 3: render files use createParts or wrap a UI SDK component, with no hand-written behavior, and
  // import core only through `@kind-ui/agent-ui/core` and no other layer.
  for (const {
    layer,
    files,
    shape,
    partsFrom = `@ui-sdk/${layer}/primitive`,
    unit,
    forbidden,
  } of RENDER_LAYERS) {
    const units = new Map();
    for (const path of walk(join(root, "src", layer))) {
      const file = rel(path);
      if (!files.test(file)) {
        const dotfile = /(^|\/)\.[^/]*$/.test(file);
        if (shape && !dotfile && !file.endsWith(KIND_CLASS)) errors.push(`${file}: ${shape} (plan D4)`);
        continue;
      }
      if (RENDER_EXEMPT.has(file)) continue;
      const source = stripComments(readFileSync(path, "utf8"));
      const key = unit ? unit(file) : file;
      units.set(key, `${units.get(key) ?? ""}\n${source}`);
      for (const pattern of forbidden) {
        const found = matches(source, pattern);
        if (found)
          errors.push(
            `${file}: ${pattern instanceof RegExp ? found : pattern} belongs in the primitive (UI SDK)`,
          );
      }
      const specifiers = [...source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((m) => m[1]);
      for (const specifier of specifiers) {
        const pkg = specifier.startsWith("@")
          ? specifier.split("/").slice(0, 2).join("/")
          : specifier.split("/")[0];
        const crossLayer =
          (/^@ui-sdk\/(?!core$)/.test(pkg) && pkg !== `@ui-sdk/${layer}`) ||
          (LAYER_PACKAGES.includes(pkg) && !OWN_PACKAGES[layer]?.includes(pkg));
        const otherLayer = /^(?:\.\.\/)+(react|web|vue|svelte|solid)\//.exec(specifier)?.[1];
        if (crossLayer || /^(\.\.\/)+core(\/|$)/.test(specifier) || (otherLayer && otherLayer !== layer)) {
          errors.push(
            `${file}: imports ${specifier}; a render file imports core through @kind-ui/agent-ui/core and no other layer`,
          );
        }
      }
    }
    for (const [key, source] of units) {
      const usesParts = importsFrom(source, "createParts", partsFrom) && /\bcreateParts\s*\(/.test(source);
      // Web entries register their elements on import, so a bare `import "@ui-sdk/web/<name>"` wraps one too.
      // Type-only imports and the agent bridge wrap nothing.
      const valueImports = source.replace(/import\s+type\b[^;]*;/g, "");
      const wrapsComponent = new RegExp(
        `(from|import)\\s*["']@ui-sdk/${layer}/(?!(primitive|agent)["'])[\\w-]+["']`,
      ).test(valueImports);
      if (!usesParts && !wrapsComponent) {
        errors.push(`${key}: render file must use createParts or wrap a UI SDK component`);
      }
    }
  }

  // Rule 4: core files use UI SDK behaviors unless listed as a spec exception.
  for (const path of walk(coreDir).filter((f) => f.endsWith(".ts"))) {
    const file = rel(path);
    if (Object.hasOwn(exceptions, file)) continue;
    // A tabindex whose value comes from a UI SDK focus helper (`roving.tabIndex(state, part)`) is UI SDK's, so is
    // focus a roving group, a grid or a UI SDK `create…Controller()` moves (`roving.focus(key)`, `grid.focus(cell)`,
    // `controller.focus()`), and so is a static `tabindex: "0"` in a slot that declares UI SDK's `focus: "tab-stop"`.
    const source = stripComments(readFileSync(path, "utf8"))
      .replace(/\btabindex["']?\s*:\s*[\w.]+\.tabIndex\(/g, "")
      .replace(/\b(?:roving|grid)\.focus\(/g, "")
      .replace(/\bcontroller\.focus\(/g, (match, _offset, whole) =>
        /\bconst controller = create\w+Controller\(/.test(whole) ? "" : match,
      )
      .replace(/\btabindex["']?\s*:\s*["']0["']/g, (match, offset, whole) => {
        const slot = whole.slice(whole.lastIndexOf("slot(", offset), offset);
        return /\bfocus\s*:\s*["']tab-stop["']/.test(slot) ? "" : match;
      });
    for (const pattern of CORE_FORBIDDEN) {
      if (matches(source, pattern)) {
        errors.push(`${file}: ${pattern} must come from UI SDK (or be a spec §2 exception)`);
      }
    }
  }

  // Rule 6: only status-mark.css sizes or masks the status mark; components set `--kind-status-mark-size`, so its
  // glyph stays centered at every size.
  const marks = statusMarkSelectors(coreDir);
  for (const path of walk(join(root, "src/styles")).filter((f) => f.endsWith(".css"))) {
    const file = rel(path);
    if (file.endsWith("/status-mark.css")) continue;
    for (const { rules, declaration } of declarations(readFileSync(path, "utf8"))) {
      const property = declaration.split(":")[0].trim();
      if (!MARK_PROPERTIES.test(property)) continue;
      const mark = marks.find((selector) => rules.some((rule) => rule.includes(selector)));
      if (mark)
        errors.push(
          `${file}: ${property} on ${mark} belongs in status-mark.css; set --kind-status-mark-size`,
        );
    }
  }

  // Rule 5: every exception is a real file and a real spec §2 row.
  const allowed = specExceptions();
  for (const [file, exception] of Object.entries(exceptions)) {
    if (!allowed.has(exception)) {
      errors.push(`${file}: "${exception}" is not a spec exception (spec §2 "Building on UI SDK")`);
    }
    if (!existsSync(join(root, file))) errors.push(`${file}: exception file does not exist`);
  }

  return errors;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const exceptions = JSON.parse(readFileSync(join(repoRoot, "scripts/ui-sdk-exceptions.json"), "utf8"));
  const errors = checkUiSdkUsage(join(repoRoot, "packages/agent-ui"), exceptions);
  for (const error of errors) console.error(error);
  if (errors.length > 0) process.exit(1);
  console.log("ui-sdk usage: ok");
}
