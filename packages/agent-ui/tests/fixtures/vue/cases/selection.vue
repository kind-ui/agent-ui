<script lang="ts">
export const variants = ["all", "refused", "static", "reduced", "none"] as const;
</script>

<script setup lang="ts">
import type { SelectionActionItem } from "@kind-ui/agent-ui";
import type { MotionMode, SelectionActionRun } from "@kind-ui/agent-ui/core";
import { onMounted } from "vue";
import { Selection } from "../../../../src/vue/selection.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const actions: SelectionActionItem[] = [
  { id: "ask", label: "Ask" },
  { id: "quote", label: "Quote" },
  { id: "copy", label: "Copy", description: "Copy the selected text" },
];

type Details = { reason: string; source: string; cancel: () => void };

const host = { actions: [] as unknown[][], dismissals: [] as unknown[][] };
const refused = props.variant === "refused";
const runnable = props.variant !== "static";
const motion: MotionMode | undefined =
  props.variant === "reduced" ? "reduced" : props.variant === "none" ? "none" : undefined;

function action({ actionId, text }: SelectionActionRun, details: Details) {
  host.actions.push([actionId, text, details.reason, details.source]);
  if (refused) details.cancel();
}

function dismiss(text: string, details: Details) {
  host.dismissals.push([text, details.reason, details.source]);
  if (refused) details.cancel();
}

onMounted(() => expose({ kindHost: host }));
</script>

<template>
  <div class="flex w-[32rem] flex-col gap-4 px-6 pt-60 pb-[150vh]">
    <p id="before">Text before the reply, outside the selection root.</p>
    <button id="outside" type="button">Elsewhere</button>
    <Selection
      id="selection"
      :actions="actions"
      :motion="motion"
      :on-action="runnable ? action : undefined"
      @dismiss="dismiss"
    >
      <p id="reply">Rate limits reset every hour. Each response carries the remaining count in its headers.</p>
      <p id="reply-2">Back off exponentially when a request is refused.</p>
    </Selection>
    <p id="after">Text after the reply, outside the selection root.</p>
  </div>
</template>
