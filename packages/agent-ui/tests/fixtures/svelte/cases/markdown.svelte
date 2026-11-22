<script module lang="ts">
  export const variants = ["stream", "answer", "unsafe", "table", "highlight", "code-stream"];
</script>

<script lang="ts">
  import { flushSync } from "svelte";
  import { CodeBlock } from "../../../../src/svelte/code-block/index.js";
  import { Markdown } from "../../../../src/svelte/markdown/index.js";
  import { expose } from "../../shared/expose.js";
  import {
    answer,
    deferredHighlight,
    longAnswer,
    recordedEngine,
    unsafe,
    wideTable,
  } from "../../shared/markdown.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const frame = "m-4 w-[36rem] text-[var(--kind-color-fg)]";
  const { engine, records } = recordedEngine();
  const { highlight, requests } = deferredHighlight();
  let source = $state("");
  let streaming = $state(true);
  let code = $derived(variant === "highlight" ? "const a = 1;" : "");

  expose({
    kindMarkdown: {
      source: longAnswer,
      records,
      append: (chunk: string) => flushSync(() => (source += chunk)),
      finish: () => flushSync(() => (streaming = false)),
    },
    kindCode: {
      requests,
      setCode: (next: string) => flushSync(() => (code = next)),
      append: (chunk: string) => flushSync(() => (code += chunk)),
    },
  });
</script>

{#if variant === "stream"}
  <Markdown class={frame} {source} {streaming} {engine} />
{:else if variant === "answer"}
  <Markdown class={frame} source={answer} />
{:else if variant === "unsafe"}
  <Markdown class={frame} source={unsafe} />
{:else if variant === "table"}
  <Markdown class="m-4 w-80" source={wideTable} />
{:else if variant === "highlight"}
  <CodeBlock aria-label="Code" class={frame} {code} language="ts" {highlight} />
{:else}
  <CodeBlock aria-label="Code" class={frame} {code} language="ts" streaming lineNumbers />
{/if}
