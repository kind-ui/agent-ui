<script setup lang="ts">
import { ref } from "vue";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/vue/composer";
import { ConnectionStatus } from "@/components/ui/vue/connection-status";
import {
  Conversation,
  ConversationContent,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/vue/conversation";

type Connection = "online" | "reconnecting" | "offline";

const messages = [
  { id: "m1", role: "user", text: "Why did the deploy to staging stop halfway?" },
  {
    id: "m2",
    role: "assistant",
    text: "The migration step timed out waiting for a lock on the orders table. A long report query was holding it.",
  },
  { id: "m3", role: "user", text: "Can you rerun it once the query finishes?" },
];

const states: Connection[] = ["online", "reconnecting", "offline"];

const inFiveSeconds = () => new Date(Date.now() + 5000).toISOString();

const state = ref<Connection>("reconnecting");
const retryAt = ref(inFiveSeconds());

const choose = (next: Connection) => {
  if (next === "reconnecting") retryAt.value = inFiveSeconds();
  state.value = next;
};
const retry = () =>
  new Promise<void>((resolve) => {
    setTimeout(() => {
      state.value = "online";
      resolve();
    }, 800);
  });
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-3">
    <fieldset class="flex flex-wrap gap-1 self-start border-0 p-0 text-sm">
      <legend class="sr-only">Connection</legend>
      <button
        v-for="option in states"
        :key="option"
        type="button"
        :aria-pressed="state === option"
        class="w-28 rounded-md border border-[var(--kind-color-border)] py-1 capitalize aria-pressed:bg-[var(--kind-color-hover)]"
        @click="choose(option)"
      >
        {{ option }}
      </button>
    </fieldset>
    <Conversation
      aria-label="Conversation"
      :message-count="messages.length"
      class="h-56 rounded-xl border border-[var(--kind-color-border)]"
    >
      <ConversationViewport>
        <ConversationContent>
          <ConversationRow v-for="(message, index) in messages" :key="message.id" :value="message.id" :index="index">
            <p
              :class="
                message.role === 'user'
                  ? 'ms-auto w-fit max-w-[80%] rounded-2xl bg-[var(--kind-color-hover)] px-3.5 py-2'
                  : undefined
              "
            >
              {{ message.text }}
            </p>
          </ConversationRow>
        </ConversationContent>
      </ConversationViewport>
      <ConnectionStatus :state="state" :retry-at="retryAt" :on-retry="retry" />
    </Conversation>
    <Composer aria-label="Message" :disabled="state === 'offline'">
      <ComposerInput aria-label="Prompt" :placeholder="state === 'offline' ? 'Offline' : 'Ask anything'" />
      <ComposerSubmit />
    </Composer>
  </div>
</template>
