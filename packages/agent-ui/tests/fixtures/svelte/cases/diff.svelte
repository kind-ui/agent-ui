<script module lang="ts">
  export const variants = ["all", "live", "single", "stream", "budget"];
</script>

<script lang="ts">
  import type { DiffFile } from "@kind-ui/agent-ui";
  import { Diff } from "../../../../src/svelte/diff/index.js";
  import { bigPatch, createDiffHost, files, frames, run, streamedSession } from "../../shared/diff.js";
  import { expose } from "../../shared/expose.js";

  let { variant, params }: { variant: string; params: URLSearchParams } = $props();

  const noop = () => new Promise<void>(() => {});

  const live = (): { initial: DiffFile[]; open?: string[] } => {
    if (variant === "single") return { initial: [files.packageJson] };
    if (variant === "stream") return { initial: [files.signIn, streamedSession(4)], open: [files.session.path] };
    return { initial: run, open: [files.signIn.path] };
  };

  const start = live();
  let list: DiffFile[] = $state.raw(start.initial);
  const host = createDiffHost(
    () => list,
    (next) => (list = next),
  );

  const count = $derived(Number(params.get("lines") ?? 10));
  let extra = $state(0);
  const big = $derived([bigPatch(count, extra)]);

  if (variant === "budget") expose({ kindDiffStream: () => extra++ });
  else if (variant !== "all") expose({ kindDiff: host.handle });
</script>

{#if variant === "all"}
  <div class="flex w-[48rem] max-w-full flex-col gap-6 p-6">
    {#each frames as frame (frame.id)}
      <Diff id={frame.id} files={frame.files} defaultOpen={frame.open} onKeep={noop} onUndo={noop} />
    {/each}
  </div>
{:else if variant === "budget"}
  <div class="w-[48rem] p-6"><Diff id="budget" files={big} /></div>
{:else}
  <div class="flex w-[48rem] max-w-full flex-col gap-4 p-6">
    <button type="button">Before</button>
    <Diff
      id="live"
      files={list}
      defaultOpen={start.open}
      onKeep={host.onKeep}
      onUndo={host.onUndo}
      onOpenChange={host.onOpenChange}
    />
    <button type="button">After</button>
  </div>
{/if}
