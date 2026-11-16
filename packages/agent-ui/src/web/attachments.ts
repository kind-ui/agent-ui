import {
  type AttachmentItem,
  type AttachmentsApi,
  type AttachmentsOptions,
  attachmentDetail,
  attachmentsPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";
import type {
  AttributeProperties,
  UiDetailedChangeEvent,
  UiElement,
  UiPartElement,
} from "@ui-sdk/web/events";

function text(attribute: string, content: string): HTMLSpanElement {
  const span = document.createElement("span");
  span.setAttribute(attribute, "");
  span.textContent = content;
  return span;
}

// Fills an item's content, keeping its remove part bound.
function fill(el: Element, item: AttachmentItem, preview: string | undefined): void {
  const visual = preview === undefined ? text("data-icon", "") : document.createElement("img");
  if (visual instanceof HTMLImageElement) {
    visual.setAttribute("data-preview", "");
    visual.alt = "";
    visual.src = preview as string;
  }
  const remove =
    el.querySelector("kind-attachments-remove") ?? document.createElement("kind-attachments-remove");
  el.replaceChildren(
    visual,
    text("data-name", item.name),
    text("data-detail", attachmentDetail(item)),
    remove,
  );
}

/**
 * `<kind-attachments aria-label="Files">` renders a `kind-attachments-item` for each entry of its `items`
 * property, and keeps a removed one while it fades out. The `can-remove` attribute lets items be removed, each firing
 * `remove` with the item's id. Set the `focusFallback` property to name where focus goes when the last chip leaves.
 */
export function defineAttachments(): void {
  if (customElements.get("kind-attachments")) return;
  createParts(attachmentsPrimitive, {
    root: {
      tag: "kind-attachments",
      kinds: { canRemove: "boolean" },
      // The composer's own handler, which offers removal without the attribute.
      properties: ["removeHandler"],
      // Without either, the callback is left out; with only the attribute, `@ui-sdk/web` fills it in with an event.
      options: (el) => {
        const { canRemove, removeHandler } = el as KindAttachmentsElement;
        if (removeHandler) return { onRemove: removeHandler };
        return canRemove ? {} : { onRemove: undefined };
      },
      render: (el, instance) => {
        const api = instance.api as AttachmentsApi;
        const drawn = new WeakMap<Element, { item: AttachmentItem; preview: string | undefined }>();
        const draw = () => {
          const { rows } = instance.get();
          const ids = new Set(rows.map(({ item }) => item.id));
          // Dropped rows leave first, so placing the rest never moves (and blurs) a focused one.
          for (const child of [...el.children])
            if (!ids.has(child.getAttribute("value") ?? "")) child.remove();
          const existing = new Map([...el.children].map((child) => [child.getAttribute("value"), child]));
          rows.forEach(({ item }, index) => {
            let child = existing.get(item.id);
            if (!child) {
              child = document.createElement("kind-attachments-item");
              child.setAttribute("value", item.id);
            }
            const preview = api.previewOf(item);
            const last = drawn.get(child);
            if (last?.item !== item || last.preview !== preview) {
              fill(child, item, preview);
              drawn.set(child, { item, preview });
            }
            if (el.children[index] !== child) el.insertBefore(child, el.children[index] ?? null);
          });
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    item: "kind-attachments-item",
    remove: "kind-attachments-remove",
  });
}

export type KindAttachmentsEvents = {
  remove: UiDetailedChangeEvent<string, Parameters<NonNullable<AttachmentsOptions["onRemove"]>>[1]>;
};

export interface KindAttachmentsElement
  extends UiElement<KindAttachmentsEvents>,
    AttributeProperties<typeof attachmentsPrimitive, "items"> {
  canRemove: boolean;
  items?: AttachmentsOptions["items"];
  removeHandler?: AttachmentsOptions["onRemove"];
  focusFallback?: AttachmentsOptions["focusFallback"];
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-attachments": KindAttachmentsElement;
    "kind-attachments-item": UiPartElement<typeof attachmentsPrimitive, "item", "value">;
    "kind-attachments-remove": HTMLElement;
  }
}
