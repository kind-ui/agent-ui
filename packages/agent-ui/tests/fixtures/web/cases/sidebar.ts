import type { SidebarOptions } from "@kind-ui/agent-ui/core";
import { defineComposer } from "../../../../src/web/composer.js";
import { defineSidebar, type KindSidebarElement } from "../../../../src/web/sidebar.js";
import { chats, cookieStorage, sidebarHost } from "../../shared/sidebar.js";

const { host, change } = sidebarHost();

const trigger = `<kind-sidebar-trigger><button></button></kind-sidebar-trigger>`;

const chatsMarkup = `
  <kind-sidebar-panel>
    <nav aria-label="Recent chats" class="p-2">
      <ul class="m-0 flex list-none flex-col gap-1 p-0">
        ${chats.map((chat) => `<li><a href="#${chat}" class="block rounded px-2 py-1">${chat}</a></li>`).join("")}
      </ul>
    </nav>
  </kind-sidebar-panel>
  <kind-sidebar-inset>
    <main>
      <header class="flex items-center gap-2 p-2">${trigger}<h1 class="m-0 text-base">Release checklist</h1></header>
      <p class="px-4">Ship the docs, then tag the release.</p>
    </main>
  </kind-sidebar-inset>`;

const assistantMarkup = `
  <kind-sidebar-inset>
    <main>
      <header class="flex items-center justify-end gap-2 p-2">${trigger}</header>
      <p class="px-4">The page.</p>
    </main>
  </kind-sidebar-inset>
  <kind-sidebar-panel>
    <div class="mt-auto p-2">
      <kind-composer>
        <form aria-label="Message">
          <ui-file-input>
            <ui-file-input-dropzone>
              <kind-composer-input>
                <ui-token-input>
                  <ui-token-input-editor aria-label="Prompt" placeholder="Ask the assistant"></ui-token-input-editor>
                </ui-token-input>
              </kind-composer-input>
              <kind-composer-submit><button></button></kind-composer-submit>
            </ui-file-input-dropzone>
          </ui-file-input>
        </form>
      </kind-composer>
    </div>
  </kind-sidebar-panel>`;

const page =
  (markup: string, options: Partial<KindSidebarElement> & SidebarOptions = {}) =>
  (root: HTMLElement) => {
    defineSidebar();
    defineComposer();
    const sidebar = document.createElement("kind-sidebar");
    sidebar.className = "h-dvh";
    Object.assign(sidebar, { label: "Chats", shortcut: "mod+b", ...options });
    sidebar.innerHTML = markup;
    sidebar.addEventListener("openchange", (event) => change(event.detail.value, event.detail));
    root.append(sidebar);
    Object.assign(window, { kindHost: host });
  };

export const cases = {
  all: page(chatsMarkup),
  end: page(assistantMarkup, { label: "Assistant", side: "end", shortcut: "" }),
  saved: page(chatsMarkup, { storageKey: "fixture-sidebar", storage: cookieStorage }),
};
