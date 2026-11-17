import type { SelectionActionItem } from "@kind-ui/agent-ui";
import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineSelection } from "../../../../src/web/selection.js";

const actions: SelectionActionItem[] = [
  { id: "ask", label: "Ask" },
  { id: "quote", label: "Quote" },
  { id: "copy", label: "Copy", description: "Copy the selected text" },
];

const markup = `
  <div class="flex w-[32rem] flex-col gap-4 px-6 pt-60 pb-[150vh]">
    <p id="before">Text before the reply, outside the selection root.</p>
    <button id="outside" type="button">Elsewhere</button>
    <kind-selection id="selection">
      <kind-selection-content>
        <p id="reply">Rate limits reset every hour. Each response carries the remaining count in its headers.</p>
        <p id="reply-2">Back off exponentially when a request is refused.</p>
      </kind-selection-content>
    </kind-selection>
    <p id="after">Text after the reply, outside the selection root.</p>
  </div>`;

const page =
  ({
    runnable = true,
    refused = false,
    motion,
    shadow = false,
  }: {
    runnable?: boolean;
    refused?: boolean;
    motion?: MotionMode;
    shadow?: boolean;
  } = {}) =>
  (root: HTMLElement) => {
    defineSelection();
    const host = { actions: [] as unknown[][], dismissals: [] as unknown[][] };
    let scope: HTMLElement | ShadowRoot = root;
    if (shadow) {
      const shadowHost = document.createElement("div");
      shadowHost.id = "shadow-host";
      root.append(shadowHost);
      scope = shadowHost.attachShadow({ mode: "open" });
      for (const style of document.querySelectorAll("style, link[rel=stylesheet]"))
        scope.append(style.cloneNode(true));
    }
    const container = document.createElement("div");
    container.innerHTML = markup;
    scope.append(...container.childNodes);
    const selection = scope.querySelector("#selection") as HTMLElementTagNameMap["kind-selection"];
    selection.actions = actions;
    selection.canRun = runnable;
    if (motion) selection.setAttribute("motion", motion);
    selection.addEventListener("selectionaction", (event) => {
      const { value, reason, source } = event.detail;
      host.actions.push([value.actionId, value.text, reason, source]);
      if (refused) event.preventDefault();
    });
    selection.addEventListener("dismiss", (event) => {
      const { value, reason, source } = event.detail;
      host.dismissals.push([value, reason, source]);
      if (refused) event.preventDefault();
    });
    Object.assign(window, { kindHost: host });
  };

export const cases = {
  all: page(),
  refused: page({ refused: true }),
  static: page({ runnable: false }),
  reduced: page({ motion: "reduced" }),
  none: page({ motion: "none" }),
  shadow: page({ shadow: true }),
};
