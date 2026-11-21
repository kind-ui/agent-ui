<script module lang="ts">
  export const variants = ["all", "end", "saved"];
</script>

<script lang="ts">
  import { Composer, ComposerInput, ComposerSubmit } from "../../../../src/svelte/composer/index.js";
  import {
    Sidebar,
    SidebarHandle,
    SidebarInset,
    SidebarPanel,
    SidebarTrigger,
  } from "../../../../src/svelte/sidebar/index.js";
  import { expose } from "../../shared/expose.js";
  import { chats, cookieStorage, sidebarHost } from "../../shared/sidebar.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, change } = sidebarHost();
  expose({ kindHost: host });
</script>

{#if variant === "end"}
  <Sidebar label="Assistant" side="end" onOpenChange={change} class="h-dvh">
    <SidebarInset>
      <main>
        <header class="flex items-center justify-end gap-2 p-2">
          <SidebarTrigger />
        </header
        ><p class="px-4">The page.</p>
      </main>
    </SidebarInset
    ><SidebarHandle
    /><SidebarPanel>
      <div class="mt-auto p-2">
        <Composer aria-label="Message" onSubmit={() => undefined}>
          <ComposerInput aria-label="Prompt" placeholder="Ask the assistant"
          /><ComposerSubmit />
        </Composer>
      </div>
    </SidebarPanel>
  </Sidebar>
{:else}
  <Sidebar
    label="Chats"
    shortcut="mod+b"
    onOpenChange={change}
    class="h-dvh"
    storageKey={variant === "saved" ? "fixture-sidebar" : undefined}
    storage={variant === "saved" ? cookieStorage : undefined}
  >
    <SidebarPanel>
      <nav aria-label="Recent chats" class="p-2">
        <ul class="m-0 flex list-none flex-col gap-1 p-0">
          {#each chats as chat (chat)}
            <li><a href={`#${chat}`} class="block rounded px-2 py-1">{chat}</a></li>
          {/each}
        </ul>
      </nav>
    </SidebarPanel
    ><SidebarHandle
    /><SidebarInset>
      <main>
        <header class="flex items-center gap-2 p-2">
          <SidebarTrigger
          /><h1 class="m-0 text-base">Release checklist</h1>
        </header
        ><p class="px-4">Ship the docs, then tag the release.</p>
      </main>
    </SidebarInset>
  </Sidebar>
{/if}
