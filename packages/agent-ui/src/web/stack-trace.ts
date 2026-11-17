import {
  type StackTraceApi,
  type StackTraceCopyReason,
  type StackTraceLibraryChangeReason,
  type StackTraceOpenFrameReason,
  type StackTraceState,
  type StepOpenChangeReason,
  stackTracePrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement, UiPartElement } from "@ui-sdk/web/events";

type StackFrame = StackTraceState["frames"][number];

const DEFAULT_PARTS = `<kind-stack-trace-trigger><button><kind-stack-trace-icon></kind-stack-trace-icon><kind-stack-trace-title></kind-stack-trace-title></button></kind-stack-trace-trigger><kind-stack-trace-content><div data-stack-trace-panel><kind-stack-trace-message></kind-stack-trace-message><kind-stack-trace-list></kind-stack-trace-list><kind-stack-trace-copy><button></button></kind-stack-trace-copy></div></kind-stack-trace-content>`;

// Parts this element wrote into. A part someone wrote into keeps what they wrote, as React's children do. Kept
// across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const ownedOrEmpty = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || !part.firstChild)) return false;
  owned.add(part);
  return true;
};

const fill = (part: Element | null, text: string) => {
  if (ownedOrEmpty(part) && part.textContent !== text) part.textContent = text;
};

const fillTitle = (part: Element | null, { name, summary }: StackTraceState) => {
  if (!ownedOrEmpty(part) || part.textContent === (name ? `${name}: ${summary}` : summary)) return;
  if (!name) {
    part.textContent = summary;
    return;
  }
  const label = part.ownerDocument.createElement("span");
  label.setAttribute("data-stack-trace-name", "");
  label.textContent = name;
  part.replaceChildren(label, `: ${summary}`);
};

const element = (doc: Document, tag: string, value?: number) => {
  const el = doc.createElement(tag);
  if (value !== undefined) el.setAttribute("value", String(value));
  return el;
};

const frameElement = (doc: Document, index: number, state: StackTraceState) => {
  const entry = state.entries[index];
  const fn = element(doc, "kind-stack-trace-frame-function");
  fn.textContent = entry?.fn ?? "";
  const location = element(doc, "kind-stack-trace-frame-location");
  location.textContent = entry?.location ?? "";
  const frame = element(doc, "kind-stack-trace-frame", index);
  if (!state.canOpen) {
    frame.append(fn, location);
    return frame;
  }
  const button = doc.createElement("button");
  button.append(fn, location);
  const open = element(doc, "kind-stack-trace-frame-open");
  open.append(button);
  frame.append(open);
  return frame;
};

// What each list was last drawn from, so a redraw rebuilds it only when its frames or their buttons change.
const drawn = new WeakMap<Element, { rows: StackTraceState["rows"]; canOpen: boolean }>();

const drawList = (list: Element, state: StackTraceState) => {
  const last = drawn.get(list);
  if (last?.rows === state.rows && last.canOpen === state.canOpen) return;
  if (!last && !ownedOrEmpty(list)) return;
  drawn.set(list, { rows: state.rows, canOpen: state.canOpen });
  const doc = list.ownerDocument;
  list.replaceChildren(
    ...state.rows.map((row) => {
      if (row.type === "frame") return frameElement(doc, row.index, state);
      const library = element(doc, "kind-stack-trace-library");
      const toggle = doc.createElement("button");
      const count = row.indexes.length;
      toggle.textContent = `${count} library ${count === 1 ? "frame" : "frames"}`;
      library.append(toggle);
      const frames = element(doc, "kind-stack-trace-library-frames");
      frames.append(...row.indexes.map((index) => frameElement(doc, index, state)));
      const group = element(doc, "kind-stack-trace-group", row.start);
      group.append(library, frames);
      return group;
    }),
  );
};

/**
 * `<kind-stack-trace>` fills in its parts when it has no children. Set `stack` as text, or `frames` as a property;
 * its list gets a frame for each app frame and a folded group for each run of library frames. The `can-open-frame`
 * attribute makes each frame a button that fires `openframe`, with the frame as `detail.value` and its index as
 * `detail.index`. Copy fires `stackcopy` first.
 */
export function defineStackTrace(): void {
  if (customElements.get("kind-stack-trace")) return;
  createParts(stackTracePrimitive, {
    root: {
      tag: "kind-stack-trace",
      kinds: { canOpenFrame: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindStackTraceElement).canOpenFrame ? {} : { onOpenFrame: undefined }),
      // Without it, `defaultOpen = false` reads as a missing attribute, which opens the trace.
      defaults: { defaultOpen: true },
      // A native `copy` event bubbles from the selection.
      events: { onCopy: "stackcopy" },
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen", "expand", "collapse", "toggle", "copy", "getFrames"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const draw = () => {
          const state = instance.get() as StackTraceState;
          fillTitle(el.querySelector("kind-stack-trace-title"), state);
          fill(el.querySelector("kind-stack-trace-message"), state.details);
          const list = el.querySelector("kind-stack-trace-list");
          if (list) drawList(list, state);
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    trigger: { tag: "kind-stack-trace-trigger", target: wrappedButton, display: "contents" },
    icon: "kind-stack-trace-icon",
    title: "kind-stack-trace-title",
    content: "kind-stack-trace-content",
    message: "kind-stack-trace-message",
    copy: { tag: "kind-stack-trace-copy", target: wrappedButton, display: "contents" },
    list: "kind-stack-trace-list",
    frame: "kind-stack-trace-frame",
    "frame-open": { tag: "kind-stack-trace-frame-open", target: wrappedButton, display: "contents" },
    "frame-function": "kind-stack-trace-frame-function",
    "frame-location": "kind-stack-trace-frame-location",
    group: "kind-stack-trace-group",
    library: { tag: "kind-stack-trace-library", target: wrappedButton, display: "contents" },
    "library-frames": "kind-stack-trace-library-frames",
  });
}

export type KindStackTraceEvents = {
  openchange: UiChangeEvent<boolean, StepOpenChangeReason>;
  showlibraryframeschange: UiChangeEvent<boolean, StackTraceLibraryChangeReason>;
  openframe: UiChangeEvent<StackFrame, StackTraceOpenFrameReason> & { detail: { index: number } };
  stackcopy: UiChangeEvent<string, StackTraceCopyReason>;
};

export interface KindStackTraceElement
  extends UiElement<KindStackTraceEvents>,
    AttributeProperties<typeof stackTracePrimitive, "api" | "open" | "frames"> {
  open: boolean;
  frames?: StackFrame[];
  /** Makes each frame a button that fires `openframe`. Reflects `can-open-frame`. */
  canOpenFrame: boolean;
  api: Pick<StackTraceApi, "isOpen" | "setOpen" | "expand" | "collapse" | "toggle" | "copy" | "getFrames">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-stack-trace": KindStackTraceElement;
    "kind-stack-trace-trigger": HTMLElement;
    "kind-stack-trace-icon": HTMLElement;
    "kind-stack-trace-title": HTMLElement;
    "kind-stack-trace-content": HTMLElement;
    "kind-stack-trace-message": HTMLElement;
    "kind-stack-trace-copy": HTMLElement;
    "kind-stack-trace-list": HTMLElement;
    "kind-stack-trace-frame": UiPartElement<typeof stackTracePrimitive, "frame", "value">;
    "kind-stack-trace-frame-open": HTMLElement;
    "kind-stack-trace-frame-function": HTMLElement;
    "kind-stack-trace-frame-location": HTMLElement;
    "kind-stack-trace-group": UiPartElement<typeof stackTracePrimitive, "group", "value">;
    "kind-stack-trace-library": HTMLElement;
    "kind-stack-trace-library-frames": HTMLElement;
  }
}
