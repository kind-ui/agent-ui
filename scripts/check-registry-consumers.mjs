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
import { tmpdir } from "node:os";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import catalog from "../registry/catalog.mjs";
import { NAMESPACE, SHADCN, targetOf, validateCatalog } from "./build-registry.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const registryDir = join(root, "artifacts/registry/r");
const manifestFile = join(root, "artifacts/package/manifest.json");
const evidenceFile = join(root, "artifacts/registry/consumer-evidence.json");
const origin = "http://127.0.0.1:4320";
const pkg = JSON.parse(readFileSync(join(root, "packages/agent-ui/package.json"), "utf8"));
const workspace = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).devDependencies;

const consumers = {
  react: {
    entry: "react.tsx",
    devDependencies: ["vite", "tailwindcss", "@tailwindcss/vite", "react", "react-dom"],
  },
  web: { entry: "web.ts", devDependencies: ["vite", "tailwindcss", "@tailwindcss/vite"] },
};

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
  const packument = {
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
  };
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
      if (rest.join("/") === pkg.name) return response.end(JSON.stringify(packument));
    } else if (area === "r") file = join(registryDir, ...rest);
    else if (sites[area]) file = join(sites[area], ...(rest.join("/") ? rest : ["index.html"]));
    if (!file || !existsSync(file)) {
      response.statusCode = 404;
      return response.end();
    }
    response.setHeader("content-type", types[extname(file)] ?? "application/octet-stream");
    response.end(readFileSync(file));
  });
  return new Promise((resolve) =>
    server.listen(4320, "127.0.0.1", () => resolve({ sites, close: () => server.close() })),
  );
}

async function install(layer, dir) {
  const { entry, devDependencies } = consumers[layer];
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
      jsx: "react-jsx",
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
    `import tailwindcss from "@tailwindcss/vite";\nexport default { base: "./", plugins: [tailwindcss()] };\n`,
  );
  writeFileSync(
    join(dir, "index.html"),
    `<!doctype html>\n<html lang="en"><body><div id="root"></div><script type="module" src="/src/main${extname(entry)}"></script></body></html>\n`,
  );
  writeFileSync(join(dir, "src/index.css"), '@import "tailwindcss";\n');
  cpSync(join(root, "registry/consumers", entry), join(dir, `src/main${extname(entry)}`));

  await run("npm", ["install", "--no-audit", "--no-fund"], dir);
  const items = catalog.items.filter((item) => item.layer === layer && !item.hidden).map((item) => item.name);
  await run("npx", ["--yes", SHADCN, "add", ...items.map((name) => `${NAMESPACE}/${name}`), "--yes"], dir);
  return items;
}

function checkInstall(layer, dir, items) {
  const errors = [];
  const version = (name) =>
    JSON.parse(readFileSync(join(dir, "node_modules", name, "package.json"), "utf8")).version;
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
  const rendered = await page.evaluate((names) => {
    const tokens =
      getComputedStyle(document.documentElement).getPropertyValue("--kind-color-fg").trim() !== "";
    const button = document.querySelector('[data-slot="toolbar-button"]');
    const utilities = button !== null && getComputedStyle(button).minWidth === "28px";
    return Object.fromEntries(
      names.map((name) => {
        const section = document.querySelector(`[data-item="${name.replace(/-web$/, "")}"]`);
        return [name, tokens && utilities && Boolean(section?.querySelector("[data-slot]"))];
      }),
    );
  }, items);
  await page.close();
  return { rendered, problems };
}

async function check() {
  if (!existsSync(manifestFile)) throw new Error("no packed tarball; run `npm run check:package` first");
  if (!existsSync(registryDir)) throw new Error("no registry build; run `npm run build:registry` first");
  const integrity = checkRegistryIntegrity(registryDir);
  if (integrity.length) throw new Error(`registry integrity:\n  ${integrity.join("\n  ")}`);

  const manifest = JSON.parse(readFileSync(manifestFile, "utf8"));
  const server = await serve(join(root, manifest.tarball));
  const browser = await chromium.launch();
  const dirs = [];
  const evidence = { shadcn: SHADCN, tarball: manifest.tarball, sha256: manifest.sha256, consumers: {} };
  try {
    const errors = [];
    for (const layer of Object.keys(consumers)) {
      // Outside the workspace, so nothing resolves from the repository's own node_modules.
      const dir = mkdtempSync(join(tmpdir(), `agent-ui-registry-${layer}-`));
      dirs.push(dir);
      mkdirSync(join(dir, "src"));
      const items = await install(layer, dir);
      errors.push(...checkInstall(layer, dir, items));
      const searchFile = join(dir, "search.json");
      const searchOutput = openSync(searchFile, "w");
      await run("npx", ["--yes", SHADCN, "search", NAMESPACE, "--limit", "100", "--json"], dir, searchOutput);
      closeSync(searchOutput);
      const listed = JSON.parse(readFileSync(searchFile, "utf8")).items.map((item) => item.name);
      for (const name of items)
        if (!listed.includes(name)) errors.push(`${layer}: shadcn search does not list ${name}`);
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
    writeFileSync(evidenceFile, `${JSON.stringify(evidence, null, 2)}\n`);
    if (errors.length) throw new Error(errors.join("\n  "));
    const counts = Object.entries(evidence.consumers).map(
      ([layer, { rendered }]) => `${rendered.length} ${layer}`,
    );
    console.log(`rendered ${counts.join(" and ")} items; evidence in ${evidenceFile.slice(root.length + 1)}`);
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
