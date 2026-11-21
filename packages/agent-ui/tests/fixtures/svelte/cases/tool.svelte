<script module lang="ts">
  import { confirmationHost } from "../../shared/confirmation.js";

  export const variants = ["all", "many-10", "many-500"];

  const { host, approve, deny } = confirmationHost();
</script>

<script lang="ts">
  import type { ToolCall } from "@kind-ui/agent-ui";
  import type { ToolOptions } from "@kind-ui/agent-ui/core";
  import { Tool } from "../../../../src/svelte/tool/index.js";
  import { expose } from "../../shared/expose.js";

  type Row = Pick<ToolOptions, "status" | "error" | "motion" | "label" | "onApprove" | "onDeny"> & {
    call: ToolCall;
  };

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const call = (name: string, fields: Partial<ToolCall> = {}): ToolCall => ({
    toolCallId: name,
    name,
    dynamic: false,
    input: { state: "ready", value: { query: "steps" } },
    ...fields,
  });

  const initial = (): Record<string, Row> => ({
    search: { call: call("search_docs", { input: { state: "streaming", value: { query: "ste" } } }) },
    read: { call: call("read_file", { input: { state: "ready", value: { path: "README.md" } } }) },
    run: { call: call("run_tests") },
    approve: {
      call: call("delete_file", { approval: { approvalId: "a1", generation: 1, state: "requested" } }),
      onApprove: approve,
      onDeny: deny,
    },
    done: { call: call("summarize", { output: { state: "available", value: "Found **3** results." } }) },
    failed: {
      call: call("fetch_url", { outcome: "error" }),
      error: { message: "Request timed out after 30 s." },
    },
  });

  const many = (size: number): Record<string, Row> =>
    Object.fromEntries(Array.from({ length: size }, (_, i) => [`tool-${i}`, { call: call(`tool_${i}`) }]));

  // One signal per row, as React's memoized rows, so an update to one tool reads no other tool's props.
  class Box {
    row: Row = $state.raw() as Row;
    constructor(row: Row) {
      this.row = row;
    }
  }

  const rows = Object.fromEntries(
    // svelte-ignore state_referenced_locally
    Object.entries(variant === "many-10" ? many(10) : variant === "many-500" ? many(500) : initial()).map(
      ([id, row]) => [id, new Box(row)],
    ),
  );

  const update = (id: string, next: (row: Row) => Row) => {
    const box = rows[id] as Box;
    box.row = next(box.row);
  };

  expose({
    kindHost: host,
    kindTool: {
      set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
      setCall: (id: string, next: Partial<ToolCall>) =>
        update(id, (row) => ({ ...row, call: { ...row.call, ...next } })),
    },
  });
</script>

<div class="flex w-[28rem] flex-col gap-2 p-6">
  {#each Object.entries(rows) as [id, box] (id)}
    <Tool {id} {...box.row} />
  {/each}
</div>
