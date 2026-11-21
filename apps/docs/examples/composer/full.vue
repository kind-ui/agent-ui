<script setup lang="ts">
import type { EffortLevel, ModelOption, SettingsEntry, SettingsValues } from "@kind-ui/agent-ui";
import type { ComposerDraft, DictationEvent, DictationSource } from "@kind-ui/agent-ui/core";
import { shallowRef } from "vue";
import { AddMenu } from "@/components/ui/vue/add-menu";
import { ApprovalMode } from "@/components/ui/vue/approval-mode";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/vue/composer";
import { ContextBar } from "@/components/ui/vue/context-bar";
import { Dictation } from "@/components/ui/vue/dictation";
import { ModelControl } from "@/components/ui/vue/model-control";

const props = withDefaults(
  defineProps<{ onSubmit?: (draft: ComposerDraft) => Promise<void> | void; disabled?: boolean; placeholder?: string }>(),
  { onSubmit: () => new Promise<void>((resolve) => setTimeout(resolve, 1000)), placeholder: "Ask anything…" },
);

// Logos from Lobe Icons (@lobehub/icons-static-svg 1.103.0, MIT), see THIRD_PARTY_NOTICES.md, as image URLs: an
// image can't take `currentColor`, so each is drawn in a gray that reads in light and dark.
const logo = (attributes: string, contents: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" ${attributes}>${contents}</svg>`,
  )}`;

const anthropic = logo(
  'fill="#888" fill-rule="evenodd"',
  '<path d="M13.827 3.52h3.603L24 20h-3.603l-6.57-16.48zm-7.258 0h3.767L16.906 20h-3.674l-1.343-3.461H5.017l-1.344 3.46H0L6.57 3.522zm4.132 9.959L8.453 7.687 6.205 13.48H10.7z"/>',
);
const openai = logo(
  'fill="#888" fill-rule="evenodd"',
  '<path d="M9.205 8.658v-2.26c0-.19.072-.333.238-.428l4.543-2.616c.619-.357 1.356-.523 2.117-.523 2.854 0 4.662 2.212 4.662 4.566 0 .167 0 .357-.024.547l-4.71-2.759a.797.797 0 00-.856 0l-5.97 3.473zm10.609 8.8V12.06c0-.333-.143-.57-.429-.737l-5.97-3.473 1.95-1.118a.433.433 0 01.476 0l4.543 2.617c1.309.76 2.189 2.378 2.189 3.948 0 1.808-1.07 3.473-2.76 4.163zM7.802 12.703l-1.95-1.142c-.167-.095-.239-.238-.239-.428V5.899c0-2.545 1.95-4.472 4.591-4.472 1 0 1.927.333 2.712.928L8.23 5.067c-.285.166-.428.404-.428.737v6.898zM12 15.128l-2.795-1.57v-3.33L12 8.658l2.795 1.57v3.33L12 15.128zm1.796 7.23c-1 0-1.927-.332-2.712-.927l4.686-2.712c.285-.166.428-.404.428-.737v-6.898l1.974 1.142c.167.095.238.238.238.428v5.233c0 2.545-1.974 4.472-4.614 4.472zm-5.637-5.303l-4.544-2.617c-1.308-.761-2.188-2.378-2.188-3.948A4.482 4.482 0 014.21 6.327v5.423c0 .333.143.571.428.738l5.947 3.449-1.95 1.118a.432.432 0 01-.476 0zm-.262 3.9c-2.688 0-4.662-2.021-4.662-4.519 0-.19.024-.38.047-.57l4.686 2.71c.286.167.571.167.856 0l5.97-3.448v2.26c0 .19-.07.333-.237.428l-4.543 2.616c-.619.357-1.356.523-2.117.523zm5.899 2.83a5.947 5.947 0 005.827-4.756C22.287 18.339 24 15.84 24 13.296c0-1.665-.713-3.282-1.998-4.448.119-.5.19-.999.19-1.498 0-3.401-2.759-5.947-5.946-5.947-.642 0-1.26.095-1.88.31A5.962 5.962 0 0010.205 0a5.947 5.947 0 00-5.827 4.757C1.713 5.447 0 7.945 0 10.49c0 1.666.713 3.283 1.998 4.448-.119.5-.19 1-.19 1.499 0 3.401 2.759 5.946 5.946 5.946.642 0 1.26-.095 1.88-.309a5.96 5.96 0 004.162 1.713z"/>',
);
const addItems = [
  { id: "client", label: "Open file", description: "src/lib/client.ts" },
  { id: "tests", label: "Test folder", description: "src/__tests__" },
];

const additions: Record<string, { id: string; label: string; kind: string }> = {
  client: { id: "client", label: "src/lib/client.ts", kind: "file" },
  tests: { id: "tests", label: "src/__tests__", kind: "folder" },
};

const models: ModelOption<string>[] = [
  { id: "claude-sonnet-5.5", name: "Claude Sonnet 5.5", group: "Anthropic", icon: anthropic },
  { id: "gpt-6.1-sol", name: "GPT-6.1 Sol", group: "OpenAI", icon: openai },
];

const levels: EffortLevel[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const modes = [
  { value: "ask", label: "Ask every time", description: "Approve each tool call" },
  { value: "edits", label: "Allow edits", description: "Edit files without asking" },
  { value: "full", label: "Full access", description: "Run anything without asking", danger: true },
];

const settings: SettingsEntry<string>[] = [
  { type: "toggle", id: "search", label: "Web search" },
  { type: "toggle", id: "memory", label: "Memory" },
];

const context = [
  { id: "layout", label: "src/app/layout.tsx", kind: "file" },
  { id: "auth", label: "Lines 12–40 of auth.ts", kind: "selection" },
  { id: "docs", label: "nextjs.org/docs/app/routing", kind: "url" },
];

const words = "Add a retry with backoff to the fetch client".split(" ");
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Plays back a recording instead of opening the microphone, so the example runs without a speech service.
const demoSource: DictationSource = {
  async *start(signal): AsyncGenerator<DictationEvent> {
    let heard = 0;
    for (let tick = 0; !signal.aborted; tick++) {
      const speaking = heard < words.length;
      yield { level: speaking ? 0.25 + 0.6 * Math.abs(Math.sin(tick * 1.7)) : 0.05 };
      if (speaking && tick % 5 === 4) {
        heard++;
        yield { text: words.slice(0, heard).join(" "), final: false };
      }
      await wait(80);
    }
    if (heard === 0 || signal.reason === "cancel") return;
    await wait(600);
    yield { text: words.slice(0, heard).join(" "), final: true };
  },
};

const chips = shallowRef(context);
const model = shallowRef<string | null>("claude-sonnet-5.5");
const effort = shallowRef("medium");
const mode = shallowRef("ask");
const values = shallowRef<SettingsValues>({ search: true, memory: false });
const box = shallowRef<HTMLElement>();

const remove = (id: string) => {
  chips.value = chips.value.filter((chip) => chip.id !== id);
};
const add = (id: string) => {
  const chip = additions[id];
  if (chip && !chips.value.some((current) => current.id === id)) chips.value = [...chips.value, chip];
};
// Focus goes to the prompt when the last chip is removed.
const editor = () => box.value?.querySelector<HTMLElement>('[data-slot="token-input-editor"]') ?? null;
</script>

<template>
  <div ref="box">
    <Composer aria-label="Message" :on-submit="props.onSubmit" :disabled="props.disabled">
      <ContextBar :chips="chips" :on-remove="remove" :focus-fallback="editor" />
      <ComposerInput aria-label="Prompt" :placeholder="props.placeholder" />
      <div class="flex min-w-0 flex-wrap items-center gap-1.5" style="grid-area: attach">
        <AddMenu :items="addItems" :on-action="add" />
        <ModelControl
          v-model:model="model"
          v-model:effort="effort"
          v-model:values="values"
          :models="models"
          :levels="levels"
          :settings="settings"
        />
        <ApprovalMode v-model:value="mode" :modes="modes" />
      </div>
      <Dictation :source="demoSource" />
      <ComposerSubmit />
    </Composer>
  </div>
</template>
