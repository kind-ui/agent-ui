<script lang="ts">
  import {
    Sidebar,
    SidebarHandle,
    SidebarInset,
    SidebarPanel,
    SidebarTrigger,
  } from "@/components/ui/svelte/sidebar/index.js";

  const chats = [
    "Nightly export timeouts",
    "Retry with backoff",
    "Reports service latency",
    "Alert on long runs",
    "Release notes for 2.4",
  ];
</script>

<Sidebar label="Chats" class="h-[420px] w-full overflow-hidden">
  <SidebarPanel>
    <div class="flex h-12 shrink-0 items-center border-b border-[var(--kind-color-border)] px-4">
      <h2 class="m-0 text-sm font-medium">Chats</h2>
    </div>
    <nav aria-label="Recent chats" class="p-2">
      <ul class="flex flex-col gap-0.5">
        {#each chats as chat (chat)}
          <li>
            <a
              href="#chat"
              class="flex h-9 items-center truncate rounded-[var(--kind-radius-md)] px-2.5 text-sm hover:bg-[var(--kind-color-hover)]"
            >
              {chat}
            </a>
          </li>
        {/each}
      </ul>
    </nav>
  </SidebarPanel>
  <SidebarHandle />
  <SidebarInset>
    <header class="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--kind-color-border)] px-3">
      <SidebarTrigger />
      <h2 class="m-0 truncate text-sm font-medium">Nightly export timeouts</h2>
    </header>
    <p class="m-0 p-4 text-sm text-[var(--kind-color-muted)]">
      Drag the handle to resize the chats, or press the button beside the title to hide them.
    </p>
  </SidebarInset>
</Sidebar>
