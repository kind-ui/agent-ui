<script lang="ts">
  import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/svelte/composer/index.js";
  import { ContextBar, type ContextBarChipData } from "@/components/ui/svelte/context-bar/index.js";

  const editor = $props.id();

  const context: ContextBarChipData[] = [
    { id: "layout", label: "src/app/layout.tsx", kind: "file", icon: file },
    { id: "auth", label: "Lines 12–40 of auth.ts", kind: "selection", icon: selection },
    { id: "components", label: "src/components", kind: "folder", icon: folder },
    { id: "session", label: "src/lib/session.ts", kind: "file", icon: file },
    { id: "docs", label: "nextjs.org/docs/app/routing", kind: "url", icon: url },
    { id: "middleware", label: "middleware.ts", kind: "file", icon: file },
    { id: "env", label: ".env.example", kind: "file", icon: file },
  ];
  let chips = $state.raw(context);
</script>

<!-- Lucide "file", "folder", "square-dashed-text" and "link". -->
{#snippet glyph(paths: string[])}
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    {#each paths as d (d)}<path {d} />{/each}
  </svg>
{/snippet}
{#snippet file()}
  {@render glyph([
    "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
    "M14 2v5a1 1 0 0 0 1 1h5",
  ])}
{/snippet}
{#snippet folder()}
  {@render glyph([
    "M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z",
  ])}
{/snippet}
{#snippet selection()}
  {@render glyph([
    "M14 21h1",
    "M14 3h1",
    "M19 3a2 2 0 0 1 2 2",
    "M21 14v1",
    "M21 19a2 2 0 0 1-2 2",
    "M21 9v1",
    "M3 14v1",
    "M3 9v1",
    "M5 21a2 2 0 0 1-2-2",
    "M5 3a2 2 0 0 0-2 2",
    "M7 12h10",
    "M7 16h6",
    "M7 8h8",
    "M9 21h1",
    "M9 3h1",
  ])}
{/snippet}
{#snippet url()}
  {@render glyph([
    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  ])}
{/snippet}

<div class="flex w-full max-w-md flex-col gap-2">
  <ContextBar
    {chips}
    onRemove={(id: string) => (chips = chips.filter((chip) => chip.id !== id))}
    focusFallback={() => document.getElementById(editor)}
  />
  <Composer aria-label="Message">
    <ComposerInput id={editor} aria-label="Prompt" placeholder="Ask about this context" />
    <ComposerSubmit />
  </Composer>
</div>
