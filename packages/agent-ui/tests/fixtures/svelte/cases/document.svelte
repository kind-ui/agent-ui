<script module lang="ts">
  export const variants = ["refused", "all", "reduced", "streaming"];
</script>

<script lang="ts">
  import type { MotionMode } from "@kind-ui/agent-ui/core";
  import { Document } from "../../../../src/svelte/document/index.js";
  import { chunks, code, downloads, notes, readme } from "../../shared/document.js";
  import { expose } from "../../shared/expose.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  let motion: MotionMode | undefined = $derived(variant === "reduced" ? "reduced" : undefined);

  const recorded: { downloads: [string | undefined, string][] } = { downloads: [] };

  let count = $state(0);

  let openings: string[] = $state([]);
  let settle: { resolve: () => void; reject: () => void } | undefined;

  expose({
    kindHost: {
      downloads: recorded.downloads,
      next: () => (count = Math.min(count + 1, chunks.length)),
      get openings() {
        return $state.snapshot(openings);
      },
      resolve: () => settle?.resolve(),
      reject: () => settle?.reject(),
    },
    kindDownload: () =>
      new Promise<void>((resolve, reject) => {
        settle = { resolve, reject };
      }),
  });

  const download = () =>
    (window as unknown as { kindDownload(): Promise<void> }).kindDownload();
</script>

{#if variant === "streaming"}
  <div class="w-[34rem] p-6">
    <Document
      id="streaming"
      label="README.md"
      content={chunks.slice(0, count).join("")}
      streaming={count < chunks.length}
      onDownload={() => {}}
    />
  </div>
{:else if variant === "refused"}
  <div class="w-[34rem] p-6">
    <Document
      id="readme"
      label="README.md"
      content={readme}
      bind:open={() => false, () => {}}
      onOpenChange={(open, details) => (openings = [...openings, `${open}:${details.reason}`])}
      onDownload={download}
      onCopy={(_content, details) => details.cancel()}
    />
  </div>
{:else}
  <div class="flex w-[34rem] flex-col gap-4 p-6">
    <Document
      id="readme"
      label="README.md"
      content={readme}
      {downloads}
      onDownload={(id, details) => void recorded.downloads.push([id, details.source])}
      {motion}
    />
    <Document id="code" label="backoff.ts" format="code" language="ts" content={code} />
    <Document id="notes" label="notes.txt" format="text" content={notes} />
  </div>
{/if}
