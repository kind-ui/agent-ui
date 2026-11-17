import type { SelectionActionItem } from "@kind-ui/agent-ui";
import { defineSelection } from "../../../../src/web/selection.js";

const actions: SelectionActionItem[] = [
  { id: "ask", label: "Ask" },
  { id: "quote", label: "Quote" },
  { id: "copy", label: "Copy", description: "Copy the selected text" },
];

type Detail = { value: unknown; reason: string; source?: string };

export const cases = {
  all: (root: HTMLElement) => {
    defineSelection();
    const host = { actions: [] as unknown[][], dismissals: [] as unknown[][] };
    root.innerHTML = `
      <div class="flex w-[32rem] flex-col gap-4 px-6 pt-60 pb-[150vh]">
        <p id="before">Text before the reply, outside the selection root.</p>
        <kind-selection id="selection" can-run>
          <kind-selection-content>
            <p id="reply">Rate limits reset every hour. Each response carries the remaining count in its headers.</p>
            <p id="reply-2">Back off exponentially when a request is refused.</p>
          </kind-selection-content>
        </kind-selection>
        <p id="after">Text after the reply, outside the selection root.</p>
      </div>`;
    const selection = root.querySelector("#selection") as HTMLElement & { actions?: SelectionActionItem[] };
    selection.actions = actions;
    selection.addEventListener("selectionaction", (event) => {
      const { value, reason, source } = (event as CustomEvent<Detail>).detail;
      const run = value as { actionId: string; text: string };
      host.actions.push([run.actionId, run.text, reason, source]);
    });
    selection.addEventListener("dismiss", (event) => {
      const { value, reason, source } = (event as CustomEvent<Detail>).detail;
      host.dismissals.push([value, reason, source]);
    });
    Object.assign(window, { kindHost: host });
  },
};
