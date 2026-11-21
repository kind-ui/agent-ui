<script setup lang="ts">
import { ref } from "vue";
import { ShareDialog } from "@/components/ui/vue/share-dialog";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const visibility = ref<"private" | "link">("private");
const link = ref<string>();

async function createLink() {
  await wait(800);
  link.value = "https://example.com/share/billing-export-retries";
}

async function revoke() {
  await wait(400);
  link.value = undefined;
  visibility.value = "private";
}
</script>

<template>
  <ShareDialog v-model:visibility="visibility" :link="link" :on-create-link="createLink" :on-revoke="revoke" />
</template>
