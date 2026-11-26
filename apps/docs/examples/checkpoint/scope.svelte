<script lang="ts">
  import { Checkpoint } from "@/components/ui/svelte/checkpoint/index.js";

  let restored = $state(false);
</script>

<Checkpoint
  class="w-full max-w-md"
  description="Before “Switch to the session table”, 4 min ago."
  scopes={["both", "code", "conversation"]}
  changes={{ files: 3, additions: 12, deletions: 40 }}
  laterMessages={4}
  unrestorableMessages={2}
  {restored}
  onRestore={() => new Promise<void>((resolve) => setTimeout(resolve, 800)).then(() => (restored = true))}
/>
