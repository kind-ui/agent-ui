<script setup lang="ts">
import { ref } from "vue";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/vue/composer";
import {
  Conversation,
  ConversationContent,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/vue/conversation";
import {
  Sidebar,
  SidebarHandle,
  SidebarInset,
  SidebarPanel,
  SidebarTrigger,
} from "@/components/ui/vue/sidebar";

type Line = { id: string; role: "user" | "assistant"; text: string };

const lines = ref<Line[]>([
  { id: "m1", role: "user", text: "Why did the nightly export fail?" },
  {
    id: "m2",
    role: "assistant",
    text: "Every run since last week stopped after 30 seconds waiting on the reports service.",
  },
]);

const code =
  "export async function run() {\n  const pages = await reports.list({ timeout: 30_000 });\n  await upload(pages);\n}";

const send = (draft: { text: string }) => {
  lines.value = [...lines.value, { id: `m${lines.value.length + 1}`, role: "user", text: draft.text }];
};
</script>

<template>
  <Sidebar side="end" label="Assistant" default-size="320px" class="h-[420px] w-full overflow-hidden">
    <SidebarInset>
      <header
        class="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-[var(--kind-color-border)] px-3"
      >
        <h2 class="m-0 truncate text-sm font-medium">billing-export.ts</h2>
        <SidebarTrigger />
      </header>
      <pre class="m-0 flex-1 overflow-auto p-4 text-xs">{{ code }}</pre>
    </SidebarInset>
    <SidebarHandle />
    <SidebarPanel>
      <div class="flex h-12 shrink-0 items-center border-b border-[var(--kind-color-border)] px-4">
        <h2 class="m-0 text-sm font-medium">Assistant</h2>
      </div>
      <Conversation aria-label="Assistant conversation" :message-count="lines.length" class="min-h-0 flex-1">
        <ConversationViewport>
          <ConversationContent>
            <ConversationRow v-for="(line, index) in lines" :key="line.id" :value="line.id" :index="index">
              <p
                :class="
                  line.role === 'user'
                    ? 'ms-auto w-fit max-w-[85%] rounded-[var(--kind-bubble-radius)] bg-[var(--kind-color-bubble)] px-3.5 py-2 text-sm'
                    : 'text-sm'
                "
              >
                {{ line.text }}
              </p>
            </ConversationRow>
          </ConversationContent>
        </ConversationViewport>
        <ConversationJump />
      </Conversation>
      <div class="p-2">
        <Composer aria-label="Message" :on-submit="send">
          <ComposerInput aria-label="Prompt" placeholder="Ask about this file" />
          <ComposerSubmit />
        </Composer>
      </div>
    </SidebarPanel>
  </Sidebar>
</template>
