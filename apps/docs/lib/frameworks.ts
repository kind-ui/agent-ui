import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import * as core from "@kind-ui/agent-ui/core";
import { manifests } from "../../../registry/layers/index.mjs";

/** The tab labels of every layer; `<ExampleCode>` and `<Install>` share them, so one choice switches both. */
export const layerLabels = {
  react: "React",
  web: "Web Components",
  vue: "Vue",
  svelte: "Svelte",
  solid: "Solid",
} as const;

export type Layer = keyof typeof layerLabels;

const files = [
  { layer: "react", extension: ".tsx", lang: "tsx" },
  { layer: "vue", extension: ".vue", lang: "vue" },
  { layer: "svelte", extension: ".svelte", lang: "svelte" },
  { layer: "solid", extension: ".solid.tsx", lang: "tsx" },
  { layer: "web", extension: ".web.ts", lang: "ts" },
] as const;

/**
 * Every framework file of `examples/<example>`, read at build time, in tab order. A site that mounts these docs builds
 * from its own root, so it passes this docs app's directory as `docsApp`.
 */
export function exampleFiles(example: string, docsApp = process.cwd()) {
  const found = files.flatMap(({ layer, extension, lang }) => {
    const path = join(docsApp, "examples", `${example}${extension}`);
    return existsSync(path)
      ? [{ label: layerLabels[layer], lang, code: readFileSync(path, "utf8").trimEnd() }]
      : [];
  });
  if (!found.length) throw new Error(`ExampleCode: no file for examples/${example}`);
  return found;
}

const shipped: Record<"vue" | "svelte" | "solid", { components: string[] }> = manifests;

/** The install command of every layer that ships the component: React and Web always, the others once listed. */
export function installCommands(name: string) {
  const layers: Layer[] = [
    "react",
    "web",
    ...(Object.keys(shipped) as (keyof typeof shipped)[]).filter((layer) =>
      shipped[layer].components.includes(name),
    ),
  ];
  return layers.map((layer) => ({
    label: layerLabels[layer],
    code: `npx shadcn@latest add @kind-ui/${layer === "react" ? name : `${name}-${layer}`}`,
  }));
}

type Schema = Record<string, unknown>;

const optionsOf = (name: string): Schema => {
  for (const each of Object.values(core)) {
    if (typeof each === "function" && each.name === `kind-${name}` && "options" in each) {
      return (each.options ?? {}) as Schema;
    }
  }
  throw new Error(`FrameworkNames: no primitive named kind-${name}`);
};

const isCallback = (spec: unknown) => spec === "callback" || spec === "action";
const kebab = (text: string) =>
  text.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/^-/, "");
const changeOf = (key: string) => `on${key[0]?.toUpperCase()}${key.slice(1)}Change`;

export const frameworkColumns = ["React", "Vue", "Svelte", "Solid"];

export const frameworkNamesIntro =
  "Vue, Svelte and Solid take the same props. Controlled props and callbacks are spelled as each framework expects:";

/**
 * How a component's controlled props and callbacks are spelled in each framework (plan D5), read from its
 * primitive's options: one row per prop, holding a name or two per column of `frameworkColumns`.
 */
export function frameworkNames(name: string): string[][][] {
  const options = optionsOf(name);
  const controlled = Object.keys(options).filter((key) => isCallback(options[changeOf(key)]));
  const changes = new Set(controlled.map(changeOf));
  const callbacks = Object.keys(options).filter(
    (key) => /^on[A-Z]/.test(key) && isCallback(options[key]) && !changes.has(key),
  );
  return [
    ...controlled.map((key) => {
      const change = changeOf(key);
      return [
        [key, change],
        [`v-model:${key}`, `@${kebab(key)}-change`],
        [`bind:${key}`, change],
        [key, change],
      ];
    }),
    ...callbacks.map((key) => [[key], [`@${kebab(key.slice(2))}`], [key], [key]]),
  ];
}
