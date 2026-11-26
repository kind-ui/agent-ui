<script module lang="ts">
  export const variants = ["approval", "all", "owned", "stream-10", "stream-1000"];
</script>

<script lang="ts">
  import type { TerminalOptions } from "@kind-ui/agent-ui/core";
  import { Terminal } from "../../../../src/svelte/terminal/index.js";
  import { expose } from "../../shared/expose.js";
  import { confirmationHost } from "../../shared/confirmation.js";
  import { approvalTerminals, installRun, manyLines, testRun } from "../../shared/terminal.js";

  type Row = TerminalOptions & { id: string; keepClipboard?: boolean };

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const all: Row[] = [
    { id: "test", command: "npm test", output: testRun, durationSeconds: 4.2 },
    {
      id: "failed",
      command: "npm run lint",
      output: testRun,
      exitCode: 1,
      durationSeconds: 4.2,
      defaultOpen: true,
    },
    { id: "install", command: "npm install", output: installRun, exitCode: 0, durationSeconds: 3 },
  ];

  const owned: Row[] = [
    { id: "held", command: "npm run dev", output: installRun, exitCode: 0, open: true, keepClipboard: true },
    { id: "empty", command: "npm run build", output: "" },
  ];

  const first = (): Row[] => {
    if (variant === "owned") return owned;
    if (variant.startsWith("stream-")) {
      return [{ id: "stream", command: "npm run build", output: manyLines(Number(variant.slice(7))) }];
    }
    return all;
  };

  let rows: Row[] = $state.raw(first());
  const recorded: { copies: [string, string][] } = { copies: [] };

  const update = (id: string, next: (row: Row) => Row) => {
    rows = rows.map((row) => (row.id === id ? next(row) : row));
  };

  const approving = () => variant === "approval";
  const { host, approve, deny, always } = confirmationHost();
  let approvals = $state.raw(approvalTerminals());

  expose({
    kindHost: approving() ? host : recorded,
    kindTerminal: {
      set: (id: string, next: Partial<Row>) => {
        if (!approving()) return update(id, (row) => ({ ...row, ...next }));
        approvals = approvals.map((row) => (row.id === id ? { ...row, options: { ...row.options, ...next } } : row));
      },
      append: (id: string, text: string) => update(id, (row) => ({ ...row, output: (row.output ?? "") + text })),
    },
  });
</script>

{#if variant === "approval"}
  <div class="flex w-full max-w-[40rem] flex-col gap-4 p-6">
    {#each approvals as { id, options } (id)}
      <Terminal {id} {...options} onApprove={approve} onDeny={deny} onAlwaysAllow={always} />
    {/each}
  </div>
{:else}
  <div class="flex w-[34rem] flex-col gap-3 p-6">
    <!-- An owned `open` changes only when the host sets it, as React's controlled prop does. -->
    {#each rows as { id, keepClipboard, open, ...row } (id)}
      <Terminal
        {id}
        {...row}
        bind:open={() => open, () => {}}
        onCopy={(text, details) => {
          recorded.copies.push([text, details.reason]);
          if (keepClipboard) details.cancel();
        }}
      />
    {/each}
  </div>
{/if}
