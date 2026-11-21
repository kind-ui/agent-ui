<script module lang="ts">
  export const variants = ["plain", "all", "reduced", "refusing", "sheet"];
</script>

<script lang="ts">
  import type { ChangeDetails } from "@ui-sdk/core";
  import { Picker } from "../../../../src/svelte/picker/index.js";
  import { expose } from "../../shared/expose.js";
  import { pickerHost, placeActions, places } from "../../shared/picker.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, record } = pickerHost();
  expose({ kindHost: host });
  const refusing = $derived(variant === "refusing");
</script>

{#if variant === "plain"}
  <div class="p-6">
    <Picker
      id="picker"
      label="Branch"
      items={[
        { value: "main", label: "main" },
        { value: "dev", label: "dev" },
      ]}
    />
  </div>
{:else}
  <div class="flex flex-col gap-4 p-6">
    <p id="above">Above</p
    ><div class="flex items-center gap-2">
      <Picker
        id="picker"
        label="Work in"
        items={places}
        actions={placeActions}
        {...refusing ? { value: "kind-ui/agent-ui" } : { defaultValue: "kind-ui/agent-ui" }}
        onValueChange={(value: string, details: ChangeDetails<string>) => {
          record("value")(value, details);
          if (refusing) details.cancel();
        }}
        onAction={(id: string, details: ChangeDetails<string>) => {
          record("action")(id, details);
          if (refusing) details.cancel();
        }}
        motion={variant === "reduced" ? "reduced" : undefined}
        presentation={variant === "sheet" ? "sheet" : undefined}
      /><span id="beside">Beside</span>
    </div>
  </div>
{/if}
