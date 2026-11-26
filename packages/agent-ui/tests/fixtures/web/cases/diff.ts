import type { DiffOptions, Token } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/web/agent";
import { defineDiff } from "../../../../src/web/diff.js";
import { after, before, longPatch, renamePatch } from "../../shared/diff.js";

type Row = DiffOptions & { id: string; keepClipboard?: boolean; host?: boolean };

const highlight = async (code: string): Promise<Token[]> =>
  code
    .split(/(const)/)
    .map((content) =>
      content === "const"
        ? { content, color: "light-dark(rgb(160, 0, 160), rgb(230, 150, 230))" }
        : { content },
    );

const diffs = (rows: Row[]) => (root: HTMLElement) => {
  defineDiff();
  const recorded: { copies: [string, string][]; decisions: [string, string][] } = {
    copies: [],
    decisions: [],
  };
  const waiting: Record<string, () => void> = {};
  const list = document.createElement("div");
  list.className = "flex w-[40rem] max-w-full flex-col gap-3 p-6";
  for (const { id, keepClipboard, host, ...row } of rows) {
    const diff = document.createElement("kind-diff");
    diff.id = id;
    Object.assign(diff, row);
    if (host) {
      diff.setAttribute("can-accept", "");
      diff.setAttribute("can-revert", "");
      for (const name of ["accept", "revert"] as const) {
        diff.addEventListener(`diff${name}`, (event) => {
          recorded.decisions.push([name, event.detail.source]);
          event.detail.waitUntil(
            new Promise<void>((resolve) => {
              waiting[name] = resolve;
            }),
          );
        });
      }
    }
    diff.addEventListener("diffcopy", (event) => {
      recorded.copies.push([event.detail.value, event.detail.reason]);
      if (keepClipboard) event.preventDefault();
    });
    list.append(diff);
  }
  root.append(list);
  const element = (id: string) => root.querySelector(`#${id}`) as HTMLElementTagNameMap["kind-diff"];
  Object.assign(window, {
    kindHost: recorded,
    kindDiff: {
      set: (id: string, next: Partial<Row>) => Object.assign(element(id), next),
      append: (id: string, text: string) => {
        element(id).patch = (element(id).patch ?? "") + text;
      },
      settle: (name: string) => waiting[name]?.(),
    },
  });
};

// Revert marks the diff, so an agent's step there needs a person, which a test grants through `kindHost.permit`.
export const allow = (step: AgentAction) =>
  !step.confirm || (window as { kindHost?: { permit?: boolean } }).kindHost?.permit === true;

export const cases = {
  all: diffs([
    { id: "edit", file: { path: "src/values.ts", language: "ts" }, before, after, highlight, host: true },
    { id: "rename", patch: renamePatch, keepClipboard: true },
  ]),
  "stream-40": diffs([{ id: "stream", patch: longPatch(40), streaming: true }]),
  "stream-2000": diffs([{ id: "stream", patch: longPatch(2000), streaming: true }]),
};
