<script module lang="ts">
  export const variants = ["all", "refusing"];
</script>

<script lang="ts">
  import type { SettingsValues } from "@kind-ui/agent-ui";
  import type { SettingsMenuChangeDetails } from "@kind-ui/agent-ui/core";
  import type { ChangeDetails } from "@ui-sdk/core";
  import { ModelControl } from "../../../../src/svelte/model-control/index.js";
  import { expose } from "../../shared/expose.js";
  import { controlHost, levels, modelActions, models, settings } from "../../shared/model-control.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, record } = controlHost();
  expose({ kindHost: host });
</script>

<div class="p-6">
  <ModelControl
    id="control"
    {models}
    {levels}
    {settings}
    defaultModel="opus"
    defaultEffort="medium"
    defaultValues={{ fast: false, context: "1m" }}
    onModelChange={(value: string, details: ChangeDetails<string>) => {
      record("model")(value, details);
      if (variant === "refusing") details.cancel();
    }}
    onEffortChange={(value: string, details: ChangeDetails<string>) => {
      record("effort")(value, details);
      if (variant === "refusing") details.cancel();
    }}
    onValuesChange={(values: SettingsValues, details: SettingsMenuChangeDetails) =>
      record(details.id)(values[details.id], details)}
    actions={modelActions}
    onAction={record("action")}
  />
</div>
