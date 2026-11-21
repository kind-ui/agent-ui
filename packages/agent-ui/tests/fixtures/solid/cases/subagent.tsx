import type { StepStatus, ToolCall } from "@kind-ui/agent-ui";
import type { SubagentOptions } from "@kind-ui/agent-ui/core";
import { createSignal, For, onSettled } from "solid-js";
import { StepList, StepListItem } from "../../../../src/solid/step.js";
import { Subagent } from "../../../../src/solid/subagent.js";
import {
  Tool,
  ToolContent,
  ToolIcon,
  ToolInput,
  ToolTitle,
  ToolTrigger,
} from "../../../../src/solid/tool.js";
import { expose } from "../../shared/expose.js";

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

function Steps(props: { calls: ToolCall[] }) {
  return (
    <StepList aria-label="Code reviewer steps">
      <For each={props.calls} keyed={(c) => c.toolCallId}>
        {(c) => (
          <Tool call={c()}>
            <StepListItem value={c().toolCallId} render={ToolTrigger}>
              <ToolIcon />
              <ToolTitle />
            </StepListItem>
            <ToolContent>
              <ToolInput />
            </ToolContent>
          </Tool>
        )}
      </For>
    </StepList>
  );
}

function Subagents(props: { motion?: SubagentOptions["motion"] }) {
  const [status, setStatus] = createSignal<StepStatus>("running");
  const [calls, setCalls] = createSignal([call("read_file"), call("grep")]);
  onSettled(() =>
    expose({
      kindCancels: cancels,
      kindSubagent: {
        setStatus,
        append: (name: string) => setCalls((all) => [...all, call(name)]),
      },
    }),
  );
  return (
    <div class="flex w-[28rem] flex-col gap-4 p-6">
      <Subagent
        id="subagent"
        agentName="Code reviewer"
        status={status()}
        durationSeconds={status() === "complete" ? 12 : undefined}
        result={RESULT}
        motion={props.motion}
        onCancel={() => new Promise<void>((resolve, reject) => cancels.push({ resolve, reject }))}
      >
        <Steps calls={calls()} />
      </Subagent>
      <Subagent
        id="quick"
        agentName="Docs writer"
        avatarSrc={AVATAR}
        status="running"
        agentConfirm={false}
        onCancel={() => {}}
      />
      <Subagent id="readonly" agentName="Test runner" status="running" />
      <Subagent
        id="done"
        agentName="Release notes bot"
        status="complete"
        durationSeconds={4}
        result={RESULT}
      />
      <Subagent id="empty" agentName="Linter" status="complete" />
    </div>
  );
}

export const cases = {
  all: () => <Subagents />,
  reduced: () => <Subagents motion="reduced" />,
};
