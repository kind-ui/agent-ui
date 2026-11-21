<script module lang="ts">
  export const variants = ["all", "reduced", "refusing"];
</script>

<script lang="ts">
  import type { SettingsValues } from "@kind-ui/agent-ui";
  import type { SettingsMenuChangeDetails } from "@kind-ui/agent-ui/core";
  import { SettingsMenu } from "../../../../src/svelte/settings-menu/index.js";
  import { expose } from "../../shared/expose.js";
  import { initialValues, settings, settingsMenuHost } from "../../shared/settings-menu.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, change } = settingsMenuHost();
  expose({ kindHost: host });
  let values: SettingsValues = $state.raw(initialValues);
</script>

<div class="p-6">
  <SettingsMenu
    id="settings"
    {settings}
    {values}
    onValuesChange={(next: SettingsValues, details: SettingsMenuChangeDetails) => {
      change(next, details);
      if (variant === "refusing") details.cancel();
      else values = next;
    }}
    motion={variant === "reduced" ? "reduced" : undefined}
  />
</div>
