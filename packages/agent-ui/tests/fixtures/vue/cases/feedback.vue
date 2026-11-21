<script lang="ts">
export const variants = ["all", "controlled", "refuse", "reduced"] as const;
</script>

<script setup lang="ts">
import type { FeedbackRating, MotionMode } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { Feedback } from "../../../../src/vue/feedback.js";
import { expose } from "../../shared/expose.js";
import { feedbackHost } from "../../shared/feedback.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, record, comment } = feedbackHost();

const motion: MotionMode | undefined = props.variant === "reduced" ? "reduced" : undefined;
const refuse = props.variant === "refuse";
const controlled = props.variant === "controlled" || refuse;

const commentSent = shallowRef(false);
const rating = shallowRef<FeedbackRating>(null);

function ratingChange(next: FeedbackRating, details: Parameters<typeof record>[1]) {
  record(next, details);
  if (!refuse) rating.value = next;
}

onMounted(() =>
  expose({
    kindHost: {
      ...host,
      setCommentSent: (next: boolean) => {
        commentSent.value = next;
      },
    },
  }),
);
</script>

<template>
  <div class="flex flex-col items-start gap-4 p-6">
    <p id="above">Above</p>
    <div class="flex items-center gap-2">
      <Feedback
        id="feedback"
        v-bind="controlled ? { rating } : {}"
        :on-comment="comment"
        :comment-sent="commentSent"
        :motion="motion"
        @rating-change="ratingChange"
      />
      <button type="button" id="beside">Beside</button>
    </div>
  </div>
</template>
