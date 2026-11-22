<script module lang="ts">
  export const variants = ["all", "reduced"];
</script>

<script lang="ts">
  import type { StepStatus, ToolCall } from "@kind-ui/agent-ui";
  import { StepList, StepListItem } from "../../../../src/svelte/step/index.js";
  import { Subagent } from "../../../../src/svelte/subagent/index.js";
  import {
    Tool,
    ToolContent,
    ToolIcon,
    ToolInput,
    ToolTitle,
    ToolTrigger,
  } from "../../../../src/svelte/tool/index.js";
  import { expose } from "../../shared/expose.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const call = (name: string): ToolCall => ({
    toolCallId: name,
    name,
    dynamic: false,
    input: { state: "ready", value: { path: "src/index.ts" } },
    output: { state: "available", value: "ok" },
  });

  const AVATAR = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="#7c6cf0"/></svg>')}`;

  const RESULT = "Found **2** issues: an unused import and a missing `await`.";

  const cancels: { resolve(): void; reject(): void }[] = [];

  let status: StepStatus = $state("running");
  let calls: ToolCall[] = $state.raw([call("read_file"), call("grep")]);

  expose({
    kindCancels: cancels,
    kindSubagent: {
      setStatus: (next: StepStatus) => (status = next),
      append: (name: string) => (calls = [...calls, call(name)]),
    },
  });
</script>

<div class="flex w-[28rem] flex-col gap-4 p-6"
  ><Subagent
    id="subagent"
    agentName="Code reviewer"
    {status}
    durationSeconds={status === "complete" ? 12 : undefined}
    result={RESULT}
    motion={variant === "reduced" ? "reduced" : undefined}
    onCancel={() => new Promise<void>((resolve, reject) => cancels.push({ resolve, reject }))}
    ><StepList aria-label="Code reviewer steps"
      >{#each calls as c (c.toolCallId)}<Tool call={c}
          ><StepListItem value={c.toolCallId}
            >{#snippet render({ props }: { props: Record<string, unknown> })}<ToolTrigger {...props}
                ><ToolIcon
                /><ToolTitle
              /></ToolTrigger
            >{/snippet}</StepListItem
          ><ToolContent
            ><ToolInput
          /></ToolContent
        ></Tool
      >{/each}</StepList
  ></Subagent
  ><Subagent
    id="quick"
    agentName="Docs writer"
    avatarSrc={AVATAR}
    status="running"
    agentConfirm={false}
    onCancel={() => {}}
  /><Subagent id="readonly" agentName="Test runner" status="running"
  /><Subagent id="done" agentName="Release notes bot" status="complete" durationSeconds={4} result={RESULT}
  /><Subagent id="empty" agentName="Linter" status="complete"
/></div>
