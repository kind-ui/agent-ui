import "@ui-sdk/web/progress";
import {
  type JobProgressState,
  jobProgressMeta,
  jobProgressPrimitive,
  type StepApi,
  type StepOpenChangeReason,
} from "@kind-ui/agent-ui/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";

const PENDING_MARK = `<span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span>`;
const START = `<kind-job-progress-trigger><button><kind-job-progress-icon></kind-job-progress-icon><kind-job-progress-title></kind-job-progress-title><kind-job-progress-meta></kind-job-progress-meta></button></kind-job-progress-trigger><kind-job-progress-progress></kind-job-progress-progress>`;
const END = `<kind-job-progress-cancel><button>${PENDING_MARK}Cancel</button></kind-job-progress-cancel><kind-job-progress-retry><button>${PENDING_MARK}Retry</button></kind-job-progress-retry>`;
const PROGRESS = `<ui-progress><ui-progress-label><kind-job-progress-stage></kind-job-progress-stage></ui-progress-label><ui-progress-value></ui-progress-value><ui-progress-track data-agent-hidden=""><ui-progress-indicator></ui-progress-indicator></ui-progress-track></ui-progress>`;

// Parts this element filled in. A part someone wrote into keeps what they wrote, as React's children do. Kept
// across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const claim = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || !part.firstChild)) return false;
  owned.add(part);
  return true;
};

const fill = (part: Element | null, text: string) => {
  if (claim(part) && part.textContent !== text) part.textContent = text;
};

/** Fills an empty progress part with a UI SDK Progress, and keeps the one it wrote current. */
const drawProgress = (part: Element | null, percent: number | null) => {
  if (!part || !(owned.has(part) || !part.firstChild)) return;
  if (!owned.has(part)) {
    owned.add(part);
    part.innerHTML = PROGRESS;
  }
  const bar = part.querySelector("ui-progress") as (Element & { value: number | null }) | null;
  if (bar && bar.value !== percent) bar.value = percent;
};

/**
 * `<kind-job-progress label="…" status="…">` takes the job's log inside a `<kind-job-progress-content>`, and adds
 * its trigger and progress bar before that and its Cancel and Retry buttons after it, unless it has a trigger of its
 * own. An empty `kind-job-progress-progress` gets a UI SDK Progress labelled by the stage. The `can-cancel` and
 * `can-retry` attributes show Cancel and Retry, which fire `jobcancel` and `jobretry`: call
 * `event.detail.waitUntil(promise)` to keep them pending.
 */
export function defineJobProgress(): void {
  if (customElements.get("kind-job-progress")) return;
  createParts(jobProgressPrimitive, {
    root: {
      tag: "kind-job-progress",
      kinds: { canCancel: "boolean", canRetry: "boolean" },
      // Without an attribute its callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const job = el as KindJobProgressElement;
        return {
          ...(job.canCancel ? {} : { onCancel: undefined }),
          ...(job.canRetry ? {} : { onRetry: undefined }),
        };
      },
      // A job's log may hold components with their own `cancel` and `retry` events.
      events: { onCancel: "jobcancel", onRetry: "jobretry" },
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen", "expand", "collapse", "toggle"],
      render: (el, instance) => {
        // Lookups stay out of nested jobs.
        const own = (tag: string) =>
          [...el.querySelectorAll(tag)].find((part) => part.closest("kind-job-progress") === el) ?? null;
        // The parts go around the content, never the other way, so a framework rendering the log keeps every node
        // where it put it.
        if (!own("kind-job-progress-trigger")) {
          let content = el.querySelector(":scope > kind-job-progress-content");
          if (!content) content = el.appendChild(el.ownerDocument.createElement("kind-job-progress-content"));
          content.insertAdjacentHTML("beforebegin", START);
          content.insertAdjacentHTML("afterend", END);
        }
        const draw = () => {
          const state = instance.get() as JobProgressState;
          fill(own("kind-job-progress-title"), state.title);
          fill(own("kind-job-progress-meta"), jobProgressMeta(state.status, state));
          drawProgress(own("kind-job-progress-progress"), state.percent);
          fill(own("kind-job-progress-stage"), state.stage || state.title);
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        const arrivals = new MutationObserver((records) => {
          // The job's log isn't its parts.
          const arrived = records.some(
            (record) =>
              !(record.target instanceof Element && record.target.closest("kind-job-progress-content")) &&
              [...record.addedNodes].some((node) => node instanceof Element),
          );
          if (arrived) draw();
        });
        arrivals.observe(el, { childList: true, subtree: true });
        return () => {
          unsubscribe();
          arrivals.disconnect();
        };
      },
    },
    trigger: { tag: "kind-job-progress-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-job-progress-icon",
    title: "kind-job-progress-title",
    meta: "kind-job-progress-meta",
    progress: "kind-job-progress-progress",
    stage: "kind-job-progress-stage",
    content: "kind-job-progress-content",
    children: "kind-job-progress-children",
    cancel: { tag: "kind-job-progress-cancel", target: wrappedButton, display: "contents" },
    retry: { tag: "kind-job-progress-retry", target: wrappedButton, display: "contents" },
  });
}

export type KindJobProgressEvents = {
  openchange: UiChangeEvent<boolean, StepOpenChangeReason>;
  jobcancel: CustomEvent<Pick<UiActionDetail, "waitUntil">>;
  jobretry: CustomEvent<Pick<UiActionDetail, "waitUntil">>;
};

export interface KindJobProgressElement
  extends UiElement<KindJobProgressEvents>,
    AttributeProperties<typeof jobProgressPrimitive, "api" | "open"> {
  open: boolean;
  canCancel: boolean;
  canRetry: boolean;
  api: Pick<StepApi, "isOpen" | "setOpen" | "expand" | "collapse" | "toggle">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-job-progress": KindJobProgressElement;
    "kind-job-progress-trigger": HTMLElement;
    "kind-job-progress-icon": HTMLElement;
    "kind-job-progress-title": HTMLElement;
    "kind-job-progress-meta": HTMLElement;
    "kind-job-progress-progress": HTMLElement;
    "kind-job-progress-stage": HTMLElement;
    "kind-job-progress-content": HTMLElement;
    "kind-job-progress-children": HTMLElement;
    "kind-job-progress-cancel": HTMLElement;
    "kind-job-progress-retry": HTMLElement;
  }
}
