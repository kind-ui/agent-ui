#!/usr/bin/env node
// Installs every registry item into clean Vite consumers, then builds and renders them (spec §10 "Registry consumers").
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import {
  closeSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { createServer as createNetServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, extname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import catalog from "../registry/catalog.mjs";
import { selectedLayers } from "../registry/layers/index.mjs";
import { fileOf, NAMESPACE, SHADCN, splitVersion, targetOf, validateCatalog } from "./build-registry.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const registryDir = join(root, "artifacts/registry/r");
const manifestFile = join(root, "artifacts/package/manifest.json");
const evidenceFile = join(root, "artifacts/registry/consumer-evidence.json");
// Set once the server listens on a free port.
let origin = "";
const pkg = JSON.parse(readFileSync(join(root, "packages/agent-ui/package.json"), "utf8"));
const workspace = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).devDependencies;

// `entry` is a file, or a folder of `main.<ext>` and `items/`, under `registry/consumers/`; `plugin` imports the
// framework's Vite plugin as `framework`.
const vite = ["vite", "tailwindcss", "@tailwindcss/vite"];
const consumers = {
  react: { entry: "react.tsx", devDependencies: [...vite, "react", "react-dom"] },
  web: { entry: "web.ts", devDependencies: vite },
  vue: {
    entry: "vue",
    main: "main.ts",
    plugin: 'import framework from "@vitejs/plugin-vue";',
    devDependencies: [...vite, "vue", "@vitejs/plugin-vue"],
  },
  svelte: {
    entry: "svelte",
    main: "main.ts",
    plugin: 'import { svelte as framework } from "@sveltejs/vite-plugin-svelte";',
    devDependencies: [...vite, "svelte", "@sveltejs/vite-plugin-svelte"],
  },
  solid: {
    entry: "solid",
    main: "main.tsx",
    plugin: 'import framework from "@solidjs/vite-plugin";',
    jsx: { jsx: "preserve", jsxImportSource: "@solidjs/web" },
    devDependencies: [...vite, "solid-js", "@solidjs/web", "@solidjs/vite-plugin"],
  },
};
const blockNames = catalog.items.filter((item) => item.meta?.block).map((item) => item.name);
const visibleItems = (layer) =>
  catalog.items.filter((item) => item.layer === layer && !item.hidden).map((item) => item.name);

/** Problems in the built registry that the shadcn CLI would only meet at install time. */
export function checkRegistryIntegrity(dir) {
  const errors = validateCatalog(catalog, pkg);
  const served = new Set(readdirSync(dir).map((file) => file.replace(/\.json$/, "")));
  const index = JSON.parse(readFileSync(join(dir, "registry.json"), "utf8"));
  for (const { name } of catalog.items) {
    if (!index.items.some((item) => item.name === name)) errors.push(`registry.json does not list ${name}`);
    if (!served.has(name)) {
      errors.push(`${name}.json was not built`);
      continue;
    }
    const item = JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8"));
    if (Boolean(item.meta?.hidden) !== name.startsWith("internal-")) errors.push(`${name}: hidden is wrong`);
    for (const dependency of item.registryDependencies) {
      if (!served.has(dependency.slice(NAMESPACE.length + 1)))
        errors.push(`${name}: ${dependency} is not served`);
    }
    for (const file of item.files) if (!file.content) errors.push(`${name}: ${file.path} has no content`);
    if (item.meta?.block && !existsSync(join(dir, "v0", `${name}.json`)))
      errors.push(`v0/${name}.json was not built`);
  }
  return errors;
}

// Async, so the server keeps answering while the command runs. `stdout` takes a file descriptor because the
// shadcn CLI exits before a pipe drains, cutting long output short.
function run(command, args, cwd, stdout = "inherit") {
  console.log(`$ ${command} ${args.join(" ")}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", stdout, "inherit"] });
    child.on("error", reject);
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${command} ${args[0]} failed`))));
  });
}

/** Serves the registry, an npm registry for the packed `@kind-ui` scope, and each consumer's build. */
function serve(tarball) {
  const bytes = readFileSync(tarball);
  const { devDependencies, scripts, ...manifest } = pkg;
  const packument = () => ({
    name: pkg.name,
    "dist-tags": { latest: pkg.version },
    versions: {
      [pkg.version]: {
        ...manifest,
        dist: {
          tarball: `${origin}/npm/agent-ui.tgz`,
          integrity: `sha512-${createHash("sha512").update(bytes).digest("base64")}`,
          shasum: createHash("sha1").update(bytes).digest("hex"),
        },
      },
    },
  });
  const sites = {};
  const types = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
  };
  const server = createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, origin).pathname);
    const [, area, ...rest] = path.split("/");
    let file;
    if (area === "npm") {
      if (rest[0] === "agent-ui.tgz") return response.end(bytes);
      if (rest.join("/") === pkg.name) return response.end(JSON.stringify(packument()));
    } else if (area === "r") file = join(registryDir, ...rest);
    else if (sites[area]) file = join(sites[area], ...(rest.join("/") ? rest : ["index.html"]));
    if (!file || rest.includes("..") || !existsSync(file)) {
      response.statusCode = 404;
      return response.end();
    }
    response.setHeader("content-type", types[extname(file)] ?? "application/octet-stream");
    response.end(readFileSync(file));
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      origin = `http://127.0.0.1:${server.address().port}`;
      resolve({ sites, close: () => server.close() });
    });
  });
}

async function install(layer, dir) {
  const { entry, main = entry, plugin, jsx = { jsx: "react-jsx" }, devDependencies } = consumers[layer];
  const json = (file, value) => writeFileSync(join(dir, file), `${JSON.stringify(value, null, 2)}\n`);
  json("package.json", {
    name: `consumer-${layer}`,
    private: true,
    type: "module",
    devDependencies: Object.fromEntries(devDependencies.map((name) => [name, workspace[name]])),
  });
  writeFileSync(join(dir, ".npmrc"), `${NAMESPACE}:registry=${origin}/npm/\n`);
  json("tsconfig.json", {
    compilerOptions: {
      module: "ESNext",
      moduleResolution: "Bundler",
      ...jsx,
      paths: { "@/*": ["./src/*"] },
    },
  });
  json("components.json", {
    $schema: "https://ui.shadcn.com/schema.json",
    style: "new-york",
    rsc: false,
    tsx: true,
    tailwind: { config: "", css: "src/index.css", baseColor: "neutral", cssVariables: true, prefix: "" },
    aliases: {
      components: "@/components",
      ui: "@/components/ui",
      lib: "@/lib",
      utils: "@/lib/utils",
      hooks: "@/hooks",
    },
    registries: { [NAMESPACE]: `${origin}/r/{name}.json` },
  });
  writeFileSync(
    join(dir, "vite.config.mjs"),
    `import tailwindcss from "@tailwindcss/vite";\n${plugin ? `${plugin}\n` : ""}export default { base: "./", plugins: [tailwindcss()${plugin ? ", framework()" : ""}] };\n`,
  );
  writeFileSync(
    join(dir, "index.html"),
    `<!doctype html>\n<html lang="en"><body><div id="root"></div><script type="module" src="/src/main${extname(main)}"></script></body></html>\n`,
  );
  writeFileSync(join(dir, "src/index.css"), '@import "tailwindcss";\n');
  cpSync(
    join(root, "registry/consumers", entry),
    main === entry ? join(dir, `src/main${extname(entry)}`) : join(dir, "src"),
    {
      recursive: true,
    },
  );

  await run("npm", ["install", "--no-audit", "--no-fund"], dir);
  const items = visibleItems(layer);
  await run("npx", ["--yes", SHADCN, "add", ...items.map((name) => `${NAMESPACE}/${name}`), "--yes"], dir);
  return items;
}

async function search(dir, label, names) {
  const searchFile = join(dir, "search.json");
  const searchOutput = openSync(searchFile, "w");
  await run(
    "npx",
    ["--yes", SHADCN, "search", NAMESPACE, "--limit", String(catalog.items.length), "--json"],
    dir,
    searchOutput,
  );
  closeSync(searchOutput);
  const listed = JSON.parse(readFileSync(searchFile, "utf8")).items.map((item) => item.name);
  return names
    .filter((name) => !listed.includes(name))
    .map((name) => `${label}: shadcn search does not list ${name}`);
}

// The Next consumer (starter blocks spec D7): an App Router app that already has a home page and a chat route.
const nextFiles = ["app/page.tsx", "app/api/chat/route.ts"];
// Where a block's targets land in the consumer, by its `components.json` aliases.
const nextPath = (target) =>
  target.startsWith("@ui/")
    ? `components/ui/${target.slice("@ui/".length)}`
    : target.replace(/^@components\//, "components/");

async function installNext(dir) {
  const docs = JSON.parse(readFileSync(join(root, "apps/docs/package.json"), "utf8"));
  const pins = { ...workspace, ...docs.dependencies, ...docs.devDependencies };
  cpSync(join(root, "registry/consumers/next"), dir, { recursive: true });
  const manifest = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  for (const field of ["dependencies", "devDependencies"]) {
    for (const name of Object.keys(manifest[field])) {
      if (!pins[name]) throw new Error(`registry/consumers/next: no workspace pin for ${name}`);
      manifest[field][name] = pins[name];
    }
  }
  writeFileSync(join(dir, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  const components = JSON.parse(readFileSync(join(dir, "components.json"), "utf8"));
  components.registries = { [NAMESPACE]: `${origin}/r/{name}.json` };
  writeFileSync(join(dir, "components.json"), `${JSON.stringify(components, null, 2)}\n`);
  writeFileSync(join(dir, ".npmrc"), `${NAMESPACE}:registry=${origin}/npm/\n`);
  const before = Object.fromEntries(nextFiles.map((file) => [file, readFileSync(join(dir, file), "utf8")]));
  await run("npm", ["install", "--no-audit", "--no-fund"], dir);
  await run(
    "npx",
    ["--yes", SHADCN, "add", ...blockNames.map((name) => `${NAMESPACE}/${name}`), "--yes"],
    dir,
  );
  return before;
}

function checkNextInstall(dir, before) {
  const errors = [];
  for (const [file, content] of Object.entries(before)) {
    if (readFileSync(join(dir, file), "utf8") !== content)
      errors.push(`next: shadcn add changed the app's ${file}`);
  }
  const version = (name) => {
    const manifest = join(dir, "node_modules", name, "package.json");
    return existsSync(manifest) ? JSON.parse(readFileSync(manifest, "utf8")).version : "missing";
  };
  const blocks = catalog.items.filter((item) => item.meta?.block);
  const pins = new Map(blocks.flatMap((item) => item.dependencies.map(splitVersion)));
  for (const [name, pin] of pins) {
    if (version(name) !== pin) errors.push(`next: installed ${name}@${version(name)}, pinned ${pin}`);
  }
  if (!readFileSync(join(dir, "app/globals.css"), "utf8").includes(`@import "${pkg.name}/styles.css"`)) {
    errors.push(`next: app/globals.css does not import ${pkg.name}/styles.css`);
  }
  const byName = new Map(catalog.items.map((item) => [`${NAMESPACE}/${item.name}`, item]));
  const copied = new Set(blocks);
  for (const item of copied)
    for (const dependency of item.registryDependencies) copied.add(byName.get(dependency));
  for (const { path, target } of [...copied].flatMap((item) => item.files.map(fileOf))) {
    const file = join(dir, nextPath(target));
    if (!existsSync(file)) errors.push(`next: ${path} was not copied to ${nextPath(target)}`);
    else if (readFileSync(file, "utf8") !== readFileSync(join(root, path), "utf8")) {
      errors.push(`next: ${path} changed on install`);
    }
  }
  return errors;
}

const freePort = () =>
  new Promise((resolve, reject) => {
    const server = createNetServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });

/** Builds the Next consumer, starts it and runs each block's flow (`tests/browser/blocks/<block>.flow.ts`) on its page. */
async function runNext(browser, dir) {
  await run("npx", ["next", "build"], dir);
  const port = await freePort();
  const app = `http://127.0.0.1:${port}`;
  console.log(`$ next start on ${app}`);
  // Run Next's own binary, not `npx`, so killing the process stops the server.
  const next = join(dir, "node_modules/next/dist/bin/next");
  const server = spawn(process.execPath, [next, "start", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: dir,
    stdio: ["ignore", "inherit", "inherit"],
  });
  const problems = [];
  try {
    for (let tries = 0; ; tries++) {
      try {
        if ((await fetch(app)).ok) break;
      } catch {}
      if (tries > 120 || server.exitCode !== null) throw new Error("next start did not answer");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    const flowed = [];
    for (const item of catalog.items.filter((each) => each.meta?.block)) {
      const folder = item.files
        .map(fileOf)
        .find((file) => file.type === "registry:page")
        .target.split("/")[1];
      const page = await browser.newPage();
      page.on("pageerror", (error) => problems.push(`next: ${item.name}: ${error.message}`));
      page.on(
        "console",
        (message) => message.type() === "error" && problems.push(`next: ${item.name}: ${message.text()}`),
      );
      await page.goto(`${app}/${folder}`);
      const tokens = await page.evaluate(
        () => getComputedStyle(document.documentElement).getPropertyValue("--kind-color-fg").trim() !== "",
      );
      if (!tokens)
        problems.push(`next: ${item.name}: the theme tokens from ${pkg.name}/styles.css are missing`);
      const flow = pathToFileURL(join(root, `tests/browser/blocks/${item.name}.flow.ts`)).href;
      try {
        await (await import(flow)).run(page);
        flowed.push(item.name);
      } catch (error) {
        problems.push(
          `next: ${item.name}: its flow failed: ${error.message.split("\n").slice(0, 6).join(" | ")}`,
        );
      }
      await page.close();
    }
    return { flowed, problems };
  } finally {
    server.kill();
  }
}

function checkInstall(layer, dir, items) {
  const errors = [];
  const version = (name) => {
    const manifest = join(dir, "node_modules", name, "package.json");
    return existsSync(manifest) ? JSON.parse(readFileSync(manifest, "utf8")).version : "missing";
  };
  const pins = {
    [pkg.name]: pkg.version,
    "@ui-sdk/core": catalog.uiSdkVersion,
    [`@ui-sdk/${layer}`]: catalog.uiSdkVersion,
  };
  for (const [name, pin] of Object.entries(pins)) {
    if (version(name) !== pin) errors.push(`${layer}: installed ${name}@${version(name)}, pinned ${pin}`);
  }
  const lock = JSON.parse(readFileSync(join(dir, "package-lock.json"), "utf8"));
  if (!lock.packages[`node_modules/${pkg.name}`]?.resolved?.startsWith(`${origin}/npm/`)) {
    errors.push(`${layer}: ${pkg.name} was not installed from the packed tarball`);
  }
  if (!readFileSync(join(dir, "src/index.css"), "utf8").includes(`@import "${pkg.name}/styles.css"`)) {
    errors.push(`${layer}: src/index.css does not import ${pkg.name}/styles.css`);
  }
  const byName = new Map(catalog.items.map((item) => [`${NAMESPACE}/${item.name}`, item]));
  const copied = new Set(items.map((name) => byName.get(`${NAMESPACE}/${name}`)));
  for (const item of copied)
    for (const dependency of item.registryDependencies) copied.add(byName.get(dependency));
  for (const file of [...copied].flatMap((item) => item.files)) {
    const target = join(dir, "src/components/ui", targetOf(file).slice("@ui/".length));
    if (!existsSync(target)) errors.push(`${layer}: ${file} was not copied`);
    else if (readFileSync(target, "utf8") !== readFileSync(join(root, file), "utf8")) {
      errors.push(`${layer}: ${file} changed on install`);
    }
  }
  return errors;
}

async function render(browser, layer, items) {
  const page = await browser.newPage();
  const problems = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => message.type() === "error" && problems.push(message.text()));
  await page.goto(`${origin}/${layer}/`);
  await page.locator("[data-item]").first().waitFor();
  const itemSuffix = layer === "react" ? "" : `-${layer}`;
  const { tokens, utilities, rendered } = await page.evaluate(
    ({ names, itemSuffix }) => {
      const button = document.querySelector('[data-slot="toolbar-button"]');
      return {
        tokens: getComputedStyle(document.documentElement).getPropertyValue("--kind-color-fg").trim() !== "",
        utilities: button !== null && getComputedStyle(button).minWidth === "28px",
        rendered: Object.fromEntries(
          names.map((name) => {
            const section = document.querySelector(
              `[data-item="${name.slice(0, name.length - itemSuffix.length)}"]`,
            );
            return [name, Boolean(section?.querySelector("[data-slot]"))];
          }),
        ),
      };
    },
    { names: items, itemSuffix },
  );
  await page.close();
  if (!tokens) problems.push(`the theme tokens from ${pkg.name}/styles.css are missing`);
  // The internal Toolbar's button is the utility probe, so a layer is checked once it ships one.
  if (!utilities && catalog.items.some((item) => item.name === `internal-toolbar${itemSuffix}`))
    problems.push("Tailwind generated no utilities for the copied files");
  return { rendered, problems };
}

async function check() {
  if (!existsSync(manifestFile)) throw new Error("no packed tarball; run `npm run check:package` first");
  if (!existsSync(registryDir)) throw new Error("no registry build; run `npm run build:registry` first");
  const integrity = checkRegistryIntegrity(registryDir);
  if (integrity.length) throw new Error(`registry integrity:\n  ${integrity.join("\n  ")}`);

  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  const sha256 = createHash("sha256")
    .update(readFileSync(join(root, manifest.tarball)))
    .digest("hex");
  if (sha256 !== manifest.sha256)
    throw new Error(`${manifest.tarball} changed since \`npm run check:package\``);
  // `KIND_LAYERS` picks the consumers; a layer whose manifest lists nothing yet has none.
  const layers = selectedLayers().filter((name) => visibleItems(name).length);
  if (!layers.length) {
    console.log("no selected layer has registry items; nothing to check");
    return;
  }
  const server = await serve(join(root, manifest.tarball));
  const browser = await chromium.launch();
  const dirs = [];
  const evidence = { shadcn: SHADCN, tarball: manifest.tarball, sha256: manifest.sha256, consumers: {} };
  try {
    const errors = [];
    for (const layer of layers) {
      // Outside the workspace, so nothing resolves from the repository's own node_modules.
      const dir = mkdtempSync(join(tmpdir(), `agent-ui-registry-${layer}-`));
      dirs.push(dir);
      mkdirSync(join(dir, "src"));
      const items = await install(layer, dir);
      errors.push(...checkInstall(layer, dir, items));
      errors.push(...(await search(dir, layer, items)));
      await run("npx", ["vite", "build"], dir);
      server.sites[layer] = join(dir, "dist");
      const { rendered, problems } = await render(browser, layer, items);
      errors.push(...problems.map((problem) => `${layer}: ${problem}`));
      for (const [name, ok] of Object.entries(rendered))
        if (!ok) errors.push(`${layer}: ${name} did not render`);
      evidence.consumers[layer] = {
        installed: Object.fromEntries(
          [pkg.name, "@ui-sdk/core", `@ui-sdk/${layer}`].map((name) => [
            name,
            JSON.parse(readFileSync(join(dir, "node_modules", name, "package.json"), "utf8")).version,
          ]),
        ),
        rendered: Object.keys(rendered).filter((name) => rendered[name]),
      };
    }
    // Blocks install into a Next app (React only, starter blocks spec D2).
    if (blockNames.length && selectedLayers().includes("react")) {
      const dir = mkdtempSync(join(tmpdir(), "agent-ui-registry-next-"));
      dirs.push(dir);
      const before = await installNext(dir);
      errors.push(...checkNextInstall(dir, before));
      errors.push(...(await search(dir, "next", blockNames)));
      const { flowed, problems } = await runNext(browser, dir);
      errors.push(...problems);
      evidence.consumers.next = {
        installed: Object.fromEntries(
          [pkg.name, "next", "ai", "@ai-sdk/react"].map((name) => [
            name,
            JSON.parse(readFileSync(join(dir, "node_modules", name, "package.json"), "utf8")).version,
          ]),
        ),
        blocks: flowed,
      };
    }
    // Only a run over every layer writes the evidence, so a filtered run never replaces it with less.
    const complete = !process.env.KIND_LAYERS?.trim();
    if (complete) writeFileSync(evidenceFile, `${JSON.stringify(evidence, null, 2)}\n`);
    if (errors.length) throw new Error(errors.join("\n  "));
    const counts = Object.entries(evidence.consumers).map(([layer, { rendered, blocks }]) =>
      blocks ? `${blocks.length} block` : `${rendered.length} ${layer}`,
    );
    const where = complete ? `; evidence in ${evidenceFile.slice(root.length + 1)}` : "";
    console.log(`rendered ${counts.join(" and ")} items${where}`);
  } finally {
    await browser.close();
    server.close();
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  check().catch((error) => {
    console.error(`check-registry-consumers: ${error.message}`);
    process.exit(1);
  });
}
