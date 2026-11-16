import type { PlanOptions } from "@kind-ui/agent-ui/core";
import { definePlan } from "../../../../src/web/plan.js";

type Item = NonNullable<PlanOptions["items"]>[number];

const initial: Item[] = [
  { id: "audit", status: "complete", title: "Audit the current schema" },
  {
    id: "migrate",
    status: "running",
    title: "Add the new columns",
    description: "Nullable first, so the deploy needs no downtime.",
  },
  { id: "backfill", status: "pending", title: "Backfill existing rows" },
  { id: "cleanup", status: "skipped", title: "Drop the old columns" },
  { id: "verify", status: "pending", title: "Verify the counts" },
];

const plans = (motion?: PlanOptions["motion"]) => (root: HTMLElement) => {
  definePlan();
  const page = document.createElement("div");
  page.className = "flex w-[28rem] flex-col gap-4 p-6";
  const plan = document.createElement("kind-plan");
  plan.id = "plan";
  plan.canAccept = true;
  Object.assign(plan, { label: "Migration plan", status: "awaiting-input", items: initial });
  if (motion) plan.motion = motion;
  // Each accept waits until the test settles it.
  const accepts: { resolve(): void; reject(): void }[] = [];
  plan.addEventListener("accept", (event) =>
    event.detail.waitUntil(new Promise<void>((resolve, reject) => accepts.push({ resolve, reject }))),
  );
  const quick = document.createElement("kind-plan");
  quick.id = "quick";
  quick.canAccept = true;
  Object.assign(quick, { label: "Quick plan", items: initial.slice(0, 2), agentConfirm: false });
  const readonly = document.createElement("kind-plan");
  readonly.id = "readonly";
  Object.assign(readonly, { label: "Read-only plan", items: initial.slice(0, 1) });
  page.append(plan, quick, readonly);
  root.append(page);
  const items = () => plan.items ?? [];
  Object.assign(window, {
    kindAccepts: accepts,
    kindStopAccepting: () => {
      plan.canAccept = false;
    },
    kindItems: {
      setStatus: (id: string, status: Item["status"]) => {
        plan.items = items().map((item) => (item.id === id ? { ...item, status } : item));
      },
      append: (item: Item) => {
        plan.items = [...items(), item];
      },
      remove: (id: string) => {
        plan.items = items().filter((item) => item.id !== id);
      },
    },
  });
};

export const cases = { all: plans(), reduced: plans("reduced") };
