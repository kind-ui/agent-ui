<script lang="ts">
  import { ActivityGraph } from "../components/ui/svelte/activity-graph/index.js";
</script>

<ActivityGraph days={[{ date: "2026-11-24", count: 3 }]} now="2026-11-25" timeZone="UTC" weeks={8} />
