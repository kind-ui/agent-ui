<script lang="ts">
  import { StreamingText } from "@/components/ui/svelte/streaming-text/index.js";

  const reply =
    "The three timeouts all come from the same upstream call. Adding a retry with backoff should cover them.";
  const words = reply.split(/(?<= )/);

  let count = $state(0);

  $effect(() => {
    const timer = setInterval(() => (count = count > words.length + 8 ? 0 : count + 1), 120);
    return () => clearInterval(timer);
  });
</script>

<p class="max-w-md">
  <StreamingText text={words.slice(0, count).join("")} caret={count < words.length} />
</p>
