<script setup lang="ts">
import type { MessageOptions } from "@kind-ui/agent-ui/core";
import { ref } from "vue";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/vue/composer";
import { Message, MessageContent, MessageDelivery } from "@/components/ui/vue/message";

type Sent = { id: string; text: string; delivery: MessageOptions["delivery"] };

const wait = () => new Promise((resolve) => setTimeout(resolve, 600));

const sent = ref<Sent[]>([
  { id: "steer", text: "Use the session table, not a cookie", delivery: "steering" },
  { id: "queued", text: "Then add a test for the expired session case", delivery: "queued" },
  { id: "failed", text: "Also log failed refreshes", delivery: "not-sent" },
]);
const update = (id: string, next: Partial<Sent> | null) => {
  sent.value = sent.value.flatMap((m) => (m.id !== id ? [m] : next ? [{ ...m, ...next }] : []));
};

async function withdraw(id: string) {
  await wait();
  update(id, null);
}

async function resend(id: string) {
  await wait();
  update(id, { delivery: undefined });
}
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-4">
    <Message aria-label="Assistant message">
      <MessageContent>I'll store the session in a signed cookie and check it on each request.</MessageContent>
    </Message>
    <Message
      v-for="message in sent"
      :key="message.id"
      aria-label="Your message"
      message-role="user"
      :text="message.text"
      :delivery="message.delivery"
      :on-withdraw="() => withdraw(message.id)"
      :on-resend="() => resend(message.id)"
    >
      <MessageContent>{{ message.text }}</MessageContent>
      <MessageDelivery />
    </Message>
    <Composer aria-label="Message" :on-submit="() => {}">
      <ComposerInput aria-label="Prompt" placeholder="Withdrawn messages come back here" />
      <ComposerSubmit />
    </Composer>
  </div>
</template>
