import type { UiActionDetail } from "@ui-sdk/web";
import { defineAttachments } from "../../../../src/web/attachments.js";
import { defineComposer } from "../../../../src/web/composer.js";
import { commands, history, imageFile, mentions, recorder } from "../../shared/composer.js";

const unsettled = new Promise<void>(() => {});
const params = new URLSearchParams(location.search);

const markup = (attributes: string) => `
  <div class="mx-auto max-w-xl p-6">
    <kind-composer ${attributes}>
      <form aria-label="Message">
        <ui-file-input>
          <ui-file-input-dropzone>
            <kind-composer-attachments><kind-attachments aria-label="Attachments"></kind-attachments></kind-composer-attachments>
            <kind-composer-input>
              <ui-token-input>
                <ui-token-input-editor aria-label="Prompt" placeholder="Ask anything. Type @ to mention, / for commands"></ui-token-input-editor>
                <kind-composer-trigger-menu>
                  <kind-internal-trigger-menu>
                    <ui-trigger-menu>
                      <ui-trigger-menu-content>
                        <ui-trigger-menu-empty>No matches</ui-trigger-menu-empty>
                        <ui-trigger-menu-list></ui-trigger-menu-list>
                      </ui-trigger-menu-content>
                    </ui-trigger-menu>
                  </kind-internal-trigger-menu>
                </kind-composer-trigger-menu>
              </ui-token-input>
            </kind-composer-input>
            <ui-file-input-trigger><button type="button" aria-label="Attach files"></button></ui-file-input-trigger>
            <kind-composer-submit><button></button></kind-composer-submit>
            <kind-composer-stop><button></button></kind-composer-stop>
          </ui-file-input-dropzone>
        </ui-file-input>
      </form>
    </kind-composer>
  </div>`;

function full(root: HTMLElement, submitOn: "enter" | "mod-enter") {
  defineComposer();
  root.innerHTML = markup(`accept="image/*,.txt,.md" max-size="3072" submit-on="${submitOn}"`);
  const composer = root.querySelector("kind-composer") as HTMLElement & Record<string, unknown>;
  const { onSubmit, onStop } = recorder();
  Object.assign(composer, { mentions, commands, history, ...(params.has("stop") ? { onStop } : {}) });
  composer.addEventListener("composersubmit", (event) => {
    const { detail } = event as CustomEvent<UiActionDetail & { value: Parameters<typeof onSubmit>[0] }>;
    detail.waitUntil(onSubmit(detail.value));
  });
  root.querySelector("ui-token-input-editor")?.addEventListener("keydown", (event) => {
    if ((event as KeyboardEvent).key === "Enter" && (window as { blockEnter?: boolean }).blockEnter) {
      event.preventDefault();
    }
  });
  Object.assign(window, { unmountComposer: () => composer.remove() });
}

export const cases = {
  shell: (root: HTMLElement) => {
    defineComposer();
    root.innerHTML = markup("").replace(
      '<form aria-label="Message">',
      '<form aria-label="Message" class="border-[rgb(1,2,3)] data-[pending]:opacity-50">',
    );
    root.querySelector("kind-composer")?.addEventListener("composersubmit", (event) => {
      (event as CustomEvent<UiActionDetail>).detail.waitUntil(unsettled);
    });
  },
  full: (root: HTMLElement) => full(root, "enter"),
  "mod-enter": (root: HTMLElement) => full(root, "mod-enter"),
  attachments: (root: HTMLElement) => {
    defineAttachments();
    root.innerHTML = `<div class="p-6"><kind-attachments aria-label="Files"></kind-attachments></div>`;
    const list = root.querySelector("kind-attachments") as HTMLElement & Record<string, unknown>;
    let items = [
      { id: "a", name: "diagram.png", size: 2048, mediaType: "image/png", file: imageFile() },
      { id: "b", name: "notes.md", size: 812, mediaType: "text/markdown" },
      { id: "c", name: "archive.zip", size: 9_000_000, mediaType: "application/zip", error: "type" },
    ];
    Object.assign(list, {
      items,
      onRemove: (id: string) => {
        items = items.filter((item) => item.id !== id);
        list.items = items;
      },
    });
  },
};
