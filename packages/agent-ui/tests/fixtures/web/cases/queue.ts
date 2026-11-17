import type { QueueItem } from "@kind-ui/agent-ui";
import type { QueueOptions } from "@kind-ui/agent-ui/core";
import { defineQueue } from "../../../../src/web/queue.js";

const initial: QueueItem[] = [
  { id: "a", status: "pending", title: "Write the migration" },
  { id: "b", status: "pending", title: "Update the docs", description: "README and the API page" },
  { id: "c", status: "pending", title: "Run the tests" },
  { id: "d", status: "complete", title: "Read the schema" },
];

type Call = { type: "reorder" | "remove"; id: string; index?: number; reason: string; source: string };

const queues =
  ({
    editable = true,
    removeLater = false,
    motion,
  }: {
    editable?: boolean;
    removeLater?: boolean;
    motion?: QueueOptions["motion"];
  } = {}) =>
  (root: HTMLElement) => {
    defineQueue();
    const page = document.createElement("div");
    page.className = "flex w-[24rem] flex-col gap-4 p-6";
    const queue = document.createElement("kind-queue");
    queue.id = "queue";
    queue.setAttribute("label", "Queue");
    if (motion) queue.motion = motion;
    queue.canReorder = editable;
    queue.canRemove = editable;
    queue.items = initial;
    page.append(queue);
    root.append(page);
    const calls: Call[] = [];
    const items = () => queue.items ?? [];
    queue.addEventListener("reorder", (event) => {
      const { value: id, index, reason, source } = event.detail;
      calls.push({ type: "reorder", id, index, reason, source });
      const rest = items().filter((item) => item.id !== id);
      rest.splice(index, 0, items().find((item) => item.id === id) as QueueItem);
      queue.items = rest;
    });
    queue.addEventListener("remove", (event) => {
      const { value: id, reason, source } = event.detail;
      calls.push({ type: "remove", id, reason, source });
      if (!removeLater) queue.items = items().filter((item) => item.id !== id);
    });
    Object.assign(window, {
      kindCalls: calls,
      kindQueue: {
        remove: (id: string) => {
          queue.items = items().filter((item) => item.id !== id);
        },
        add: (item: QueueItem) => {
          queue.items = [...items(), item];
        },
        complete: (id: string) => {
          queue.items = items().map((item) =>
            item.id === id ? { ...item, status: "complete" as const } : item,
          );
        },
      },
    });
  };

export const cases = {
  all: queues(),
  readonly: queues({ editable: false }),
  "remove-later": queues({ removeLater: true }),
  reduced: queues({ motion: "reduced" }),
  none: queues({ motion: "none" }),
};
