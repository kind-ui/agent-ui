<script lang="ts">
  import { Queue } from "../components/ui/svelte/queue/index.js";
</script>

<Queue label="Queue" items={[{ id: "tests", status: "pending", title: "Write the tests" }]} />
