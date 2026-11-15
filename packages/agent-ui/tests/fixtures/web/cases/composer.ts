import type { UiActionDetail } from "@ui-sdk/web";
import { defineComposer } from "../../../../src/web/composer.js";

const unsettled = new Promise<void>(() => {});

export const cases = {
  shell: (root: HTMLElement) => {
    defineComposer();
    root.innerHTML = `
      <kind-composer>
        <form aria-label="Message" class="flex gap-2 border border-[rgb(1,2,3)] p-2 data-[pending]:opacity-50">
          <kind-composer-input><textarea aria-label="Message" class="flex-1"></textarea></kind-composer-input>
          <kind-composer-submit><button>Send</button></kind-composer-submit>
        </form>
      </kind-composer>
    `;
    root.querySelector("kind-composer")?.addEventListener("submit", (event) => {
      (event as CustomEvent<UiActionDetail>).detail.waitUntil(unsettled);
    });
  },
};
