<script module lang="ts">
  export const variants = ["all"];
</script>

<script lang="ts">
  import { Loader } from "../../../../src/svelte/loader/index.js";
  import { StreamingText } from "../../../../src/svelte/streaming-text/index.js";
  import { ThinkingIndicator } from "../../../../src/svelte/thinking-indicator/index.js";
  import { TypingIndicator } from "../../../../src/svelte/typing-indicator/index.js";
  import { expose } from "../../shared/expose.js";

  let text = $state("Streaming text fades in");
  expose({ kindStream: { set: (next: string) => (text = next) } });
</script>

<div class="flex max-w-md flex-col items-start gap-6 p-6">
  <Loader />
  <ThinkingIndicator />
  <TypingIndicator />
  <p class="text-sm leading-6">
    <StreamingText {text} caret />
  </p>
</div>
