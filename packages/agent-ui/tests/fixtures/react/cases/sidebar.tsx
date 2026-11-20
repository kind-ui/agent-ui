import type { SidebarOptions } from "@kind-ui/agent-ui/core";
import { useEffect } from "react";
import { Composer, ComposerInput, ComposerSubmit } from "../../../../src/react/composer.js";
import {
  Sidebar,
  SidebarHandle,
  SidebarInset,
  SidebarPanel,
  SidebarTrigger,
} from "../../../../src/react/sidebar.js";
import { chats, cookieStorage, sidebarHost } from "../../shared/sidebar.js";

const { host, change } = sidebarHost();

function useHost() {
  useEffect(() => {
    Object.assign(window, { kindHost: host });
  }, []);
}

function Chats(props: SidebarOptions) {
  useHost();
  return (
    <Sidebar label="Chats" shortcut="mod+b" onOpenChange={change} className="h-dvh" {...props}>
      <SidebarPanel>
        <nav aria-label="Recent chats" className="p-2">
          <ul className="m-0 flex list-none flex-col gap-1 p-0">
            {chats.map((chat) => (
              <li key={chat}>
                <a href={`#${chat}`} className="block rounded px-2 py-1">
                  {chat}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </SidebarPanel>
      <SidebarHandle />
      <SidebarInset>
        <main>
          <header className="flex items-center gap-2 p-2">
            <SidebarTrigger />
            <h1 className="m-0 text-base">Release checklist</h1>
          </header>
          <p className="px-4">Ship the docs, then tag the release.</p>
        </main>
      </SidebarInset>
    </Sidebar>
  );
}

function Assistant() {
  useHost();
  return (
    <Sidebar label="Assistant" side="end" onOpenChange={change} className="h-dvh">
      <SidebarInset>
        <main>
          <header className="flex items-center justify-end gap-2 p-2">
            <SidebarTrigger />
          </header>
          <p className="px-4">The page.</p>
        </main>
      </SidebarInset>
      <SidebarHandle />
      <SidebarPanel>
        <div className="mt-auto p-2">
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
