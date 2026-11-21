<script lang="ts">
  import { GuardrailNotice } from "../components/ui/svelte/guardrail-notice/index.js";
</script>

<GuardrailNotice
  blocking
  label="Model output withheld"
  reason="The response included personal data."
  detail="Policy."
/>
