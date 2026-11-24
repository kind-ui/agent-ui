import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import catalog, { components } from "../../registry/catalog.mjs";
import { catalogFile, componentCatalog, groups, skillDir } from "../build-skill.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const skill = fileURLToPath(skillDir);
const read = (path) => readFileSync(join(root, path), "utf8");
const skillFiles = [
  "SKILL.md",
  ...readdirSync(join(skill, "references")).map((file) => `references/${file}`),
].map((file) => join(skill, file));
const skillText = skillFiles.map((file) => readFileSync(file, "utf8")).join("\n");

const frontmatter = (file) => {
  const text = readFileSync(file, "utf8");
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  assert.ok(match, `${relative(root, file)} has no frontmatter`);
  return parse(match[1]);
};

/** The names a TypeScript file exports, read from its `export` statements. */
const exportedNames = (path) => {
  const text = read(path);
  const names = new Set();
  for (const [, list] of text.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const each of list.split(",")) {
      const name = each
        .trim()
        .split(/\s+as\s+/)
        .at(-1)
        ?.replace(/^type\s+/, "");
      if (name) names.add(name);
    }
  }
  for (const [, name] of text.matchAll(
    /export\s+(?:async\s+)?(?:function\*?|const|let|class|interface|type)\s+([A-Za-z_$][\w$]*)/g,
  )) {
    names.add(name);
  }
  return names;
};

const entries = {
  "@kind-ui/agent-ui": "packages/agent-ui/src/index.ts",
  "@kind-ui/agent-ui/core": "packages/agent-ui/src/core/index.ts",
  "@kind-ui/agent-ui/adapters/ai-sdk": "packages/agent-ui/src/adapters/ai-sdk/index.ts",
};

const skillCommand = "npx skills add kind-ui/agent-ui --skill agent-ui";

test("the component catalog is the one build-skill.mjs writes", () => {
  assert.equal(
    readFileSync(catalogFile, "utf8"),
    componentCatalog(),
    "references/components.md is stale: run npm run build:skill",
  );
});

test("every component has a group and a use-it-when line", () => {
  for (const [name, { group, when }] of Object.entries(components)) {
    assert.ok(Object.hasOwn(groups, group), `${name}: unknown group ${group}`);
    assert.match(when, /^[a-z].*\.$/, `${name}: when should be a lowercase clause ending in a period`);
  }
});

test("the skill's frontmatter is what the skills CLI needs", () => {
  const { name, description, metadata } = frontmatter(join(skill, "SKILL.md"));
  assert.equal(name, "agent-ui");
  assert.equal(name, skill.split("/").filter(Boolean).at(-1), "the folder is named after the skill");
  assert.match(name, /^[a-z0-9]+(-[a-z0-9]+)*$/);
  assert.ok(description && description.length <= 1024, "description is 1 to 1,024 characters");
  assert.notEqual(metadata?.internal, true, "the published skill isn't internal");
});

test("the skills CLI finds only the published skill", () => {
  const config = JSON.parse(read("skills.sh.json"));
  assert.ok(config.paths.includes("./packages/agent-ui/skills"));
  const locked = Object.keys(JSON.parse(read("skills-lock.json")).skills);
  for (const entry of readdirSync(join(root, ".agents/skills"), { withFileTypes: true })) {
    if (!entry.isDirectory() || locked.includes(entry.name)) continue;
    const { metadata } = frontmatter(join(root, ".agents/skills", entry.name, "SKILL.md"));
    assert.equal(metadata?.internal, true, `.agents/skills/${entry.name} needs metadata.internal: true`);
  }
});

test("the npm package ships the skill", () => {
  const { files } = JSON.parse(read("packages/agent-ui/package.json"));
  assert.ok(files.includes("skills"));
});

test("every link in the skill resolves", () => {
  for (const file of skillFiles) {
    const text = readFileSync(file, "utf8");
    for (const [, target] of text.matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^https?:/.test(target)) continue;
      const [path, anchor] = target.split("#");
      const resolved = path ? join(dirname(file), path) : file;
      assert.ok(existsSync(resolved), `${relative(root, file)}: ${target} is missing`);
      if (!anchor) continue;
      const slugs = [...readFileSync(resolved, "utf8").matchAll(/^#+ (.+)$/gm)].map(([, heading]) =>
        heading
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s/g, "-"),
      );
      assert.ok(slugs.includes(anchor), `${relative(root, file)}: no heading for #${anchor}`);
    }
  }
});

test("every registry item the skill names exists", () => {
  const items = new Set(catalog.items.map((item) => item.name));
  for (const [, name] of skillText.matchAll(/@kind-ui\/([a-z0-9-]+)(?![\w/-])/g)) {
    if (name === "agent-ui") continue;
    assert.ok(items.has(name), `@kind-ui/${name} is not a registry item`);
  }
});

test("every import in the skill's code exists", () => {
  for (const [, list, from] of skillText.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+"([^"]+)"/g)) {
    const component = /^@\/components\/ui\/([a-z-]+)$/.exec(from)?.[1];
    const path = component ? `packages/agent-ui/src/react/${component}.tsx` : entries[from];
    if (!path) continue;
    const names = exportedNames(path);
    for (const each of list.split(",")) {
      const name = each
        .trim()
        .replace(/^type\s+/, "")
        .split(/\s+as\s+/)[0];
      if (name) assert.ok(names.has(name), `${from} doesn't export ${name}`);
    }
  }
});

test("the skill, docs and README agree on layers and how to add the skill", () => {
  const install = readFileSync(join(skill, "references/install.md"), "utf8");
  const docs = read("apps/docs/content/docs/index.mdx");
  for (const floor of ["React 19", "Vue 3.5", "Svelte 5.33", "Solid 2"]) {
    assert.ok(install.includes(floor), `install.md names ${floor}`);
    assert.ok(docs.includes(floor), `the docs name ${floor}`);
  }
  for (const file of [
    "apps/docs/content/docs/index.mdx",
    "packages/agent-ui/README.md",
    "registry/agent-ui-setup/AGENTS.md",
  ]) {
    assert.ok(read(file).includes(skillCommand), `${file} shows ${skillCommand}`);
  }
});

test("the skill counts every component", () => {
  const text = readFileSync(join(skill, "SKILL.md"), "utf8");
  assert.ok(text.includes(`${Object.keys(components).length} components`));
});

test("every component tag in the skill's code is a React export", () => {
  const exported = new Set(
    readdirSync(join(root, "packages/agent-ui/src/react"))
      .filter((file) => file.endsWith(".tsx"))
      .flatMap((file) => [...exportedNames(`packages/agent-ui/src/react/${file}`)]),
  );
  const own = new Set(["Chat", "Shell", "SearchIcon", "Suspense"]);
  for (const [, code] of skillText.matchAll(/```tsx\n([\s\S]*?)```/g)) {
    for (const [, tag] of code.matchAll(/(?<!\w)<([A-Z]\w*)[\s/>]/g)) {
      if (!own.has(tag)) assert.ok(exported.has(tag), `<${tag}> isn't exported by a React component`);
    }
  }
});
