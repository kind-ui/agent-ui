import { defineReasoning } from "../../../../src/web/reasoning.js";

export const cases = {
  all: (root: HTMLElement) => {
    defineReasoning();
    root.innerHTML = `
      <div class="flex w-96 flex-col gap-4 p-6">
        <kind-reasoning id="live" status="running"></kind-reasoning>
        <kind-reasoning id="cached" status="pending" text="Answered from the cache."></kind-reasoning>
        <kind-reasoning id="done" status="complete" duration-seconds="3"
          text="Compared **three** sources. Collapsed text: kumquat."></kind-reasoning>
      </div>`;
    const element = (id: string) => root.querySelector(`#${id}`) as HTMLElementTagNameMap["kind-reasoning"];
    Object.assign(window, {
      kindReasoning: {
        set: (id: string, next: Record<string, string | number | undefined>) => {
          for (const [key, value] of Object.entries(next)) {
            const name = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
            if (value === undefined) element(id).removeAttribute(name);
            else element(id).setAttribute(name, String(value));
          }
        },
        append: (id: string, chunk: string) => {
          element(id).text = `${element(id).text ?? ""}${chunk}`;
        },
      },
    });
  },
};
