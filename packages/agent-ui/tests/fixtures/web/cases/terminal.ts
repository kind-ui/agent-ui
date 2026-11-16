import type { TerminalOptions } from "@kind-ui/agent-ui/core";
import { defineTerminal } from "../../../../src/web/terminal.js";
import { installRun, manyLines, testRun } from "../../shared/terminal.js";

type Row = TerminalOptions & { id: string };

const terminals = (rows: Row[]) => (root: HTMLElement) => {
  defineTerminal();
  const recorded: { copies: [string, string][] } = { copies: [] };
  const list = document.createElement("div");
  list.className = "flex w-[34rem] flex-col gap-3 p-6";
  for (const { id, ...row } of rows) {
    const terminal = document.createElement("kind-terminal");
    terminal.id = id;
    Object.assign(terminal, row);
    terminal.addEventListener("terminalcopy", (event) =>
      recorded.copies.push([event.detail.value, event.detail.reason]),
    );
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

export const cases = {
  all: terminals(all),
  "stream-10": terminals([{ id: "stream", command: "npm run build", output: manyLines(10) }]),
  "stream-1000": terminals([{ id: "stream", command: "npm run build", output: manyLines(1000) }]),
};
