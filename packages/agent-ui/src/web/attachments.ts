import {
  type AttachmentItem,
  type AttachmentsApi,
  attachmentDetail,
  attachmentsPrimitive,
} from "@kind-ui/agent-ui/core";
import { createParts } from "@ui-sdk/web";

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
 * property. Set `onRemove` as a property: whether it's set decides whether items can be removed.
 */
export function defineAttachments(): void {
  if (customElements.get("kind-attachments")) return;
  createParts(attachmentsPrimitive, {
    root: {
      tag: "kind-attachments",
      kinds: { onRemove: "value" },
      silent: ["onRemove"],
      render: (el, instance) => {
        const api = instance.api as AttachmentsApi;
        const drawn = new WeakMap<Element, { item: AttachmentItem; preview: string | undefined }>();
        const draw = () => {
          const { items } = instance.get();
          const existing = new Map([...el.children].map((child) => [child.getAttribute("value"), child]));
          items.forEach((item, index) => {
            let child = existing.get(item.id);
            existing.delete(item.id);
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
          for (const child of existing.values()) child.remove();
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    item: "kind-attachments-item",
    remove: "kind-attachments-remove",
  });
}
