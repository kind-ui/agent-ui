import {
  type DocumentApi,
  type DocumentOpenChangeReason,
  type DocumentOptions,
  type DocumentState,
  documentPrimitive,
} from "@kind-ui/agent-ui/core";
import type { ActionDetails } from "@ui-sdk/core";
import { createParts, type UiActionDetail, wrappedButton } from "@ui-sdk/web";
import type {
  AttributeProperties,
  UiChangeEvent,
  UiDetailedChangeEvent,
  UiElement,
  UiPartElement,
} from "@ui-sdk/web/events";
import { defineCodeBlock, type KindCodeBlockElement } from "./code-block.js";
import { defineInternalScrollArea } from "./internal/scroll-area.js";
import { defineInternalToolbar } from "./internal/toolbar.js";
import { defineMarkdown, type KindMarkdownElement } from "./markdown.js";

const DEFAULT_PARTS = `
  <kind-document-header>
    <kind-document-title></kind-document-title>
    <kind-document-meta></kind-document-meta>
    <kind-document-toolbar>
      <kind-internal-toolbar><ui-toolbar aria-label="Document actions">
        <kind-document-copy><ui-toolbar-button><button aria-label="Copy"></button></ui-toolbar-button></kind-document-copy>
      </ui-toolbar></kind-internal-toolbar>
    </kind-document-toolbar>
  </kind-document-header>
  <kind-document-body>
    <kind-internal-scroll-area>
      <ui-scroll-area>
        <ui-scroll-area-viewport>
          <ui-scroll-area-content><kind-document-content></kind-document-content></ui-scroll-area-content>
        </ui-scroll-area-viewport>
        <ui-scroll-area-scrollbar><ui-scroll-area-thumb></ui-scroll-area-thumb></ui-scroll-area-scrollbar>
      </ui-scroll-area>
    </kind-internal-scroll-area>
    <kind-document-expand><button></button></kind-document-expand>
  </kind-document-body>`;

const CONTENT_PARTS = `<kind-markdown></kind-markdown><kind-code-block headerless></kind-code-block><pre></pre>`;

// Parts this element wrote into, and downloads it added. A part someone wrote into keeps what they wrote, as React's
// children do. Kept across instances, because UI SDK rebuilds one when the element returns to the page.
const owned = new WeakSet<Element>();

const fill = (part: Element | null, text: string) => {
  if (!part || !(owned.has(part) || !part.textContent)) return;
  owned.add(part);
  if (part.textContent !== text) part.textContent = text;
};

const write = <Target extends object, Key extends keyof Target>(
  target: Target,
  key: Key,
  value: Target[Key],
) => {
  if (target[key] !== value) target[key] = value;
};

const downloadElement = (toolbar: Element, value: string | undefined, label: string | undefined) => {
  const part = toolbar.ownerDocument.createElement("kind-document-download");
  if (value !== undefined) part.setAttribute("value", value);
  part.innerHTML = `<ui-toolbar-button><button></button></ui-toolbar-button>`;
  const button = part.querySelector("button") as HTMLButtonElement;
  button.ariaLabel = label ? `Download ${label}` : "Download";
  button.textContent = label ?? "";
  owned.add(part);
  return part;
};

/** Keeps one Download the element added for each of the `downloads`, or one for none or one, after Copy. */
const drawDownloads = (toolbar: Element, { downloads, canDownload }: DocumentState) => {
  const added = [...toolbar.children].filter((child) => owned.has(child));
  const wanted = !canDownload
    ? []
    : downloads.length > 1
      ? downloads
      : [{ id: downloads[0]?.id, label: undefined }];
  const same =
    added.length === wanted.length &&
    added.every(
      (part, index) =>
        part.getAttribute("value") === (wanted[index]?.id ?? null) &&
        part.textContent === (wanted[index]?.label ?? ""),
    );
  if (same) return;
  for (const part of added) part.remove();
  toolbar.append(...wanted.map(({ id, label }) => downloadElement(toolbar, id, label)));
};

const drawContent = (content: Element | null, state: DocumentState) => {
  if (!content) return;
  if (!content.firstElementChild) content.innerHTML = CONTENT_PARTS;
  const markdown = content.querySelector<KindMarkdownElement>(":scope > kind-markdown");
  if (markdown) {
    write(markdown, "hidden", state.format !== "markdown");
    if (state.format === "markdown") {
      write(markdown, "source", state.content);
      write(markdown, "streaming", state.streaming);
      write(markdown, "highlight", state.highlight);
    }
  }
  const code = content.querySelector<KindCodeBlockElement>(":scope > kind-code-block");
  if (code) {
    write(code, "hidden", state.format !== "code");
    if (state.format === "code") {
      write(code, "code", state.content);
      write(code, "language", state.language);
      write(code, "streaming", state.streaming);
      write(code, "highlight", state.highlight);
    }
  }
  const text = content.querySelector<HTMLPreElement>(":scope > pre");
  if (text) {
    write(text, "hidden", state.format !== "text");
    if (state.format === "text" && text.textContent !== state.content) text.textContent = state.content;
  }
};

/**
 * `<kind-document label="README.md">` fills in its header and body when it has no children. Set `content`, and
 * `downloads` as a property; the `can-download` attribute offers Download, which fires `download` with the chosen
 * format's `id`. Copy fires `documentcopy` first.
 */
export function defineDocument(): void {
  if (customElements.get("kind-document")) return;
  defineCodeBlock();
  defineMarkdown();
  defineInternalScrollArea();
  defineInternalToolbar();
  createParts(documentPrimitive, {
    root: {
      tag: "kind-document",
      kinds: { canDownload: "boolean" },
      // Without the attribute the callback is left out; with it, `@ui-sdk/web` fills it in with an event.
      options: (el) => ((el as KindDocumentElement).canDownload ? {} : { onDownload: undefined }),
      events: { onCopy: "documentcopy" },
      state: {
        open: {
          get: (api) => api.isOpen(),
          set: (api, open) => api.setOpen(!!open),
        },
      },
      api: ["isOpen", "setOpen", "toggle", "copy"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = DEFAULT_PARTS;
        const draw = () => {
          const state = instance.get() as DocumentState;
          fill(el.querySelector("kind-document-title"), state.label);
          fill(el.querySelector("kind-document-meta"), state.meta);
          const toolbar = el.querySelector("kind-document-toolbar ui-toolbar");
          if (toolbar) drawDownloads(toolbar, state);
          el.querySelector("kind-document-body ui-scroll-area")?.toggleAttribute(
            "stick-to-end",
            state.streaming,
          );
          drawContent(el.querySelector("kind-document-content"), state);
          fill(el.querySelector("kind-document-expand > button"), state.open ? "Show less" : "Show more");
        };
        draw();
        const unsubscribe = instance.subscribe(draw);
        const arrivals = new MutationObserver((records) => {
          // The blocks and lines the Markdown view and Code Block render aren't parts.
          const arrived = records.some(
            (record) =>
              !(
                record.target instanceof Element && record.target.closest("kind-code-block, kind-markdown")
              ) && [...record.addedNodes].some((node) => node instanceof Element),
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
    header: "kind-document-header",
    title: "kind-document-title",
    meta: "kind-document-meta",
    toolbar: "kind-document-toolbar",
    copy: { tag: "kind-document-copy", display: "contents" },
    download: { tag: "kind-document-download", display: "contents" },
    body: "kind-document-body",
    content: "kind-document-content",
    expand: { tag: "kind-document-expand", target: wrappedButton, display: "contents" },
  });
}

export type KindDocumentEvents = {
  openchange: UiChangeEvent<boolean, DocumentOpenChangeReason>;
  documentcopy: UiDetailedChangeEvent<string, Parameters<NonNullable<DocumentOptions["onCopy"]>>[1]>;
  download: CustomEvent<{ value: string | undefined } & ActionDetails & Pick<UiActionDetail, "waitUntil">>;
};

export interface KindDocumentElement
  extends UiElement<KindDocumentEvents>,
    AttributeProperties<typeof documentPrimitive, "api" | "open" | "downloads" | "highlight"> {
  open: boolean;
  canDownload: boolean;
  downloads?: DocumentOptions["downloads"];
  highlight?: DocumentOptions["highlight"];
  api: Pick<DocumentApi, "isOpen" | "setOpen" | "toggle" | "copy">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-document": KindDocumentElement;
    "kind-document-header": HTMLElement;
    "kind-document-title": HTMLElement;
    "kind-document-meta": HTMLElement;
    "kind-document-toolbar": HTMLElement;
    "kind-document-copy": HTMLElement;
    "kind-document-download": UiPartElement<typeof documentPrimitive, "download", "value">;
    "kind-document-body": HTMLElement;
    "kind-document-content": HTMLElement;
    "kind-document-expand": HTMLElement;
  }
}
