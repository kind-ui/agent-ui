import type { DiffFile } from "@kind-ui/agent-ui";
import type { DiffActionDetails } from "@kind-ui/agent-ui/core";
import { defineDiff } from "../../../../src/web/diff.js";
import { bigPatch, createDiffHost, files, frames, run, streamedSession } from "../../shared/diff.js";
import { expose } from "../../shared/expose.js";

const page = (root: HTMLElement, className: string) => {
  const el = document.createElement("div");
  el.className = className;
  root.append(el);
  return el;
};

const diff = (id: string, list: DiffFile[], open?: string[]) => {
  const el = document.createElement("kind-diff");
  el.id = id;
  Object.assign(el, { files: list, ...(open && { defaultOpen: open }) });
  return el;
};

const never = (event: Event) => (event as CustomEvent).detail.waitUntil(new Promise(() => {}));

const live = (root: HTMLElement, initial: DiffFile[], open?: string[]) => {
  defineDiff();
  let current = initial;
  const el = diff("live", initial, open);
  el.canKeep = true;
  el.canUndo = true;
  const host = createDiffHost(
    () => current,
    (next) => {
      current = next;
      el.files = next;
    },
  );
  const listen = (name: "keep" | "undo", call: typeof host.onKeep) =>
    el.addEventListener(name, (event) => {
      const { value, waitUntil, ...details } = event.detail;
      waitUntil(call(value, details as DiffActionDetails) as Promise<void>);
    });
  listen("keep", host.onKeep);
  listen("undo", host.onUndo);
  el.addEventListener("openchange", (event) => host.onOpenChange(event.detail.value, event.detail));
  const before = document.createElement("button");
  before.type = "button";
  before.textContent = "Before";
  const after = document.createElement("button");
  after.type = "button";
  after.textContent = "After";
  page(root, "flex w-[48rem] max-w-full flex-col gap-4 p-6").append(before, el, after);
  expose({ kindDiff: host.handle });
};

export const cases = {
  all: (root: HTMLElement) => {
    defineDiff();
    page(root, "flex w-[48rem] max-w-full flex-col gap-6 p-6").append(
      ...frames.map((frame) => {
        const el = diff(frame.id, frame.files, frame.open);
        el.canKeep = true;
        el.canUndo = true;
        el.addEventListener("keep", never);
        el.addEventListener("undo", never);
        return el;
      }),
    );
  },
  live: (root: HTMLElement) => live(root, run, [files.signIn.path]),
  single: (root: HTMLElement) => live(root, [files.packageJson]),
  stream: (root: HTMLElement) => live(root, [files.signIn, streamedSession(4)], [files.session.path]),
  budget: (root: HTMLElement, params: URLSearchParams) => {
    defineDiff();
    const count = Number(params.get("lines") ?? 10);
    let extra = 0;
    const el = diff("budget", [bigPatch(count)]);
    expose({
      kindDiffStream: () => {
        extra++;
        el.files = [bigPatch(count, extra)];
      },
    });
    page(root, "w-[48rem] p-6").append(el);
  },
};
