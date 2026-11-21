<script lang="ts">
  import { ModelControl } from "../components/ui/svelte/model-control/index.js";
</script>

<ModelControl models={[{ id: "gpt-5", name: "GPT-5" }]} levels={[{ value: "high", label: "High" }]} defaultModel="gpt-5" />
