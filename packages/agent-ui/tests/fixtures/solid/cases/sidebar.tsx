import type { SidebarOptions } from "@kind-ui/agent-ui/core";
import { For, onSettled } from "solid-js";
import { Composer, ComposerInput, ComposerSubmit } from "../../../../src/solid/composer.js";
import {
  Sidebar,
  SidebarHandle,
  SidebarInset,
  SidebarPanel,
  SidebarTrigger,
} from "../../../../src/solid/sidebar.js";
import { expose } from "../../shared/expose.js";
import { chats, cookieStorage, sidebarHost } from "../../shared/sidebar.js";

const { host, change } = sidebarHost();

function useHost() {
  onSettled(() => expose({ kindHost: host }));
}

function Chats(props: SidebarOptions) {
  useHost();
  return (
    <Sidebar label="Chats" shortcut="mod+b" onOpenChange={change} class="h-dvh" {...props}>
      <SidebarPanel>
        <nav aria-label="Recent chats" class="p-2">
          <ul class="m-0 flex list-none flex-col gap-1 p-0">
            <For each={chats}>
              {(chat) => (
                <li>
                  <a href={`#${chat}`} class="block rounded px-2 py-1">
                    {chat}
                  </a>
                </li>
              )}
            </For>
          </ul>
        </nav>
      </SidebarPanel>
      <SidebarHandle />
      <SidebarInset>
        <main>
          <header class="flex items-center gap-2 p-2">
            <SidebarTrigger />
            <h1 class="m-0 text-base">Release checklist</h1>
          </header>
          <p class="px-4">Ship the docs, then tag the release.</p>
        </main>
      </SidebarInset>
    </Sidebar>
  );
}

function Assistant() {
  useHost();
  return (
    <Sidebar label="Assistant" side="end" onOpenChange={change} class="h-dvh">
      <SidebarInset>
        <main>
          <header class="flex items-center justify-end gap-2 p-2">
            <SidebarTrigger />
          </header>
          <p class="px-4">The page.</p>
        </main>
      </SidebarInset>
      <SidebarHandle />
      <SidebarPanel>
        <div class="mt-auto p-2">
          <Composer aria-label="Message" onSubmit={() => undefined}>
            <ComposerInput aria-label="Prompt" placeholder="Ask the assistant" />
            <ComposerSubmit />
          </Composer>
        </div>
      </SidebarPanel>
    </Sidebar>
  );
}

export const cases = {
  all: () => <Chats />,
  end: () => <Assistant />,
  saved: () => <Chats storageKey="fixture-sidebar" storage={cookieStorage} />,
};
