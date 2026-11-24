import { Code } from "./example-code";

// The registry a block's v0 payload is served from, `https://kindui.dev` unless a build sets another.
const registryOrigin = process.env.NEXT_PUBLIC_REGISTRY_ORIGIN ?? "https://kindui.dev";

const link =
  "inline-flex h-8 items-center rounded-md border px-3 font-medium text-fd-foreground text-sm transition-colors hover:bg-fd-accent";

/**
 * A block page's toolbar: its install command with Copy, Open in v0 with the block's flattened payload, and
 * View code, which jumps to the page's Code section: `<BlockToolbar name="coding-agent-starter" />`.
 */
export function BlockToolbar({ name }: { name: string }) {
  const payload = `${registryOrigin}/r/v0/${name}.json`;
  return (
    <div className="not-prose my-6 flex flex-col gap-3">
      <Code code={`npx shadcn@latest add @kind-ui/${name}`} lang="bash" />
      <div className="flex flex-wrap gap-2">
        <a
          className={link}
          href={`https://v0.dev/chat/api/open?url=${encodeURIComponent(payload)}`}
          target="_blank"
          rel="noreferrer"
        >
          Open in v0
        </a>
        <a className={link} href="#code">
          View code
        </a>
      </div>
    </div>
  );
}
