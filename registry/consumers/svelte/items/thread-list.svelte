<script lang="ts">
  import { ThreadList } from "../components/ui/svelte/thread-list/index.js";
</script>

<ThreadList threads={[{ id: "a", title: "First chat", href: "#a" }]} now="2026-11-18" onNew={() => {}} />
