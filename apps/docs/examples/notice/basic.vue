<script setup lang="ts">
import { ref } from "vue";
import { Notice } from "@/components/ui/vue/notice";

const rateLimited = ref(true);
</script>

<template>
  <div class="flex w-full max-w-xl flex-col gap-3">
    <Notice label="Indexing your files">Answers may miss files added in the last minute.</Notice>
    <Notice variant="success" label="Connected to GitHub">
      The assistant can read your repositories now.
    </Notice>
    <Notice
      v-if="rateLimited"
      variant="warning"
      label="Rate limited"
      :on-dismiss="() => (rateLimited = false)"
    >
      Responses are slower for the next few minutes.
    </Notice>
    <button v-else type="button" data-kind-button="secondary" class="self-start" @click="rateLimited = true">
      Show the warning again
    </button>
    <Notice variant="error" label="Couldn't reach the model">
      Check your connection and try again.
      <template #actions>
        <button type="button" data-kind-button="secondary">Retry</button>
      </template>
    </Notice>
  </div>
</template>
