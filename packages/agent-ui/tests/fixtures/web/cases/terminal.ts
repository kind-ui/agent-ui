import type { TerminalOptions } from "@kind-ui/agent-ui/core";
import { defineTerminal } from "../../../../src/web/terminal.js";
import { confirmationHost } from "../../shared/confirmation.js";
import { approvalTerminals, installRun, manyLines, testRun } from "../../shared/terminal.js";

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
  const { host, approve, deny, always } = confirmationHost();
  const list = document.createElement("div");
  list.className = "flex w-full max-w-[40rem] flex-col gap-4 p-6";
  for (const { id, options } of approvalTerminals()) {
    const terminal = document.createElement("kind-terminal");
    terminal.id = id;
    Object.assign(terminal, { canApprove: true, canDeny: true, canAlwaysAllow: true });
    terminal.addEventListener("approve", (event) =>
      event.detail.waitUntil(Promise.resolve(approve(event.detail.value, event.detail))),
    );
    terminal.addEventListener("deny", (event) =>
      event.detail.waitUntil(Promise.resolve(deny(event.detail.value, event.detail))),
    );
    terminal.addEventListener("alwaysallow", (event) =>
      event.detail.waitUntil(Promise.resolve(always(event.detail.value, event.detail))),
    );
    list.append(terminal);
    Object.assign(terminal, options);
  }
  root.append(list);
  Object.assign(window, {
    kindHost: host,
    kindTerminal: {
      set: (id: string, next: Partial<TerminalOptions>) =>
        Object.assign(root.querySelector(`#${id}`) as HTMLElementTagNameMap["kind-terminal"], next),
    },
  });
};

export const cases = {
  approval: approvals,
  all: terminals(all),
  owned: terminals(owned),
  "stream-10": terminals([{ id: "stream", command: "npm run build", output: manyLines(10) }]),
  "stream-1000": terminals([{ id: "stream", command: "npm run build", output: manyLines(1000) }]),
};
