import { defineAction } from "../../../../src/web/action.js";

const page =
  ({ owned = false }: { owned?: boolean } = {}) =>
  (root: HTMLElement) => {
    defineAction();
    const host = { openings: [] as unknown[][] };
    const action = document.createElement("kind-action");
    action.id = "action";
    action.setAttribute("label", "Explain");
    action.setAttribute("status", "running");
    action.setAttribute("quote", "Rate limits reset every hour.\n\n");
    let allowing = false;
    if (owned) {
      action.addEventListener("openchange", (event) => {
        host.openings.push([event.detail.value, event.detail.reason]);
        if (!allowing) event.preventDefault();
      });
    }
    const container = document.createElement("div");
    container.className = "flex w-96 flex-col gap-4 p-6";
    container.append(action);
    root.append(container);
    Object.assign(window, {
      kindHost: host,
      kindAction: {
        set: (next: { status?: string; result?: string; open?: boolean }) => {
          if (next.result !== undefined) action.result = next.result;
          if (next.status !== undefined) action.setAttribute("status", next.status);
          if (next.open !== undefined) {
            allowing = true;
            action.open = next.open;
            allowing = false;
          }
        },
        append: (chunk: string) => {
          action.result = `${action.result ?? ""}${chunk}`;
        },
      },
    });
  };

export const cases = { all: page(), owned: page({ owned: true }) };
