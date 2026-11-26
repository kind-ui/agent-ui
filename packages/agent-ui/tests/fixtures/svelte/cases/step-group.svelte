<script module lang="ts">
  export const variants = ["all", "live", "titles"];
</script>

<script lang="ts">
  import type { StepStatus } from "@kind-ui/agent-ui";
  import { StepList, StepListItem } from "../../../../src/svelte/step/index.js";
  import { StepGroup } from "../../../../src/svelte/step-group/index.js";
  import {
    SubagentContent,
    SubagentIcon,
    SubagentMeta,
    SubagentRoot,
    SubagentTitle,
    SubagentTrigger,
  } from "../../../../src/svelte/subagent/index.js";
  import {
    Tool,
    ToolApproval,
    ToolContent,
    ToolIcon,
    ToolMeta,
    ToolTitle,
    ToolTrigger,
  } from "../../../../src/svelte/tool/index.js";
  import { expose } from "../../shared/expose.js";
  import {
    callOf,
    frames,
    kinds,
    live,
    type StepGroupHandle,
    type StepGroupRow,
    titled,
  } from "../../shared/step-group.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const noop = () => {};

  const itemsOf = (rows: StepGroupRow[]) =>
    rows.map(({ id, status, kind, target }) => ({ id, status, kind, target }));

  let rows: StepGroupRow[] = $state.raw(live);
  const changes: StepGroupHandle["changes"] = [];

  expose({
    kindStepGroup: {
      set: (id: string, status: StepStatus) => {
        rows = rows.map((row) => (row.id === id ? { ...row, status } : row));
      },
      setAll: (statuses: Record<string, StepStatus>) => {
        rows = rows.map((row) => ({ ...row, status: statuses[row.id] ?? row.status }));
      },
      changes,
    } satisfies StepGroupHandle,
  });
</script>

{#snippet list(rows: StepGroupRow[], label: string)}<StepList aria-label={label}
    >{#each rows as row (row.id)}{#if row.kind === "agent"}<SubagentRoot
          agentName={row.title}
          status={row.status}
          autoOpen="never"
          ><StepListItem value={row.id}
            >{#snippet render({ props }: { props: Record<string, unknown> })}<SubagentTrigger {...props}
                ><SubagentIcon
                /><SubagentTitle
                /><SubagentMeta
              /></SubagentTrigger
            >{/snippet}</StepListItem
          ><SubagentContent><p>Details</p></SubagentContent
          ></SubagentRoot
        >{:else}<Tool
          call={callOf(row)}
          status={row.status}
          heading={row.title}
          autoOpen="never"
          onApprove={noop}
          onDeny={noop}
          ><StepListItem value={row.id}
            >{#snippet render({ props }: { props: Record<string, unknown> })}<ToolTrigger {...props}
                ><ToolIcon
                /><ToolTitle
                /><ToolMeta
              /></ToolTrigger
            >{/snippet}</StepListItem
          ><ToolContent><p>Details</p></ToolContent
          ><ToolApproval
        /></Tool
      >{/if}{/each}</StepList
  >{/snippet}

{#if variant === "all"}<div class="flex w-[36rem] max-w-full flex-col gap-6 p-6"
    >{#each frames as frame (frame.id)}<StepGroup id={frame.id} items={itemsOf(frame.rows)} {kinds} {...frame.options}
        >{@render list(frame.rows, `${frame.id} steps`)}</StepGroup
      >{/each}</div
  >{:else if variant === "live"}<div class="flex w-[36rem] max-w-full flex-col gap-6 p-6"
    ><StepGroup
      id="live"
      items={itemsOf(rows)}
      {kinds}
      durationSeconds={124}
      onOpenChange={(open: boolean, details: { reason: string }) => changes.push({ open, reason: details.reason })}
      >{@render list(rows, "Agents")}</StepGroup
    ><button type="button">After</button></div
  >{:else if variant === "titles"}<div class="flex w-[36rem] max-w-full flex-col gap-2 p-6"
    ><Tool id="titled" call={titled.running} heading={titled.heading} autoOpen="never"
    /><Tool
      id="titled-done"
      call={{ ...titled.running, output: { state: "available", value: "ok" } }}
      heading={titled.heading}
      autoOpen="never"
    /><Tool id="bare" call={titled.bare} defaultOpen
  /></div
>{/if}
