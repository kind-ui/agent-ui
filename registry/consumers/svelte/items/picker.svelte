<script lang="ts">
  import { Picker } from "../components/ui/svelte/picker/index.js";
</script>

<Picker
  label="Work in"
  items={[{ value: "agent-ui", label: "agent-ui", description: "~/code/agent-ui" }]}
  defaultValue="agent-ui"
/>
