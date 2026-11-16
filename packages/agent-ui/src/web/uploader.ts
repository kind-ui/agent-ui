import "@ui-sdk/web/file-input";
import "@ui-sdk/web/progress";
import {
  type UploaderFilesDetails,
  type UploaderOptions,
  type UploaderState,
  type UploadItem,
  uploadDetail,
  uploaderPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton } from "@ui-sdk/web";
import type {
  AttributeProperties,
  UiDetailedChangeEvent,
  UiElement,
  UiPartElement,
} from "@ui-sdk/web/events";

const parts = `
  <ui-file-input>
    <ui-file-input-dropzone>
      <span data-upload-icon></span>
      <span data-hint>Drop files here, or</span>
      <ui-file-input-trigger><button type="button">browse</button></ui-file-input-trigger>
    </ui-file-input-dropzone>
  </ui-file-input>
  <kind-uploader-list></kind-uploader-list>`;

const row = `
  <span data-icon></span>
  <ui-progress>
    <ui-progress-label></ui-progress-label>
    <ui-progress-track><ui-progress-indicator></ui-progress-indicator></ui-progress-track>
  </ui-progress>
  <span data-detail></span>
  <kind-uploader-action><button></button></kind-uploader-action>`;

type Movable = Element & { moveBefore?: (node: Node, child: Node | null) => void };

// `moveBefore` keeps a focused action button focused where the browser has it; `insertBefore` blurs it.
function move(list: Movable, row: Element, before: Element | null): void {
  if (list.moveBefore && row.isConnected) list.moveBefore(row, before);
  else list.insertBefore(row, before);
}

// Updates a row in place, so its action button keeps focus and its bar moves rather than restarts.
function fill(el: Element, item: UploadItem): void {
  if (!el.firstElementChild) el.innerHTML = row;
  const progress = el.querySelector("ui-progress") as (Element & { value: number | null }) | null;
  const label = el.querySelector("ui-progress-label");
  const detail = el.querySelector("[data-detail]");
  if (progress && progress.value !== item.progress) progress.value = item.progress;
  if (label && label.textContent !== item.name) label.textContent = item.name;
  const text = uploadDetail(item);
  if (detail && detail.textContent !== text) detail.textContent = text;
}

/**
 * `<kind-uploader aria-label="Uploads">` fills in a File Input drop zone and its list when it has no children, and
 * renders a `kind-uploader-item` for each entry of its `items` property. The `can-cancel` and `can-retry` attributes
 * show those buttons, which fire `uploadcancel` and `uploadretry` with the item's id. Accepted files fire `files`
 * and turned-down ones `uploadreject`, each with `event.detail.value`.
 */
export function defineUploader(): void {
  if (customElements.get("kind-uploader")) return;
  createParts(uploaderPrimitive, {
    root: {
      tag: "kind-uploader",
      kinds: { canCancel: "boolean", canRetry: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const { canCancel, canRetry } = el as KindUploaderElement;
        return { ...(!canCancel && { onCancel: undefined }), ...(!canRetry && { onRetry: undefined }) };
      },
      // The File Input inside fires `cancel` (from its native input, bubbling) and `reject`.
      events: { onCancel: "uploadcancel", onRetry: "uploadretry", onReject: "uploadreject" },
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = parts;
        const fileInput = el.querySelector("ui-file-input") as (Element & Record<string, unknown>) | null;
        const list = el.querySelector("kind-uploader-list");
        const drawn = new WeakMap<Element, UploadItem>();
        const draw = () => {
          const { items, accept, maxSize } = instance.get() as UploaderState;
          if (fileInput) {
            if (!fileInput.multiple) fileInput.multiple = true;
            if (fileInput.accept !== accept) fileInput.accept = accept;
            if (fileInput.maxSize !== maxSize) fileInput.maxSize = maxSize;
          }
          if (!list) return;
          const existing = new Map([...list.children].map((child) => [child.getAttribute("value"), child]));
          items.forEach((item, index) => {
            let child = existing.get(item.id);
            existing.delete(item.id);
            if (!child) {
              child = document.createElement("kind-uploader-item");
              child.setAttribute("value", item.id);
            }
            if (drawn.get(child) !== item) {
              fill(child, item);
              drawn.set(child, item);
            }
            if (list.children[index] !== child) move(list, child, list.children[index] ?? null);
          });
          for (const child of existing.values()) child.remove();
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    list: "kind-uploader-list",
    item: "kind-uploader-item",
    action: { tag: "kind-uploader-action", target: wrappedButton, display: "contents" },
  });
}

export type KindUploaderEvents = {
  files: UiDetailedChangeEvent<File[], UploaderFilesDetails>;
  uploadreject: UiDetailedChangeEvent<
    Parameters<NonNullable<UploaderOptions["onReject"]>>[0],
    UploaderFilesDetails
  >;
  uploadcancel: UiDetailedChangeEvent<string, Parameters<NonNullable<UploaderOptions["onCancel"]>>[1]>;
  uploadretry: UiDetailedChangeEvent<string, Parameters<NonNullable<UploaderOptions["onRetry"]>>[1]>;
};

export interface KindUploaderElement
  extends UiElement<KindUploaderEvents>,
    AttributeProperties<typeof uploaderPrimitive, "items"> {
  canCancel: boolean;
  canRetry: boolean;
  items?: UploaderOptions["items"];
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-uploader": KindUploaderElement;
    "kind-uploader-list": HTMLElement;
    "kind-uploader-item": UiPartElement<typeof uploaderPrimitive, "item", "value">;
    "kind-uploader-action": HTMLElement;
  }
}
