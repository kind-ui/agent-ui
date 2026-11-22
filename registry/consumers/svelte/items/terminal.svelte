<script lang="ts">
  import { Terminal } from "../components/ui/svelte/terminal/index.js";
</script>

<Terminal command="npm test" output={"\x1b[32m✓\x1b[0m 22 passed"} exitCode={0} defaultOpen />
