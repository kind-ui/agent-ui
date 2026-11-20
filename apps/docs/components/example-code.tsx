import { rehypeCodeDefaultOptions, transformerIcon } from "fumadocs-core/mdx-plugins/rehype-code";
import {
  CodeBlockTab,
  CodeBlockTabs,
  CodeBlockTabsList,
  CodeBlockTabsTrigger,
} from "fumadocs-ui/components/codeblock";
import { ServerCodeBlock } from "fumadocs-ui/components/codeblock.rsc";
import type { ReactNode } from "react";
import { exampleFiles } from "@/lib/frameworks";

/** One tab group for the whole site, kept across pages and visits. */
export const frameworkGroup = { groupId: "framework", persist: true } as const;

const transformers = [...(rehypeCodeDefaultOptions.transformers ?? []), transformerIcon()];

/** Highlights code as a fenced block in a page does. */
export function Code({ code, lang }: { code: string; lang: string }) {
  return <ServerCodeBlock code={code} lang={lang} transformers={transformers} />;
}

/** Code tabs that follow the site's framework choice; a single tab renders as plain code. */
export function FrameworkTabs({ tabs }: { tabs: { label: string; children: ReactNode }[] }) {
  const [first] = tabs;
  if (!first) return null;
  if (tabs.length === 1) return first.children;
  return (
    <CodeBlockTabs defaultValue={first.label} {...frameworkGroup}>
      <CodeBlockTabsList>
        {tabs.map(({ label }) => (
          <CodeBlockTabsTrigger key={label} value={label}>
            {label}
          </CodeBlockTabsTrigger>
        ))}
      </CodeBlockTabsList>
      {tabs.map(({ label, children }) => (
        <CodeBlockTab key={label} value={label}>
          {children}
        </CodeBlockTab>
      ))}
    </CodeBlockTabs>
  );
}

/**
 * The source of an example in every framework it's written in, read at build time from
 * `examples/<example>.tsx`, `.vue`, `.svelte` and `.solid.tsx`: `<ExampleCode example="step/basic" />`.
 */
export function ExampleCode({ example }: { example: string }) {
  const tabs = exampleFiles(example).map(({ label, lang, code }) => ({
    label,
    children: <Code code={code} lang={lang} />,
  }));
  return (
    <div data-example-code="">
      <FrameworkTabs tabs={tabs} />
    </div>
  );
}
