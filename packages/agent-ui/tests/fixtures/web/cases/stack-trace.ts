import type { StackTraceOptions } from "@kind-ui/agent-ui/core";
import { defineStackTrace } from "../../../../src/web/stack-trace.js";
import { assertionStack, typeErrorFrames, typeErrorStack } from "../../shared/stack-trace.js";

type Row = StackTraceOptions & { id: string; openable?: boolean; keepClipboard?: boolean };

const stackTraces = (rows: Row[]) => (root: HTMLElement) => {
  defineStackTrace();
  const recorded: { copies: [string, string][]; opened: [number, string, string][] } = {
    copies: [],
    opened: [],
  };
  const list = document.createElement("div");
  list.className = "flex w-[36rem] flex-col gap-3 p-6";
  for (const { id, openable, keepClipboard, ...row } of rows) {
    const trace = document.createElement("kind-stack-trace");
    trace.id = id;
    Object.assign(trace, row);
    if (openable) trace.setAttribute("can-open-frame", "");
    trace.addEventListener("openframe", (event) => {
      const { value, index, reason, source } = event.detail;
      recorded.opened.push([index, value.fn ?? "", `${reason}:${source}`]);
    });
    trace.addEventListener("stackcopy", (event) => {
      recorded.copies.push([event.detail.value, event.detail.reason]);
      if (keepClipboard) event.preventDefault();
    });
    if (row.showLibraryFrames !== undefined) {
      trace.addEventListener("showlibraryframeschange", (event) => event.preventDefault());
    }
    list.append(trace);
  }
  root.append(list);
  const element = (id: string) => root.querySelector(`#${id}`) as HTMLElementTagNameMap["kind-stack-trace"];
  Object.assign(window, {
    kindHost: recorded,
    kindStackTrace: { set: (id: string, next: Partial<Row>) => Object.assign(element(id), next) },
  });
};

const all: Row[] = [
  { id: "stack", stack: typeErrorStack, openable: true },
  { id: "frames", label: "TypeError from frames", frames: typeErrorFrames },
  { id: "assertion", stack: assertionStack, defaultOpen: false },
];

const owned: Row[] = [{ id: "held", stack: typeErrorStack, showLibraryFrames: false, keepClipboard: true }];

export const cases = {
  all: stackTraces(all),
  owned: stackTraces(owned),
};
