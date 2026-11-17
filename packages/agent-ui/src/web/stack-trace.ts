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

const libraryText = (count: number) => `${count} library ${count === 1 ? "frame" : "frames"}`;

/** Gives an empty frame its function and location, in a button while frames open, and fills them in. */
const fillFrame = (frame: Element, state: StackTraceState) => {
  const doc = frame.ownerDocument;
  const entry = state.entries[Number(frame.getAttribute("value"))];
  if (!frame.firstChild) {
    const text = [
      element(doc, "kind-stack-trace-frame-function"),
      element(doc, "kind-stack-trace-frame-location"),
    ];
    if (state.canOpen) {
      const button = doc.createElement("button");
      button.append(...text);
      const open = element(doc, "kind-stack-trace-frame-open");
      open.append(button);
      frame.append(open);
    } else {
      frame.append(...text);
    }
  }
  fill(frame.querySelector("kind-stack-trace-frame-function"), entry?.fn ?? "");
  fill(frame.querySelector("kind-stack-trace-frame-location"), entry?.location ?? "");
};

/** Gives an empty group its toggle and frames, and names the toggle. */
const fillGroup = (group: Element, state: StackTraceState) => {
  const doc = group.ownerDocument;
  const start = Number(group.getAttribute("value"));
  const row = state.rows.find((each) => each.type === "library" && each.start === start);
  const indexes = row?.type === "library" ? row.indexes : [];
  if (!group.firstChild) {
    group.append(element(doc, "kind-stack-trace-library"), element(doc, "kind-stack-trace-library-frames"));
  }
  const library = group.querySelector("kind-stack-trace-library");
  if (library && !library.firstChild) library.append(doc.createElement("button"));
  fill(library?.querySelector("button") ?? null, libraryText(indexes.length));
  const frames = group.querySelector("kind-stack-trace-library-frames");
  if (frames && !frames.firstChild) {
    frames.append(...indexes.map((index) => element(doc, "kind-stack-trace-frame", index)));
  }
};

// The rows each list was last drawn from, as text, so a new `label` or equal `frames` rebuild nothing.
const drawn = new WeakMap<Element, string>();

/**
 * Draws a frame for each app frame and a group for each run of library frames into a list this element owns, and
 * fills in the empty parts of frames and groups someone wrote.
 */
const drawList = (list: Element, state: StackTraceState) => {
  if (ownedOrEmpty(list)) {
    const shape = JSON.stringify([state.rows, state.entries, state.canOpen]);
    if (drawn.get(list) !== shape) {
      drawn.set(list, shape);
      const doc = list.ownerDocument;
      list.replaceChildren(
        ...state.rows.map((row) =>
          row.type === "frame"
            ? element(doc, "kind-stack-trace-frame", row.index)
            : element(doc, "kind-stack-trace-group", row.start),
        ),
      );
    }
  }
  for (const group of list.querySelectorAll("kind-stack-trace-group")) fillGroup(group, state);
  for (const frame of list.querySelectorAll("kind-stack-trace-frame")) fillFrame(frame, state);
};

/**
 * `<kind-stack-trace>` fills in its parts when it has no children. Set `stack` as text, or `frames` as a property;
 * its list gets a frame for each app frame and a folded group for each run of library frames. Write
 * `<kind-stack-trace-frame value="…">` and `<kind-stack-trace-group value="…">` in the list to arrange them yourself;
 * their empty parts are filled in. The `can-open-frame`
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
        showLibraryFrames: {
          get: (api) => api.getShowLibraryFrames(),
          set: (api, show) => api.setShowLibraryFrames(!!show),
        },
      },
      // `copy` is a getter, offered only with something to copy, which a copied list of methods would freeze.
      api: [
        "isOpen",
        "setOpen",
        "expand",
        "collapse",
        "toggle",
        "getFrames",
        "getShowLibraryFrames",
        "setShowLibraryFrames",
      ],
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
    AttributeProperties<typeof stackTracePrimitive, "api" | "open" | "showLibraryFrames" | "frames"> {
  open: boolean;
  showLibraryFrames: boolean;
  frames?: StackFrame[];
  /** Makes each frame a button that fires `openframe`. Reflects `can-open-frame`. */
  canOpenFrame: boolean;
  api: Pick<
    StackTraceApi,
    | "isOpen"
    | "setOpen"
    | "expand"
    | "collapse"
    | "toggle"
    | "getFrames"
    | "getShowLibraryFrames"
    | "setShowLibraryFrames"
  >;
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
