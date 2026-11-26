import type { StepStatus } from "@kind-ui/agent-ui";
import type { StepGroupItem, StepGroupOptions } from "@kind-ui/agent-ui/core";
import { defineStepList } from "../../../../src/web/step.js";
import { defineStepGroup, type KindStepGroupElement } from "../../../../src/web/step-group.js";
import { defineSubagent } from "../../../../src/web/subagent.js";
import { defineTool } from "../../../../src/web/tool.js";
import {
  type AgentRow,
  agentLabels,
  agents,
  approval,
  stepGroupHost,
  type ToolRow,
  toolLabels,
  tools,
} from "../../shared/step-group.js";

const tool = (row: ToolRow, onApprove: (decision: unknown, details: { source: string }) => void) => {
  const el = document.createElement("kind-tool");
  el.id = `tool-${row.id}`;
  el.innerHTML = `<kind-step-list-item value="${row.id}"><kind-tool-trigger><button><kind-tool-icon></kind-tool-icon><kind-tool-title></kind-tool-title></button></kind-tool-trigger></kind-step-list-item><kind-tool-content><kind-tool-input></kind-tool-input></kind-tool-content><kind-tool-approval></kind-tool-approval>`;
  el.call = row.call;
  el.status = row.status;
  el.canApprove = true;
  el.addEventListener("approve", (event) => onApprove(event.detail, event.detail));
  return el;
};

const subagent = (row: AgentRow) => {
  const el = document.createElement("kind-subagent");
  el.id = `agent-${row.id}`;
  el.innerHTML = `<kind-step-list-item value="${row.id}"><kind-subagent-trigger><button><kind-subagent-icon></kind-subagent-icon><kind-subagent-title></kind-subagent-title><kind-subagent-meta></kind-subagent-meta></button></kind-subagent-trigger></kind-step-list-item><kind-subagent-content><p>${row.task}</p></kind-subagent-content>`;
  el.agentName = row.name;
  el.status = row.status;
  el.agentConfirm = false;
  return el;
};

const group = (id: string, fields: Partial<KindStepGroupElement>, steps: HTMLElement[], label?: string) => {
  const el = document.createElement("kind-step-group");
  el.id = id;
  Object.assign(el, fields);
  if (steps.length) {
    const list = document.createElement("kind-step-list");
    if (label) list.setAttribute("aria-label", label);
    list.append(...steps);
    const content = document.createElement("kind-step-group-content");
    content.append(list);
    el.append(content);
  }
  return el;
};

const stepGroups = (motion?: StepGroupOptions["motion"]) => (root: HTMLElement) => {
  defineTool();
  defineStepList();
  defineSubagent();
  defineStepGroup();
  const { host, cancel, approve } = stepGroupHost();
  const extra = motion ? { motion } : {};
  const toolGroup = group(
    "tools",
    { items: tools, groupLabels: toolLabels, durationSeconds: 8, ...extra },
    tools.map((row) => tool(row, approve)),
    "Tool calls",
  );
  const agentGroup = group(
    "agents",
    { items: agents, groupLabels: agentLabels, canCancel: true, ...extra },
    agents.map(subagent),
    "Agents",
  );
  agentGroup.addEventListener("stepgroupcancel", (event) => event.detail.waitUntil(cancel()));
  const page = document.createElement("div");
  page.className = "flex w-[28rem] flex-col gap-4 p-6";
  page.append(
    toolGroup,
    group(
      "approval",
      { items: [approval], groupLabels: toolLabels, ...extra },
      [tool(approval, approve)],
      "Approval",
    ),
    agentGroup,
    group("plain", { items: tools, label: "Checked the build" }, []),
  );
  root.append(page);
  const set = (items: StepGroupItem[], id: string, status: StepStatus) =>
    items.map((item) => (item.id === id ? { ...item, status } : item));
  Object.assign(window, {
    kindStepGroup: Object.assign(host, {
      setStatus: (id: string, status: StepStatus) => {
        const step = document.querySelector<HTMLElement & { status: StepStatus }>(
          `#tool-${id}, #agent-${id}`,
        );
        if (step) step.status = status;
        toolGroup.items = set(toolGroup.items ?? [], id, status);
        agentGroup.items = set(agentGroup.items ?? [], id, status);
      },
    }),
  });
};

export const cases = { all: stepGroups(), reduced: stepGroups("reduced") };
