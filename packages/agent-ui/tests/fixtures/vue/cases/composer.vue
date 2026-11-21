<script lang="ts">
export const variants = ["shell", "full", "mod-enter", "attachments"] as const;
</script>

<script setup lang="ts">
import type { AttachmentItem, ComposerDraft, MotionMode } from "@kind-ui/agent-ui/core";
import { computed, onMounted, shallowRef } from "vue";
import { Attachments } from "../../../../src/vue/attachments.js";
import {
  Composer,
  ComposerAttach,
  ComposerAttachments,
  ComposerInput,
  ComposerRestored,
  ComposerStop,
  ComposerSubmit,
  ComposerTriggerMenu,
} from "../../../../src/vue/composer.js";
import { expose } from "../../shared/expose.js";
import {
  attachmentItems,
  attachmentsHost,
  commands,
  draftOptions,
  history,
  mentions,
  recorder,
} from "../../shared/composer.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const unsettled = new Promise<void>(() => {});
const full = props.variant === "full" || props.variant === "mod-enter";
const { onSubmit, onStop } = full ? recorder() : { onSubmit: undefined, onStop: undefined };
const drafts = full ? draftOptions(props.params) : {};

const mounted = shallowRef(true);
const draft = shallowRef<ComposerDraft>({ text: "", tokens: [], attachments: [] });
const draftKey = shallowRef(props.params.get("draftKey") ?? "chat-1");
const items = shallowRef<AttachmentItem[]>(attachmentItems());

const options = computed(() => ({
  ...drafts,
  ...(props.params.has("draft") ? { draftKey: draftKey.value } : {}),
  ...(props.params.has("controlled") ? { value: draft.value } : {}),
  ...(props.params.has("stop") ? { onStop } : {}),
  ...(props.params.has("motion") ? { motion: props.params.get("motion") as MotionMode } : {}),
}));
const motion = props.params.has("motion") ? (props.params.get("motion") as MotionMode) : undefined;

const onValueChange = (value: ComposerDraft, details: { cancel(): void }) => {
  if ((window as { refuseEdits?: boolean }).refuseEdits) details.cancel();
  else draft.value = value;
};
const onKeydownCapture = (event: KeyboardEvent) => {
  if (event.key === "Enter" && (window as { blockEnter?: boolean }).blockEnter) event.preventDefault();
};
const remove = (id: string) => {
  items.value = items.value.filter((item) => item.id !== id);
};

onMounted(() => {
  if (full)
    expose({
      unmountComposer: () => {
        mounted.value = false;
      },
      remountComposer: () => {
        mounted.value = true;
      },
      setDraftKey: (key: string) => {
        draftKey.value = key;
      },
    });
  if (props.variant === "attachments")
    attachmentsHost((change) => {
      items.value = change(items.value);
    });
});
</script>

<template>
  <Composer
    v-if="variant === 'shell'"
    aria-label="Message"
    class="border-[rgb(1,2,3)] data-[pending]:opacity-50"
    :onSubmit="() => unsettled"
  >
    <ComposerInput aria-label="Prompt" />
    <ComposerSubmit>Send</ComposerSubmit>
  </Composer>
  <template v-else-if="full">
    <div v-if="mounted" class="mx-auto max-w-xl p-6">
      <Composer
        aria-label="Message"
        :mentions="mentions"
        :commands="commands"
        :history="history"
        accept="image/*,.txt,.md"
        :max-size="3072"
        :submit-on="variant === 'mod-enter' ? 'mod-enter' : 'enter'"
        :onSubmit="onSubmit"
        v-bind="options"
        @value-change="onValueChange"
      >
        <ComposerAttachments />
        <ComposerInput
          aria-label="Prompt"
          placeholder="Ask anything. Type @ to mention, / for commands"
          @keydown.capture="onKeydownCapture"
        >
          <ComposerTriggerMenu />
        </ComposerInput>
        <ComposerAttach />
        <ComposerRestored />
        <ComposerSubmit />
        <ComposerStop />
      </Composer>
    </div>
  </template>
  <div v-else-if="variant === 'attachments'" class="p-6">
    <Attachments aria-label="Files" :items="items" :motion="motion" @remove="remove" />
  </div>
  <p v-else data-no-case>No case</p>
</template>
