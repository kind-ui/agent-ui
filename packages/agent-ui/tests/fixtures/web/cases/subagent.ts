import type { StepStatus, ToolCall } from "@kind-ui/agent-ui";
import type { SubagentOptions } from "@kind-ui/agent-ui/core";
import { defineStepList } from "../../../../src/web/step.js";
import { defineSubagent } from "../../../../src/web/subagent.js";
import { defineTool } from "../../../../src/web/tool.js";

const call = (name: string): ToolCall => ({
  toolCallId: name,
  name,
  dynamic: false,
  input: { state: "ready", value: { path: "src/index.ts" } },
  output: { state: "available", value: "ok" },
});

const RESULT = "Found **2** issues: an unused import and a missing `await`.";

const tool = (name: string) => {
  const el = document.createElement("kind-tool");
  el.innerHTML = `<kind-step-list-item value="${name}"><kind-tool-trigger><button><kind-tool-icon></kind-tool-icon><kind-tool-title></kind-tool-title></button></kind-tool-trigger></kind-step-list-item><kind-tool-content><kind-tool-input></kind-tool-input></kind-tool-content>`;
  el.call = call(name);
  return el;
};

const subagent = (id: string, fields: Record<string, unknown>) => {
  const el = document.createElement("kind-subagent");
  el.id = id;
  Object.assign(el, fields);
  return el;
};

const subagents = (motion?: SubagentOptions["motion"]) => (root: HTMLElement) => {
  defineTool();
  defineStepList();
  defineSubagent();
  const page = document.createElement("div");
  page.className = "flex w-[28rem] flex-col gap-4 p-6";
  const list = document.createElement("kind-step-list");
  list.setAttribute("aria-label", "Code reviewer steps");
  list.append(tool("read_file"), tool("grep"));
  const main = subagent("subagent", { agentName: "Code reviewer", status: "running", result: RESULT });
  main.canCancel = true;
  if (motion) main.motion = motion;
  main.append(list);
  const cancels: { resolve(): void; reject(): void }[] = [];
  main.addEventListener("subagentcancel", (event) =>
    event.detail.waitUntil(new Promise<void>((resolve, reject) => cancels.push({ resolve, reject }))),
  );
  const quick = subagent("quick", { agentName: "Docs writer", status: "running", agentConfirm: false });
  quick.canCancel = true;
  page.append(
    main,
    quick,
    subagent("readonly", { agentName: "Test runner", status: "running" }),
    subagent("done", {
      agentName: "Release notes bot",
      status: "complete",
      durationSeconds: 4,
      result: RESULT,
    }),
  );
  root.append(page);
  Object.assign(window, {
    kindCancels: cancels,
    kindSubagent: {
      setStatus: (status: StepStatus) => {
        main.durationSeconds = status === "complete" ? 12 : undefined;
        main.status = status;
      },
      append: (name: string) => list.append(tool(name)),
    },
  });
};

export const cases = { all: subagents(), reduced: subagents("reduced") };
