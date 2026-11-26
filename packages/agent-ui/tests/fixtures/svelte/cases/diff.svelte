<script module lang="ts">
  import type { AgentAction } from "@ui-sdk/svelte/agent";

  export const variants = ["all", "stream-40", "stream-2000"];

  // Revert marks the diff, so an agent's step there needs a person, which a test grants through `kindHost.permit`.
  export const allow = (step: AgentAction) =>
    !step.confirm || (window as { kindHost?: { permit?: boolean } }).kindHost?.permit === true;
</script>

<script lang="ts">
  import type { DiffOptions, Token } from "@kind-ui/agent-ui/core";
  import { Diff } from "../../../../src/svelte/diff/index.js";
  import { after, before, longPatch, renamePatch } from "../../shared/diff.js";
  import { expose } from "../../shared/expose.js";

  type Row = DiffOptions & { id: string; keepClipboard?: boolean; host?: boolean };

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const highlight = async (code: string): Promise<Token[]> =>
    code
      .split(/(const)/)
      .map((content) =>
        content === "const" ? { content, color: "light-dark(rgb(160, 0, 160), rgb(230, 150, 230))" } : { content },
      );

  const all: Row[] = [
    { id: "edit", file: { path: "src/values.ts", language: "ts" }, before, after, highlight, host: true },
    { id: "rename", patch: renamePatch, keepClipboard: true },
  ];

  const first = (): Row[] =>
    variant.startsWith("stream-")
      ? [{ id: "stream", patch: longPatch(Number(variant.slice(7))), streaming: true }]
      : all;

  let rows: Row[] = $state.raw(first());
  const recorded: { copies: [string, string][]; decisions: [string, string][] } = { copies: [], decisions: [] };
  const waiting: Record<string, () => void> = {};

  const update = (id: string, next: (row: Row) => Row) => {
    rows = rows.map((row) => (row.id === id ? next(row) : row));
  };

  const decide = (name: string) => (details: { source: string }) => {
    recorded.decisions.push([name, details.source]);
    return new Promise<void>((resolve) => {
      waiting[name] = resolve;
    });
  };

  expose({
    kindHost: recorded,
    kindDiff: {
      set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
      append: (id: string, text: string) => update(id, (row) => ({ ...row, patch: (row.patch ?? "") + text })),
      settle: (name: string) => waiting[name]?.(),
    },
  });
</script>

<div class="flex w-[40rem] max-w-full flex-col gap-3 p-6">
  {#each rows as { id, keepClipboard, host, ...row } (id)}
    <Diff
      {id}
      {...row}
      {...host ? { onAccept: decide("accept"), onRevert: decide("revert") } : {}}
      onCopy={(text, details) => {
        recorded.copies.push([text, details.reason]);
        if (keepClipboard) details.cancel();
      }}
    />
  {/each}
</div>
