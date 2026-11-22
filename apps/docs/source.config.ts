import { markdownTable, replaceSource } from "fumadocs-core/mdx-plugins/stringifier";
import { defineConfig } from "fumadocs-mdx/config";
import {
  createFileSystemGeneratorCache,
  createGenerator,
  type GenerateOptions,
  remarkAutoTypeTable,
} from "fumadocs-typescript";
import type { Nodes, Root } from "mdast";
import type { VFile } from "vfile";
import {
  exampleFiles,
  frameworkColumns,
  frameworkNames,
  frameworkNamesIntro,
  installCommands,
} from "./lib/frameworks";

const generator = createGenerator({ cache: createFileSystemGeneratorCache(".next/fumadocs-typescript") });

const written = (type: string) => type.replace(/ \| undefined$/, "");

// Spells out string unions behind an alias (`MotionMode` reads `"auto" | "none" | "reduced"`), and shows short
// types as written rather than as "union"; `?` already says a prop is optional.
const transform: GenerateOptions["transform"] = function (entry, type) {
  const declared = written(entry.type);
  if (type.isUnionType()) {
    const members = type
      .getTypes()
      .map((member) => this.checker.typeToString(member))
      .filter((member) => member !== "undefined");
    if (members.every((member) => member.startsWith('"'))) entry.type = members.join(" | ");
  }
  const short = [written(entry.type), declared].find((each) => each.length <= 40);
  if (short) entry.simplifiedType = short;
};

const fenced = ({ code, lang, label }: { code: string; lang: string; label: string }) => {
  const fence = "`".repeat(Math.max(3, ...[...code.matchAll(/`+/g)].map(([run]) => run.length + 1)));
  return `${fence}${lang} tab="${label}"\n${code}\n${fence}`;
};

const attribute = (node: Nodes, name: string) => {
  if (node.type !== "mdxJsxFlowElement") return;
  const found = node.attributes.find((each) => each.type === "mdxJsxAttribute" && each.name === name);
  return typeof found?.value === "string" ? found.value : undefined;
};

const names = (cells: string[][]) => cells.map((cell) => cell.map((name) => `\`${name}\``).join(", "));

// What `<ExampleCode>`, `<Install>` and `<FrameworkNames>` show, as Markdown, keyed by component and its one prop.
const markdownOf: Record<string, [string, (value: string) => string]> = {
  ExampleCode: ["example", (example) => exampleFiles(example).map(fenced).join("\n\n")],
  Install: [
    "name",
    (name) =>
      installCommands(name)
        .map((command) => fenced({ ...command, lang: "bash" }))
        .join("\n\n"),
  ],
  FrameworkNames: [
    "name",
    (name) => {
      const rows = frameworkNames(name);
      return rows.length
        ? `${frameworkNamesIntro}\n\n${markdownTable([frameworkColumns, ...rows.map(names)])}`
        : "";
    },
  ],
};

// The page Markdown (`/llms.mdx`, `llms-full.txt`) gets what those components render, in their place.
const remarkFrameworkMarkdown = () => (tree: Root, file: VFile) => {
  const visit = (node: Nodes) => {
    const entry = node.type === "mdxJsxFlowElement" && node.name ? markdownOf[node.name] : undefined;
    const value = entry && attribute(node, entry[0]);
    if (entry && value) replaceSource(file, node, entry[1](value), "markdown");
    if ("children" in node) for (const child of node.children) visit(child);
  };
  visit(tree);
};

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [[remarkAutoTypeTable, { generator, options: { transform } }], remarkFrameworkMarkdown],
  },
});
