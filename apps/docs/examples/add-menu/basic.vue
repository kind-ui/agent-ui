<script setup lang="ts">
import type { ComposerDraft } from "@kind-ui/agent-ui/core";
import { h, shallowRef, type VNode } from "vue";
import { AddMenu } from "@/components/ui/vue/add-menu";
import { Composer, ComposerAttachments, ComposerInput, ComposerSubmit } from "@/components/ui/vue/composer";

const icon = (...children: VNode[]) =>
  h(
    "svg",
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    children,
  );

const items = [
  {
    id: "upload",
    label: "Upload file",
    description: "Attach files from your computer",
    icon: icon(
      h("path", { d: "M12 3v12" }),
      h("path", { d: "m17 8-5-5-5 5" }),
      h("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
    ),
  },
  {
    id: "context",
    label: "Add context",
    description: "Mention the open file",
    icon: icon(
      h("circle", { cx: "12", cy: "12", r: "4" }),
      h("path", { d: "M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8" }),
    ),
  },
  {
    id: "github",
    label: "GitHub",
    group: "Plugins",
    icon: icon(
      h("circle", { cx: "18", cy: "18", r: "3" }),
      h("circle", { cx: "6", cy: "6", r: "3" }),
      h("path", { d: "M13 6h3a2 2 0 0 1 2 2v7" }),
      h("path", { d: "M6 9v12" }),
    ),
    items: [
      { id: "github-issue", label: "Link issue", description: "#128 Retries never stop" },
      { id: "github-pr", label: "Review pull request", description: "#131 Add backoff" },
    ],
  },
  {
    id: "docs",
    label: "Docs",
    group: "Plugins",
    icon: icon(
      h("path", { d: "M12 7v14" }),
      h("path", {
        d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
      }),
    ),
    items: [{ id: "docs-retries", label: "Retries guide", description: "Mention the page" }],
  },
];

const inserts: Record<string, string> = {
  context: "[@client.ts](mention:src/client.ts)",
  "github-issue": "Fixes #128",
  "github-pr": "Review #131",
  "docs-retries": "[@Retries guide](mention:docs/retries)",
};

const draft = shallowRef<ComposerDraft>({ text: "", tokens: [], attachments: [] });
const files = shallowRef<HTMLInputElement>();
const send = () => new Promise<void>((resolve) => setTimeout(resolve, 1000));

function add(id: string) {
  if (id === "upload") files.value?.click();
  else draft.value = { ...draft.value, text: `${draft.value.text.trimEnd()} ${inserts[id]} `.trimStart() };
}

function attach(event: Event) {
  const input = event.target as HTMLInputElement;
  const chosen = Array.from(input.files ?? [], (file) => ({
    id: crypto.randomUUID(),
    file,
    name: file.name,
    size: file.size,
    mediaType: file.type,
  }));
  draft.value = { ...draft.value, attachments: [...draft.value.attachments, ...chosen] };
  input.value = "";
}
</script>

<template>
  <Composer v-model:value="draft" aria-label="Message" :on-submit="send">
    <ComposerAttachments />
    <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
    <AddMenu style="grid-area: attach" :items="items" :on-action="add" />
    <ComposerSubmit />
  </Composer>
  <input ref="files" type="file" multiple hidden @change="attach" />
</template>
