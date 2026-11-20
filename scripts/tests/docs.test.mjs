import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import catalog from "../../registry/catalog.mjs";

const docs = new URL("../../apps/docs/", import.meta.url);
const content = new URL("content/docs/", docs);
const examples = new URL("examples/", docs);
const components = catalog.items
  .filter((item) => item.layer === "react" && !item.hidden)
  .map((item) => item.name);
const page = (name) => readFileSync(new URL(`components/${name}.mdx`, content), "utf8");

for (const name of components) {
  test(`${name} has a component page with every section`, () => {
    const source = page(name);
    assert.match(source, /^---\ntitle: .+\ndescription: .+\n---\n/);
    assert.match(source, /<Example caption=".+">/);
    assert.ok(source.includes(`<include cwd lang="tsx">./examples/${name}/basic.tsx</include>`));
    assert.ok(source.includes("\n## Installation\n"));
    assert.ok(source.includes(`npx shadcn@latest add @kind-ui/${name}\n`));
    assert.ok(source.includes(`npx shadcn@latest add @kind-ui/${name}-web\n`));
    assert.ok(source.includes("\n## Usage\n"));
    assert.ok(source.includes("\n## API Reference\n\n<auto-type-table "));
    assert.ok(source.includes("\n### Agent\n"));
    assert.match(source, /\n<Caption>\n {2}Runs in React and Web Components\. .+\n<\/Caption>\n$/);
  });
}

test("the sidebar lists every component page", () => {
  const meta = JSON.parse(readFileSync(new URL("components/meta.json", content), "utf8"));
  assert.deepEqual([...meta.pages].sort(), [...components].sort());
});

const indexed = {
  "composer control": [
    "picker",
    "add-menu",
    "settings-menu",
    "approval-mode",
    "model-control",
    "context-bar",
    "dictation",
  ],
  "thread and shell": [
    "thread-list",
    "thread-search",
    "sidebar",
    "day-separator",
    "connection-status",
    "share-dialog",
    "conversation-search",
  ],
};

for (const [group, names] of Object.entries(indexed)) {
  test(`the docs index links every ${group} page`, () => {
    const meta = JSON.parse(readFileSync(new URL("components/meta.json", content), "utf8"));
    const index = readFileSync(new URL("index.mdx", content), "utf8");
    for (const name of names) {
      assert.ok(meta.pages.includes(name), `${name} is missing from components/meta.json`);
      assert.ok(
        index.includes(`](./components/${name}.mdx)`),
        `index.mdx doesn't link components/${name}.mdx`,
      );
    }
  });
}

test("the Sidebar page leads with the full chat shell", () => {
  const source = page("sidebar");
  const first = source.indexOf("<include cwd");
  assert.equal(
    source.slice(first, source.indexOf("</include>", first)),
    '<include cwd lang="tsx">./examples/sidebar/shell.tsx',
  );
});

const showcases = {
  "agent-activity": "AgentActivityShowcase",
  "human-input": "HumanInputShowcase",
  "developer-output": "DeveloperOutputShowcase",
};

test("the sidebar has a Showcase section with one live example per page", () => {
  const root = JSON.parse(readFileSync(new URL("meta.json", content), "utf8"));
  const at = root.pages.indexOf("---Showcase---");
  assert.deepEqual(root.pages.slice(at, at + 2), ["---Showcase---", "...showcase"]);
  const meta = JSON.parse(readFileSync(new URL("showcase/meta.json", content), "utf8"));
  assert.deepEqual(meta.pages, Object.keys(showcases));
  for (const [name, component] of Object.entries(showcases)) {
    const source = readFileSync(new URL(`showcase/${name}.mdx`, content), "utf8");
    assert.match(source, /^---\ntitle: .+\ndescription: .+\n---\n/, name);
    assert.ok(source.includes(`import ${component} from "../../../examples/showcase/${name}";`), name);
    assert.equal(source.match(/<Example /g)?.length, 1, name);
    assert.match(
      source,
      new RegExp(
        `<Example caption=".+">\\n {2}<${component} />\\n\\n {2}<include cwd lang="tsx">\\./examples/showcase/${name}\\.tsx</include>\\n</Example>`,
      ),
      name,
    );
  }
});

test("no page mentions an internal registry item", () => {
  for (const file of readdirSync(content, { recursive: true })) {
    if (!file.endsWith(".mdx")) continue;
    assert.doesNotMatch(readFileSync(new URL(file, content), "utf8"), /internal-/, file);
  }
});

test("pages import examples and link pages by relative path", () => {
  for (const file of readdirSync(content, { recursive: true })) {
    if (!file.endsWith(".mdx")) continue;
    const source = readFileSync(new URL(file, content), "utf8");
    assert.doesNotMatch(source, /from ["']@\//, file);
    assert.doesNotMatch(source, /\]\(\/|^\[[^\]]+\]:\s*\/|(?:href|src)=\{?["'`]\//m, file);
    assert.doesNotMatch(source, /kindui\.dev(?!\/r\/)|localhost/, file);
    for (const [, cwd, path] of source.matchAll(/<include( cwd)?[^>]*>([^<]+)<\/include>/g)) {
      const from = cwd ? docs : new URL(file, content);
      assert.ok(new URL(path, from).href.startsWith(examples.href), `${file}: ${path}`);
    }
  }
});

test("examples import only React, the package, ui components and other examples", () => {
  for (const file of readdirSync(examples, { recursive: true })) {
    if (!/\.tsx?$/.test(file)) continue;
    const url = new URL(file, examples);
    const source = readFileSync(url, "utf8");
    for (const [, specifier] of source.matchAll(/(?:\bfrom|\bimport)\s*\(?\s*["']([^"']+)["']/g)) {
      const allowed = specifier.startsWith(".")
        ? new URL(specifier, url).href.startsWith(examples.href)
        : /^(?:react|@kind-ui\/agent-ui(?:\/(?:core|adapters\/ai-sdk|styles\.css))?|@\/components\/ui\/.+)$/.test(
            specifier,
          );
      assert.ok(allowed, `${file}: ${specifier}`);
    }
  }
});
