import type { StepStatus, ToolCall } from "@kind-ui/agent-ui";
import type { SubagentOptions } from "@kind-ui/agent-ui/core";
import { type ReactNode, useEffect, useState } from "react";
import { StepList, StepListItem } from "../../../../src/react/step.js";
import { Subagent } from "../../../../src/react/subagent.js";
import {
  Tool,
  ToolContent,
  ToolIcon,
  ToolInput,
  ToolTitle,
  ToolTrigger,
} from "../../../../src/react/tool.js";
import { defineSubagent } from "../../../../src/web/subagent.js";

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

function Steps({ calls }: { calls: ToolCall[] }) {
  return (
    <StepList aria-label="Code reviewer steps">
      {calls.map((c) => (
        <Tool key={c.toolCallId} call={c}>
          <StepListItem value={c.toolCallId} render={<ToolTrigger />}>
            <ToolIcon />
            <ToolTitle />
          </StepListItem>
          <ToolContent>
            <ToolInput />
          </ToolContent>
        </Tool>
      ))}
    </StepList>
  );
}

function Subagents({ motion }: { motion?: SubagentOptions["motion"] }) {
  const [status, setStatus] = useState<StepStatus>("running");
  const [calls, setCalls] = useState([call("read_file"), call("grep")]);
  useEffect(() => {
    Object.assign(window, {
      kindCancels: cancels,
      kindSubagent: {
        setStatus,
        append: (name: string) => setCalls((all) => [...all, call(name)]),
      },
    });
  }, []);
  return (
    <div className="flex w-[28rem] flex-col gap-4 p-6">
      <Subagent
        id="subagent"
        agentName="Code reviewer"
        status={status}
        durationSeconds={status === "complete" ? 12 : undefined}
        result={RESULT}
        motion={motion}
        onCancel={() => new Promise<void>((resolve, reject) => cancels.push({ resolve, reject }))}
      >
        <Steps calls={calls} />
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

defineSubagent();

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "kind-subagent": { id?: string; "agent-name"?: string; status?: string; children?: ReactNode };
      "kind-subagent-content": { children?: ReactNode };
    }
  }
}

function WebElement() {
  const [steps, setSteps] = useState(["read_file", "grep"]);
  useEffect(() => {
    Object.assign(window, { kindSteps: setSteps });
  }, []);
  return (
    <div className="flex w-[28rem] flex-col gap-4 p-6">
      <kind-subagent id="element" agent-name="Code reviewer" status="running">
        <kind-subagent-content>
          {steps.map((step) => (
            <p key={step}>{step}</p>
          ))}
        </kind-subagent-content>
      </kind-subagent>
    </div>
  );
}

export const cases = {
  all: () => <Subagents />,
  reduced: () => <Subagents motion="reduced" />,
  "web-element": () => <WebElement />,
};
