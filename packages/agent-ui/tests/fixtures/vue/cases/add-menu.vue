<script lang="ts">
export const variants = ["all", "reduced", "refusing", "inert"] as const;
</script>

<script setup lang="ts">
import { onMounted } from "vue";
import { AddMenu } from "../../../../src/vue/add-menu.js";
import { addItems, addMenuHost } from "../../shared/add-menu.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, action } = addMenuHost();

function onAction(id: string, details: { reason: string; source?: string; cancel: () => void }) {
  action(id, details);
  if (props.variant === "refusing") details.cancel();
}

onMounted(() => expose({ kindHost: host }));
</script>

<template>
  <div class="p-6">
    <AddMenu
      id="add"
      :items="addItems"
      :on-action="variant === 'inert' ? undefined : onAction"
      :motion="variant === 'reduced' ? 'reduced' : undefined"
    />
  </div>
</template>
