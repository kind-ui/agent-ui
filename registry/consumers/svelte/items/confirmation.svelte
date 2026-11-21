<script lang="ts">
  import { Confirmation } from "../components/ui/svelte/confirmation/index.js";
</script>

<Confirmation
  label="Run search_docs?"
  approval={{ approvalId: "a1", generation: 1, state: "requested" }}
  onApprove={() => {}}
  onDeny={() => {}}
  reason
/>
