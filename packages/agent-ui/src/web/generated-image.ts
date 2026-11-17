import "@ui-sdk/web/progress";
import {
  type GeneratedImageApi,
  type GeneratedImageDownloadDetails,
  type GeneratedImageState,
  generatedImagePrimitive,
} from "@kind-ui/agent-ui/core";
import type { DialogOpenChangeReason } from "@ui-sdk/core/dialog";
import { createParts, type UiActionDetail, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";

const DEFAULT_PARTS = `
  <kind-generated-image-frame>
    <kind-generated-image-preview><img></kind-generated-image-preview>
    <kind-generated-image-image><img></kind-generated-image-image>
    <kind-generated-image-progress></kind-generated-image-progress>
    <kind-generated-image-error></kind-generated-image-error>
    <kind-generated-image-trigger><button></button></kind-generated-image-trigger>
    <kind-generated-image-download><button></button></kind-generated-image-download>
  </kind-generated-image-frame>
  <kind-generated-image-backdrop hidden></kind-generated-image-backdrop>
  <kind-generated-image-content hidden>
    <kind-generated-image-full-image><img></kind-generated-image-full-image>
    <div data-generated-image-actions>
      <kind-generated-image-title><h2></h2></kind-generated-image-title>
      <kind-generated-image-download><button>Download</button></kind-generated-image-download>
      <kind-generated-image-close><button>Close</button></kind-generated-image-close>
    </div>
  </kind-generated-image-content>`;

const PROGRESS_PARTS = `<ui-progress><ui-progress-label></ui-progress-label><ui-progress-value></ui-progress-value><ui-progress-track><ui-progress-indicator></ui-progress-indicator></ui-progress-track></ui-progress>`;

// Parts this element wrote into. A part someone wrote into keeps what they wrote, as React's children do. Kept across
// instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const owns = (part: Element | null): part is Element => {
  if (!part || !(owned.has(part) || !part.firstChild)) return false;
  owned.add(part);
  return true;
};

const text = (node: Node | null | undefined, value: string) => {
  if (node && node.textContent !== value) node.textContent = value;
};

const drawProgress = (part: Element | null, { value, label }: { value: number | null; label: string }) => {
  if (!owns(part)) return;
  if (!part.firstChild) part.innerHTML = PROGRESS_PARTS;
  const progress = part.querySelector("ui-progress") as (Element & { value: number | null }) | null;
  if (progress && progress.value !== value) progress.value = value;
  text(part.querySelector("ui-progress-label"), label);
};

const drawError = (part: Element | null, message: string) => {
  if (owns(part)) text(part, message);
};

/**
 * `<kind-generated-image alt="…" status="generating" width="1024" height="768">` fills in its frame and full size view
 * when it has no children, and an empty `kind-generated-image-progress` or `kind-generated-image-error` with a UI SDK
 * Progress or the error. Set `src` once `status` is `"ready"`. The `can-download` attribute offers Download, which
 * fires `download`.
 */
export function defineGeneratedImage(): void {
  if (customElements.get("kind-generated-image")) return;
  createParts(generatedImagePrimitive, {
    root: {
      tag: "kind-generated-image",
      kinds: { canDownload: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindGeneratedImageElement).canDownload ? {} : { onDownload: undefined }),
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const api = instance.api as GeneratedImageApi;
        const draw = () => {
          const state = instance.get() as GeneratedImageState;
          drawProgress(el.querySelector("kind-generated-image-progress"), api.progressState(state));
          drawError(el.querySelector("kind-generated-image-error"), api.errorMessage(state));
          const title = el.querySelector("kind-generated-image-title > h2");
          if (owns(title)) text(title, state.alt);
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    frame: "kind-generated-image-frame",
    preview: { tag: "kind-generated-image-preview", target: wrappedChild("img"), display: "contents" },
    progress: "kind-generated-image-progress",
    image: { tag: "kind-generated-image-image", target: wrappedChild("img"), display: "contents" },
    error: "kind-generated-image-error",
    trigger: { tag: "kind-generated-image-trigger", target: wrappedButton, display: "contents" },
    download: { tag: "kind-generated-image-download", target: wrappedButton, display: "contents" },
    backdrop: "kind-generated-image-backdrop",
    content: "kind-generated-image-content",
    "full-image": {
      tag: "kind-generated-image-full-image",
      target: wrappedChild("img"),
      display: "contents",
    },
    title: { tag: "kind-generated-image-title", target: wrappedChild("h2"), display: "contents" },
    close: { tag: "kind-generated-image-close", target: wrappedButton, display: "contents" },
  });
}

export type KindGeneratedImageEvents = {
  openchange: UiChangeEvent<boolean, DialogOpenChangeReason>;
  download: CustomEvent<GeneratedImageDownloadDetails & Pick<UiActionDetail, "waitUntil">>;
};

export interface KindGeneratedImageElement
  extends UiElement<KindGeneratedImageEvents>,
    AttributeProperties<typeof generatedImagePrimitive, "api" | "open"> {
  open: boolean;
  canDownload: boolean;
  api: Pick<GeneratedImageApi, "isOpen" | "setOpen">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-generated-image": KindGeneratedImageElement;
    "kind-generated-image-frame": HTMLElement;
    "kind-generated-image-preview": HTMLElement;
    "kind-generated-image-progress": HTMLElement;
    "kind-generated-image-image": HTMLElement;
    "kind-generated-image-error": HTMLElement;
    "kind-generated-image-trigger": HTMLElement;
    "kind-generated-image-download": HTMLElement;
    "kind-generated-image-backdrop": HTMLElement;
    "kind-generated-image-content": HTMLElement;
    "kind-generated-image-full-image": HTMLElement;
    "kind-generated-image-title": HTMLElement;
    "kind-generated-image-close": HTMLElement;
  }
}
