import { defineStep, defineStepList } from "../../../../src/web/step.js";

const rows = [
  {
    id: "plan",
    title: "Plan the answer",
    status: "complete",
    meta: "2s",
    body: "Split the question into three lookups.",
  },
  {
    id: "search",
    title: "Search the web",
    status: "running",
    meta: "3s",
    duration: 3,
    body: "Querying three sources for recent releases.",
  },
  { id: "approve", title: "Run deploy script", status: "awaiting-input", body: "Waiting for approval." },
  { id: "fetch", title: "Fetch changelog", status: "error", meta: "1s", body: "Request failed with 503." },
  { id: "draft", title: "Draft the summary", status: "pending", body: "Collapsed text: kumquat." },
  { id: "old", title: "Old attempt", status: "cancelled", body: "Stopped by the user." },
];

const step = (row: (typeof rows)[number]) => `
  <kind-step id="step-${row.id}" status="${row.status}" kind="tool"${row.duration ? ` duration-seconds="${row.duration}"` : ""}>
    <kind-step-list-item value="${row.id}">
      <kind-step-trigger><button>
        <kind-step-icon></kind-step-icon>
        <kind-step-title>${row.title}</kind-step-title>
        ${row.meta ? `<kind-step-meta>${row.meta}</kind-step-meta>` : ""}
      </button></kind-step-trigger>
    </kind-step-list-item>
    <kind-step-content><p>${row.body}</p></kind-step-content>
    <kind-step-children></kind-step-children>
  </kind-step>`;

const single = (root: HTMLElement, motion: string, title: string) => {
  defineStep();
  root.innerHTML = `
    <kind-step motion="${motion}">
      <kind-step-trigger><button><kind-step-icon></kind-step-icon><kind-step-title>${title}</kind-step-title></button></kind-step-trigger>
      <kind-step-content><p>Fades only.</p></kind-step-content>
    </kind-step>`;
  Object.assign(window, {
    kindStep: {
      setStatus: (status: string) => root.querySelector("kind-step")?.setAttribute("status", status),
    },
  });
};

export const cases = {
  list: (root: HTMLElement) => {
    defineStep();
    defineStepList();
    root.innerHTML = `<kind-step-list aria-label="Agent steps" class="w-96 p-4">${rows.map(step).join("")}</kind-step-list>`;
    Object.assign(window, {
      kindSteps: {
        setStatus: (id: string, status: string) =>
          root.querySelector(`#step-${id}`)?.setAttribute("status", status),
        remove: (id: string) => root.querySelector(`#step-${id}`)?.remove(),
      },
    });
  },
  reduced: (root: HTMLElement) => single(root, "reduced", "Reduced"),
  none: (root: HTMLElement) => single(root, "none", "Instant"),
};
