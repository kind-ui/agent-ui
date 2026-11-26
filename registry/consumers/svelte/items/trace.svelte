<script lang="ts">
  import { Trace } from "../components/ui/svelte/trace/index.js";
</script>

<Trace label="Agent run" spans={[{ id: "run", name: "Answer the question", start: 0, end: 1200 }]} />
