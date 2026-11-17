import { defineAction } from "../../../../src/web/action.js";

export const cases = {
  all: (root: HTMLElement) => {
    defineAction();
    root.innerHTML = `
      <div class="flex w-96 flex-col gap-4 p-6">
        <kind-action id="action" label="Explain" status="running" quote="Rate limits reset every hour."></kind-action>
      </div>`;
    const action = root.querySelector("#action") as HTMLElement & { result?: string };
    Object.assign(window, {
      kindAction: {
        set: (next: Record<string, string | undefined>) => {
          for (const [key, value] of Object.entries(next)) {
            if (key === "result") action.result = value ?? "";
            else if (value === undefined) action.removeAttribute(key);
            else action.setAttribute(key, value);
          }
        },
        append: (chunk: string) => {
          action.result = `${action.result ?? ""}${chunk}`;
        },
      },
    });
  },
};
