<script module lang="ts">
  export const variants = ["all", "controlled", "refuse", "reduced"];
</script>

<script lang="ts">
  import type { FeedbackRating, MotionMode } from "@kind-ui/agent-ui/core";
  import { Feedback } from "../../../../src/svelte/feedback/index.js";
  import { expose } from "../../shared/expose.js";
  import { feedbackHost } from "../../shared/feedback.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, record, comment } = feedbackHost();

  let commentSent = $state(false);
  let rating: FeedbackRating = $state(null);
  let refuse = $derived(variant === "refuse");
  let controlled = $derived(variant === "controlled" || refuse);
  let motion: MotionMode | undefined = $derived(variant === "reduced" ? "reduced" : undefined);

  expose({ kindHost: { ...host, setCommentSent: (next: boolean) => (commentSent = next) } });
</script>

<div class="flex flex-col items-start gap-4 p-6">
  <p id="above">Above</p
  ><div class="flex items-center gap-2">
    {#if controlled}
      <Feedback
        id="feedback"
        bind:rating={() => rating, (next) => {
          if (!refuse) rating = next;
        }}
        onRatingChange={record}
        onComment={comment}
        {commentSent}
        {motion}
      />
    {:else}
      <Feedback id="feedback" onRatingChange={record} onComment={comment} {commentSent} {motion} />
    {/if}<button type="button" id="beside"
    >Beside</button>
  </div>
</div>
