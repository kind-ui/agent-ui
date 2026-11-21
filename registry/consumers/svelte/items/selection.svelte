<script lang="ts">
  import { Selection } from "../components/ui/svelte/selection/index.js";
</script>

<Selection actions={[{ id: "ask", label: "Ask" }]} onAction={() => {}}>
  <p>Select some of this reply.</p>
</Selection>
