import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import catalog from "../../registry/catalog.mjs";

const content = new URL("../../apps/docs/content/docs/", import.meta.url);
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

const showcases = { "agent-activity": "AgentActivityShowcase", "human-input": "HumanInputShowcase" };

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
    assert.doesNotMatch(source, /from "@\//, file);
    assert.doesNotMatch(source, /\]\(\/docs/, file);
  }
});
