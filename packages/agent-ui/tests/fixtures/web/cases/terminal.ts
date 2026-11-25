import type { TerminalOptions } from "@kind-ui/agent-ui/core";
import { defineTerminal } from "../../../../src/web/terminal.js";
import { defineTool } from "../../../../src/web/tool.js";
import { confirmationHost, request } from "../../shared/confirmation.js";
import { approvalCall, approvalRuns, installRun, manyLines, testRun } from "../../shared/terminal.js";

type Row = TerminalOptions & { id: string; keepClipboard?: boolean };

const terminals = (rows: Row[]) => (root: HTMLElement) => {
  defineTerminal();
  const recorded: { copies: [string, string][] } = { copies: [] };
  const list = document.createElement("div");
  list.className = "flex w-[34rem] flex-col gap-3 p-6";
  for (const { id, keepClipboard, ...row } of rows) {
    const terminal = document.createElement("kind-terminal");
    terminal.id = id;
    Object.assign(terminal, row);
    terminal.addEventListener("terminalcopy", (event) => {
      recorded.copies.push([event.detail.value, event.detail.reason]);
      if (keepClipboard) event.preventDefault();
    });
    if (row.open !== undefined) terminal.addEventListener("openchange", (event) => event.preventDefault());
    list.append(terminal);
  }
  root.append(list);
  const element = (id: string) => root.querySelector(`#${id}`) as HTMLElementTagNameMap["kind-terminal"];
  Object.assign(window, {
    kindHost: recorded,
    kindTerminal: {
      set: (id: string, next: Partial<Row>) => Object.assign(element(id), next),
      append: (id: string, text: string) => {
        element(id).output = (element(id).output ?? "") + text;
      },
    },
  });
};

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

const approvals = (root: HTMLElement) => {
  defineTerminal();
  defineTool();
  const { host, approve, deny, always } = confirmationHost();
  const list = document.createElement("div");
  list.className = "flex w-[34rem] flex-col gap-3 p-6";
  const above = document.createElement("p");
  above.id = "above";
  above.textContent = "Above the terminals";
  list.append(above);
  const hear = (el: HTMLElement, withAlways: boolean) => {
    const target = el as HTMLElementTagNameMap["kind-terminal"];
    target.addEventListener("approve", (event) =>
      event.detail.waitUntil(Promise.resolve(approve(event.detail.value, event.detail))),
    );
    target.addEventListener("deny", (event) =>
      event.detail.waitUntil(Promise.resolve(deny(event.detail.value, event.detail))),
    );
    if (withAlways)
      target.addEventListener("alwaysallow", (event) =>
        event.detail.waitUntil(Promise.resolve(always(event.detail.value, event.detail))),
      );
  };
  for (const [id, run] of Object.entries(approvalRuns)) {
    const terminal = document.createElement("kind-terminal");
    terminal.id = id;
    terminal.command = run.command;
    terminal.approvalReason = run.reason;
    terminal.canApprove = true;
    terminal.canDeny = true;
    terminal.canAlwaysAllow = run.always;
    hear(terminal, run.always);
    list.append(terminal);
    Object.assign(terminal, { approval: { ...request("requested"), approvalId: id }, output: "" });
  }
  const tool = document.createElement("kind-tool");
  tool.id = "tool";
  Object.assign(tool, { call: approvalCall, canApprove: true, canDeny: true, canAlwaysAllow: true });
  hear(tool, true);
  list.append(tool);
  root.append(list);
  Object.assign(window, {
    kindHost: host,
    kindTerminal: {
      set: (id: string, next: Partial<Row>) =>
        Object.assign(root.querySelector(`#${id}`) as HTMLElementTagNameMap["kind-terminal"], next),
    },
  });
};

export const cases = {
  all: terminals(all),
  owned: terminals(owned),
  "stream-10": terminals([{ id: "stream", command: "npm run build", output: manyLines(10) }]),
  "stream-1000": terminals([{ id: "stream", command: "npm run build", output: manyLines(1000) }]),
  approval: approvals,
};
