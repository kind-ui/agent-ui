<script lang="ts">
  import { Checkpoint } from "@/components/ui/svelte/checkpoint/index.js";

  let restored = $state(false);
</script>

<Checkpoint
  class="w-full max-w-md"
  description="Before editing auth.ts"
  {restored}
  onRestore={() => new Promise<void>((resolve) => setTimeout(resolve, 800)).then(() => (restored = true))}
/>
