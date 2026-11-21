<script module lang="ts">
  export const variants = ["all", "owned"];
</script>

<script lang="ts">
  import type { StackTraceOptions } from "@kind-ui/agent-ui/core";
  import { StackTrace } from "../../../../src/svelte/stack-trace/index.js";
  import { expose } from "../../shared/expose.js";
  import { assertionStack, typeErrorFrames, typeErrorStack } from "../../shared/stack-trace.js";

  type Row = StackTraceOptions & { id: string; openable?: boolean; keepClipboard?: boolean; accepts?: boolean };

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const recorded: {
    copies: [string, string][];
    opened: [number, string, string][];
    shown: [boolean, string][];
  } = { copies: [], opened: [], shown: [] };

  const all: Row[] = [
    { id: "stack", stack: typeErrorStack, openable: true },
    { id: "frames", label: "TypeError from frames", frames: typeErrorFrames },
    { id: "assertion", stack: assertionStack, defaultOpen: false },
  ];

  const owned: Row[] = [
    { id: "held", stack: typeErrorStack, showLibraryFrames: false, keepClipboard: true },
    { id: "accepted", stack: typeErrorStack, showLibraryFrames: false, accepts: true },
  ];

  // svelte-ignore state_referenced_locally
  let rows: Row[] = $state.raw(variant === "owned" ? owned : all);
  const set = (id: string, next: Partial<Row>) => {
    rows = rows.map((row) => (row.id === id ? { ...row, ...next } : row));
  };

  expose({ kindHost: recorded, kindStackTrace: { set } });
</script>

<div class="flex w-[36rem] flex-col gap-3 p-6">
  {#each rows as { id, openable, keepClipboard, accepts, showLibraryFrames, ...row } (id)}
    {@const onCopy = (text: string, details: { reason: string; cancel: () => void }) => {
      recorded.copies.push([text, details.reason]);
      if (keepClipboard) details.cancel();
    }}
    {@const onShowLibraryFramesChange = accepts
      ? (show: boolean, details: { reason: string }) => {
          recorded.shown.push([show, details.reason]);
          set(id, { showLibraryFrames: show });
        }
      : undefined}
    {@const onOpenFrame = openable
      ? (frame: { fn?: string }, details: { index: number; reason: string; source: string }) =>
          recorded.opened.push([details.index, frame.fn ?? "", `${details.reason}:${details.source}`])
      : undefined}
    {#if showLibraryFrames === undefined}
      <StackTrace {id} {...row} {onCopy} {onShowLibraryFramesChange} {onOpenFrame} />
    {:else}
      <StackTrace
        {id}
        {...row}
        bind:showLibraryFrames={() => showLibraryFrames, () => {}}
        {onCopy}
        {onShowLibraryFramesChange}
        {onOpenFrame}
      />
    {/if}
  {/each}
</div>
