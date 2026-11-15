import { stepListPrimitive, stepPrimitive } from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";

let stepDefined = false;
let listDefined = false;

export function defineStep(): void {
  if (stepDefined) return;
  stepDefined = true;
  createParts(stepPrimitive, {
    root: "kind-step",
    trigger: { tag: "kind-step-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-step-icon",
    title: "kind-step-title",
    meta: "kind-step-meta",
    content: "kind-step-content",
    children: "kind-step-children",
  });
}

/** Wrap each `<kind-step-trigger>` in a `<kind-step-list-item value="…">` to join the list's single Tab stop. */
export function defineStepList(): void {
  if (listDefined) return;
  listDefined = true;
  createParts(stepListPrimitive, {
    root: "kind-step-list",
    item: { tag: "kind-step-list-item", target: (el) => el.querySelector("button"), display: "contents" },
  });
}
