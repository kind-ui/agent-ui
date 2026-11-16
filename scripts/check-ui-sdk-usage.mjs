#!/usr/bin/env node
// Fails when a component bypasses UI SDK (spec §2 "Building on UI SDK").
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const specPath = join(repoRoot, "docs/superpowers/specs/2026-11-14-agent-ui-design.md");

// `scrollTo(` and `scrollTop` must not match UI SDK APIs such as `createStickToBottom().scrollToBottom()`.
const matches = (source, pattern) =>
  pattern === "scrollTo"
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

  // Rules 2 and 3: render files use createParts or wrap a UI SDK component, with no hand-written behavior.
  const renderFiles = [
    ...walk(join(root, "src/react")).filter((f) => f.endsWith(".tsx")),
    ...walk(join(root, "src/web")).filter((f) => f.endsWith(".ts")),
  ];
  for (const path of renderFiles) {
    const file = rel(path);
    const raw = readFileSync(path, "utf8");
    const source = stripComments(raw);
    const usesParts =
      (importsFrom(source, "createParts", "@ui-sdk/react/primitive") ||
        importsFrom(source, "createParts", "@ui-sdk/web")) &&
      /\bcreateParts\s*\(/.test(source);
    // Web entries register their elements on import, so a bare `import "@ui-sdk/web/<name>"` wraps one too.
    // Type-only imports and the agent bridge wrap nothing.
    const valueImports = source.replace(/import\s+type\b[^;]*;/g, "");
    const wrapsComponent =
      /(from|import)\s*["']@ui-sdk\/(react\/(?!(primitive|agent)["'])|web\/(?!agent["']))[\w-]+["']/.test(
        valueImports,
      );
    if (!usesParts && !wrapsComponent) {
      errors.push(`${file}: render file must use createParts or wrap a UI SDK component`);
    }
    for (const pattern of RENDER_FORBIDDEN) {
      if (matches(source, pattern)) errors.push(`${file}: ${pattern} belongs in the primitive (UI SDK)`);
    }
  }

  // Rule 4: core files use UI SDK behaviors unless listed as a spec exception.
  for (const path of walk(coreDir).filter((f) => f.endsWith(".ts"))) {
    const file = rel(path);
    if (Object.hasOwn(exceptions, file)) continue;
    // A tabindex whose value comes from a UI SDK focus helper (`roving.tabIndex(state, part)`) is UI SDK's,
    // and so is a static `tabindex: "0"` in a slot that declares UI SDK's `focus: "tab-stop"`.
    const source = stripComments(readFileSync(path, "utf8"))
      .replace(/\btabindex["']?\s*:\s*[\w.]+\.tabIndex\(/g, "")
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
