import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineFileTree } from "../../../../src/web/file-tree.js";
import { entries, type FileTreeLog, nextEntries } from "../../shared/file-tree.js";

const page =
  ({
    motion,
    selectable = true,
    refuse,
  }: {
    motion?: MotionMode;
    selectable?: boolean;
    refuse?: boolean;
  } = {}) =>
  (root: HTMLElement) => {
    defineFileTree();
    const log: FileTreeLog = { selected: [], values: [], expanded: [] };
    const container = document.createElement("div");
    container.className = "w-[22rem] p-6";
    const element = document.createElement("kind-file-tree");
    element.id = "file-tree";
    if (motion) element.motion = motion;
    element.canSelect = selectable;
    element.defaultExpanded = ["src"];
    element.addEventListener("pathchange", (event) => {
      log.values.push(`${event.detail.value} ${event.detail.reason}`);
      if (refuse) event.preventDefault();
    });
    element.addEventListener("expandchange", (event) => {
      log.expanded.push(event.detail.value);
      if (refuse) event.preventDefault();
    });
    element.addEventListener("fileselect", (event) =>
      log.selected.push(`${event.detail.value} ${event.detail.reason} ${event.detail.source}`),
    );
    container.append(element);
    root.append(container);
    element.entries = entries;
    Object.assign(window, {
      kindLog: log,
      kindHost: {
        add: () => {
          element.entries = nextEntries.add(element.entries ?? []);
        },
        remove: () => {
          element.entries = nextEntries.remove(element.entries ?? []);
        },
      },
    });
  };

export const cases = {
  all: page(),
  reduced: page({ motion: "reduced" }),
  static: page({ selectable: false }),
  refused: page({ refuse: true }),
  moved: page(),
};
