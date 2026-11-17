import type { StackTraceOptions } from "@kind-ui/agent-ui/core";
import { defineStackTrace } from "../../../../src/web/stack-trace.js";
import { assertionStack, typeErrorFrames, typeErrorStack } from "../../shared/stack-trace.js";

type Row = StackTraceOptions & { id: string; openable?: boolean; keepClipboard?: boolean; accepts?: boolean };

const stackTraces = (rows: Row[]) => (root: HTMLElement) => {
  defineStackTrace();
  const recorded: {
    copies: [string, string][];
    opened: [number, string, string][];
    shown: [boolean, string][];
  } = { copies: [], opened: [], shown: [] };
  const list = document.createElement("div");
  list.className = "flex w-[36rem] flex-col gap-3 p-6";
  for (const { id, openable, keepClipboard, accepts, ...row } of rows) {
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
    trace.addEventListener("showlibraryframeschange", (event) => {
      recorded.shown.push([event.detail.value, event.detail.reason]);
      if (accepts) trace.showLibraryFrames = event.detail.value;
      else if (row.showLibraryFrames !== undefined) event.preventDefault();
    });
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

const owned: Row[] = [
  { id: "held", stack: typeErrorStack, showLibraryFrames: false, keepClipboard: true },
  { id: "accepted", stack: typeErrorStack, showLibraryFrames: false, accepts: true },
];

const written = (root: HTMLElement) => {
  defineStackTrace();
  const trace = document.createElement("kind-stack-trace");
  trace.id = "written";
  trace.stack = typeErrorStack;
  trace.innerHTML = `<kind-stack-trace-trigger><button><kind-stack-trace-title></kind-stack-trace-title></button></kind-stack-trace-trigger><kind-stack-trace-content><kind-stack-trace-list><kind-stack-trace-frame value="0"></kind-stack-trace-frame><kind-stack-trace-group value="1"><kind-stack-trace-library><button></button></kind-stack-trace-library><kind-stack-trace-library-frames></kind-stack-trace-library-frames></kind-stack-trace-group><kind-stack-trace-frame value="3"><kind-stack-trace-frame-function>Mine</kind-stack-trace-frame-function><kind-stack-trace-frame-location></kind-stack-trace-frame-location></kind-stack-trace-frame></kind-stack-trace-list></kind-stack-trace-content>`;
  root.append(trace);
  Object.assign(window, { kindHost: { copies: [], opened: [], shown: [] } });
};

export const cases = {
  all: stackTraces(all),
  owned: stackTraces(owned),
  written,
};
