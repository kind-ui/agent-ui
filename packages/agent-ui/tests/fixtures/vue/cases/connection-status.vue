<script lang="ts">
export const variants = ["online", "offline", "reduced"] as const;
</script>

<script setup lang="ts">
import type { ConnectionState } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { ConnectionStatus } from "../../../../src/vue/connection-status.js";
import {
  Conversation,
  ConversationContent,
  ConversationRow,
  ConversationViewport,
} from "../../../../src/vue/conversation.js";
import { type ConnectionHost, connectionHost, messages } from "../../shared/connection-status.js";
import { expose } from "../../shared/expose.js";
import { useFlush } from "./flush.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, retried } = connectionHost();
const motion = props.variant === "reduced" ? "reduced" : undefined;
const connection = shallowRef<{ state: ConnectionState; retryAt?: string | undefined; resuming?: boolean | undefined }>(
  { state: props.variant === "online" ? "online" : "offline" },
);
const flush = useFlush();

onMounted(() => {
  // Each call renders before it returns, so two calls in a row aren't batched into the second.
  const set: ConnectionHost["set"] = (state, options) =>
    flush(() => {
      connection.value = { state, ...options };
    });
  expose({ kindHost: Object.assign(host, { set }) });
});
</script>

<template>
  <Conversation
    aria-label="Conversation"
    :message-count="messages.length"
    class="m-4 h-[24rem] w-[32rem] rounded-xl border border-[var(--kind-color-border)]"
  >
    <ConversationViewport>
      <ConversationContent>
        <ConversationRow v-for="(message, index) in messages" :key="message.id" :value="message.id" :index="index">
          <p :data-message="message.id">{{ message.text }}</p>
        </ConversationRow>
      </ConversationContent>
    </ConversationViewport>
    <ConnectionStatus
      id="connection"
      :state="connection.state"
      :retry-at="connection.retryAt"
      :resuming="connection.resuming"
      :motion="motion"
      :on-retry="retried"
    />
  </Conversation>
</template>
