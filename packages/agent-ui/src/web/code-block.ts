import {
  type CodeBlockApi,
  type CodeBlockOptions,
  type CodeBlockState,
  type CodeBlockWrapChangeReason,
  codeBlockPrimitive,
  type Token,
} from "@kind-ui/agent-ui/core";
import { createParts, wrappedButton, wrappedChild } from "@ui-sdk/web";
import type { AttributeProperties, UiChangeEvent, UiElement } from "@ui-sdk/web/events";
import { defineInternalScrollArea } from "./internal/scroll-area.js";

const parts = `
  <kind-code-block-header>
    <kind-code-block-language></kind-code-block-language>
    <kind-code-block-wrap><button></button></kind-code-block-wrap>
    <kind-code-block-copy><button></button></kind-code-block-copy>
  </kind-code-block-header>
  <kind-internal-scroll-area>
    <ui-scroll-area>
      <ui-scroll-area-viewport>
        <ui-scroll-area-content><kind-code-block-code><pre><code></code></pre></kind-code-block-code></ui-scroll-area-content>
      </ui-scroll-area-viewport>
      <ui-scroll-area-scrollbar orientation="horizontal"><ui-scroll-area-thumb></ui-scroll-area-thumb></ui-scroll-area-scrollbar>
      <ui-scroll-area-scrollbar orientation="vertical"><ui-scroll-area-thumb></ui-scroll-area-thumb></ui-scroll-area-scrollbar>
    </ui-scroll-area>
  </kind-internal-scroll-area>`;

const sameTokens = (a: Token[] | undefined, b: Token[]) =>
  a?.length === b.length &&
  a.every((token, i) => {
    const other = b[i] as Token;
    return (
      token.content === other.content && token.color === other.color && token.fontStyle === other.fontStyle
    );
  });

function tokenElement(token: Token): HTMLElement {
  const span = document.createElement("span");
  if (token.fontStyle) span.dataset.fontStyle = token.fontStyle;
  if (token.color) span.style.setProperty("--kind-code-block-token", token.color);
  span.textContent = token.content;
  return span;
}

/**
 * `<kind-code-block code="…" language="ts" aria-label="Code">` fills in its header and scroll area when it has
 * no children. Set `highlight` as a property.
 */
export function defineCodeBlock(): void {
  if (customElements.get("kind-code-block")) return;
  defineInternalScrollArea();
  createParts(codeBlockPrimitive, {
    root: {
      tag: "kind-code-block",
      state: {
        wrap: {
          get: (api) => api.isWrapped(),
          set: (api, wrap) => api.setWrap(!!wrap),
        },
      },
      api: ["copy", "isWrapped", "setWrap", "toggleWrap"],
      render: (el, instance) => {
        if (!el.firstElementChild) el.innerHTML = parts;
        const label = el.querySelector("kind-code-block-language");
        const scrollArea = el.querySelector("ui-scroll-area");
        const code = el.querySelector("kind-code-block-code code");
        let drawn: Token[][] = [];
        const draw = () => {
          const { language, lines, streaming } = instance.get() as CodeBlockState;
          if (label && label.textContent !== (language ?? "")) label.textContent = language ?? "";
          scrollArea?.toggleAttribute("stick-to-end", streaming);
          if (!code || lines === drawn) return;
          lines.forEach((tokens, index) => {
            if (sameTokens(drawn[index], tokens)) return;
            const line = code.children[index] ?? code.appendChild(document.createElement("span"));
            line.setAttribute("data-line", "");
            line.replaceChildren(...tokens.map(tokenElement));
          });
          while (code.children.length > lines.length) code.lastElementChild?.remove();
          drawn = lines;
        };
        draw();
        return instance.subscribe(draw);
      },
    },
    header: "kind-code-block-header",
    language: "kind-code-block-language",
    wrap: { tag: "kind-code-block-wrap", target: wrappedButton, display: "contents" },
    copy: { tag: "kind-code-block-copy", target: wrappedButton, display: "contents" },
    code: { tag: "kind-code-block-code", target: wrappedChild("pre"), display: "contents" },
  });
}

export type KindCodeBlockEvents = { wrapchange: UiChangeEvent<boolean, CodeBlockWrapChangeReason> };

export interface KindCodeBlockElement
  extends UiElement<KindCodeBlockEvents>,
    AttributeProperties<typeof codeBlockPrimitive, "api" | "highlight" | "wrap"> {
  wrap: boolean;
  highlight?: CodeBlockOptions["highlight"];
  api: Pick<CodeBlockApi, "copy" | "isWrapped" | "setWrap" | "toggleWrap">;
}

declare global {
  interface HTMLElementTagNameMap {
    "kind-code-block": KindCodeBlockElement;
    "kind-code-block-header": HTMLElement;
    "kind-code-block-language": HTMLElement;
    "kind-code-block-wrap": HTMLElement;
    "kind-code-block-copy": HTMLElement;
    "kind-code-block-code": HTMLElement;
  }
}
