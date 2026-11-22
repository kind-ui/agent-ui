<script lang="ts">
export const variants = ["all", "end", "saved"] as const;
</script>

<script setup lang="ts">
import { onMounted } from "vue";
import { Composer, ComposerInput, ComposerSubmit } from "../../../../src/vue/composer.js";
import {
  Sidebar,
  SidebarHandle,
  SidebarInset,
  SidebarPanel,
  SidebarTrigger,
} from "../../../../src/vue/sidebar.js";
import { expose } from "../../shared/expose.js";
import { chats, cookieStorage, sidebarHost } from "../../shared/sidebar.js";

defineProps<{ variant: string; params: URLSearchParams }>();

const { host, change } = sidebarHost();
const ignore = () => undefined;

onMounted(() => expose({ kindHost: host }));
</script>

<template>
  <Sidebar v-if="variant === 'end'" label="Assistant" side="end" class="h-dvh" @open-change="change">
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
        <Composer aria-label="Message" :on-submit="ignore">
          <ComposerInput aria-label="Prompt" placeholder="Ask the assistant" />
          <ComposerSubmit />
        </Composer>
      </div>
    </SidebarPanel>
  </Sidebar>
  <Sidebar
    v-else
    label="Chats"
    shortcut="mod+b"
    class="h-dvh"
    :storage-key="variant === 'saved' ? 'fixture-sidebar' : undefined"
    :storage="variant === 'saved' ? cookieStorage : undefined"
    @open-change="change"
  >
    <SidebarPanel>
      <nav aria-label="Recent chats" class="p-2">
        <ul class="m-0 flex list-none flex-col gap-1 p-0">
          <li v-for="chat in chats" :key="chat">
            <a :href="`#${chat}`" class="block rounded px-2 py-1">{{ chat }}</a>
          </li>
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
</template>
