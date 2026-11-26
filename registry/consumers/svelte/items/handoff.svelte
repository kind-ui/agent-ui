<script lang="ts">
  import { Handoff } from "../components/ui/svelte/handoff/index.js";
</script>

<Handoff
  from={{ id: "support", name: "Support" }}
  to={{ kind: "person", name: "Dana" }}
  reason="Refunds need a person"
  status="accepted"
/>
