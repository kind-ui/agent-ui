<script lang="ts">
  import { SettingsMenu } from "../components/ui/svelte/settings-menu/index.js";
</script>

<SettingsMenu settings={[{ type: "toggle", id: "search", label: "Web search" }]} defaultValues={{ search: true }} />
